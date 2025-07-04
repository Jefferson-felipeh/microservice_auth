import { Body, Controller, Get, HttpCode, Post, Request, UseGuards } from "@nestjs/common";
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
    async signIn(@Body() dataSignIn: SignInDto):Promise<string> {
        //Por isso, o endpoint pode ser simples_
        return this.authService.signIn(dataSignIn.email,dataSignIn.password);
    }

    // @UseGuards()
    // @Get('data')
    // async data_user():Promise<object>{
    //     return {
    //         status: 'rota acessada!'
    //     }
    // }

    //Aqui iremos criar o endpoint que vai receber os dados da fila enviado pelo ms_users ao criar um usuário_
    @EventPattern('ms_auth_pattern')
    loadPolicyToUser(@Payload() data) {
        console.log(data);
        // return this.authService.loadPolicyToUser(data);
    }
}