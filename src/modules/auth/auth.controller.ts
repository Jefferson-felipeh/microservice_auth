import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from "@nestjs/common";
import { Request as ExRequest, Response } from "express";
import { EventPattern, Payload } from "@nestjs/microservices";
import { Throttle } from "@nestjs/throttler";
import { SignInDto } from "./dtos/signIn.dto";
import { AuthService } from "./auth.service";
import { LoginUserDto } from "./dtos/loginUser.dto";

@Controller('auth')
export class AuthController {
    //Método constructor_
    constructor(private authService:AuthService){}
    
    /*
        OBS: Observe que o AuthService é chamado no Strategy-local, e não nesse endpoint;
        Isso porque, ao usar o useGuards(strategy-local), eu estou indicando ao nestjs que
        ele deve receber os dados no stategy-local para validar e autenticar as informações
        do usuário antes que ele faça login nesse endpoint.

        Fluxo:
        1. O request chega no endpoint /login.
        2. O Guard ativa o LocalStrategy(por meio do UseGuards('local')).
        3. O método validate() do LocalStrategy é executado.
        4. Se o validate() retornar um usuário valido, ele é injetado no req.user.
        5. E so depois disso é que o nest executa essse endpoint.

        Ou seja, toda a lógica de verificação do usuário(se existe o usuário apartir do email e se a senha for a correta)
        já acontece antes do endpoint ser executado.
    */

    @HttpCode(200)
    @Post('login')
    async signIn(
        @Body() dataSignIn: SignInDto,
        @Req() req:ExRequest,
        @Res({passthrough: true}) res:Response

        /**
         * Normalmente quando o @Res()(response) é injetado no nestjs, voce assume o controler totatl da resposta HTTP.
         * Ou seja,será preciso chamar o res.send(), res.json() ou etc. Caso não seja feito isso, a requisição pode ficar pendente e travar.
         * Mas ao usar o @Res({passthrough: true}), eu estou dizendo:
         * Quero acessar o objeto res para configurar coisas como cookies ou headers, mas ainda quero que o Nestjs 
         * cuide de enviar a resposta.
         * 
         * Usado para:
         * Definir cookies: res.cookie('token',jwt);
         * Para adicionar headers personalizados: res.headers('X-Custom','value');
         * Para logar ou inspecionar a resposta sem interferir no fluxo padrão.
         * 
         * Se usar apenas o @Res() sem passthrough, o Nestjs não envia a resposta automaticamente.
         */
    ):Promise<string> {
        //Por isso, o endpoint pode ser simples_

        const userAgent = req.headers['user-agent'] || '';
        const ipAddress = req.ip;

        const { auth, user, roles, permissions, menus, profiles } = await this.authService.signIn(dataSignIn.email,dataSignIn.password);

        this.setAuthCookies(res,auth.accessToken,auth.reflashToken);
        
        return auth.accessToken;
    }

    //Método que sai da aplicação_
    @Post('exit')
    exitApplication(
        @Req() req:ExRequest,
        @Res({passthrough: true}) res:Response
    ){
        console.log('executando a saida do usuário!');
        const reflashToken = req.cookies?.reflashToken;

        this.clearAuthCookies(res);

        return {status: 'SuccessFully',message: 'Logged out successfully'};
    }


    //Aqui iremos criar o endpoint que vai receber os dados da fila enviado pelo ms_users ao criar um usuário_
    @EventPattern('ms_auth_pattern')
    loadPolicyToUser(@Payload() data) {
        console.log(data);
        // return this.authService.loadPolicyToUser(data);
    }


    //Esse método será o responsável por salvar os cookies na resposta da requisição_
    //OBS: no front, no método que vai realizar a requisição, ao adiiconar o withCredentials = true,
    //estou indicando que o navegador vai passar o cookie automaticamente nas requisições que tiverem o withConditionals,
    //E esse método vai salvar o cookie usando o res que é a resposta da requisição, e o withCredentials será o resposnável por adicionar
    //na aba cookies do navegador_
    private setAuthCookies(res:Response,accessToken:string,refleshToken:string){
        res.cookie('accessToken', accessToken,{
            httpOnly: true, //Impede qeu o cookie seja acessado por javascript no navegador -> proteção contra XSS;
            secure: false, //Só envia o cookie em conexões HTTPS -> ativado quando esta em produção;
            sameSite: 'lax', //Protege contra ataques CSRF, permitindo envio em navegação normal(ex: links);
            maxAge: 15 * 60 * 1000, //Tempo de expiração do cookie -> 15 minutos para esse acessToken e 1h para o reflashToken;
            path: '/' //O cookie será enviado em todas as rotas da aplicação;
        });
        res.cookie('refleshToken', refleshToken,{
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 60 * 60 * 1000, //1h para expiração do cookie do reflashToken;
            path: '/'
        });

        //Observe que estou definindo os cookies e salvando eles na resposta da requisição(res.cookie()),
        //e ao definir esses cookies na resposta, o navegador do usuário salva automaticamente no cookie do navegador.
        //E em cada requisição na aplicação, esse cookie será consultado para verificar os seus dados.

        /*FLUXO:

            -> Seu backend define os cookies usando res.cookies(...) com os tokens(accessToken e reflashToken);
            -> Os cookies tem configurações seguras: httpOnly, secure sameSite, etc;
            -> O frontend envia requisições com {withCredentials: true};
            Como resultado o navegador armazena automaticamente os cookies recebidos na resposta, e os envia
            junto em futuras requisições para o mesmo domínio(ou subdominios,se permitido).

            Com isso, ao adicionar os cookies no navegados passando os tokens nos cookies na resposta da requisição:
            -> O navegador inclue os cookies(accessToken, reflashToken) na requisição automaticamente;
            -> No backend voce acessa os tokens com req.cookies.accessToken, por exemplo;
            -> O sistema pode verificar esse token e :
                - Autenticar usuários
                - Identificar a sessão
                - Conceder permissões baseadas na payload do token ou nos dados já armazenados


            Se o cookie é criado no login com res.cookie(...), e o frontend usa {withCredentials:true} nas requisições,
            o navegador assume o papel de guardião da sessão e envia esse cookie automaticamente em toda requisição. 
            Apartir dai o backend pode autenticar, autorizar e manter o fluxo seguro, sem o front precisar lidar com tokens
            diretamente.
        */

            //OBS: Toda vez que o tempo de expiração do cookie terminar, ele é deletado pelo navegador. Logo o navegador
            //será o responsável por fazer esse gerenciamento de tempo de expiração dos tokens automaticamente.
    }


    private clearAuthCookies(res:Response){
        //Limpando os cooikies quando o usuário sai da aplicação_
        res.clearCookie('accessToken',{
            secure: false,
            sameSite: 'lax',
            path: '/'
        });

        res.clearCookie('refleshToken',{
            secure: false,
            sameSite: 'lax',
            path: '/'
        });
    }
}