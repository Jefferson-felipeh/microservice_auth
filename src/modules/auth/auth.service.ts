import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { lastValueFrom } from "rxjs";
import * as bcrypt from 'bcrypt';
import { PayloadInterface } from "./interfaces/payload.interface";
import { payloadDto } from "./dtos/payload.dto";
import { JwtService } from "@nestjs/jwt";
import { JWTConfig } from "src/common/config/jwt.config";
import { ConfigType } from "@nestjs/config";
import { TokenInterface } from "./interfaces/tokenInterface.interface";
import { LoginUserDto } from "./dtos/loginUser.dto";

@Injectable()
export class AuthService{
    //Como o ms-auth também se tornou m producer, onde ele vai emitir um evento ou mensagem para o ms-users,
    //Eu precisei configurar o clientProxy para que o ms-auth possoa enviar essa mensagens para o broker,
    //e o broker enviar para o consumer, que nesse caso é o ms-users_
    constructor(
        @Inject('MICROSERVICE_USERS') private clientUser: ClientProxy,
        private jwtService:JwtService,
        @Inject(JWTConfig.KEY)
        private jwtConfig:ConfigType<typeof JWTConfig>
    ){}

    async signIn(email:string,password:string):Promise<LoginUserDto>{
        try{
            //Estou buscando os dados do usuário com base no email fornecido por ele na requisição de login,
            //Esses dados de email e password vem do LocalStrategy capturado pelo UseGuards() no endpoint_
            const user = await lastValueFrom(
                //Estou usando a função send(), pois diferente do emit() que so emite uma mensagem/evento,
                //o send() vai emitir uma mensagem e vai esperar um retorno_
                this.clientUser.send('find-user-by-email',email.toLocaleLowerCase())
            );
            //Os usuários já deve retornar tanto os dados do usuários, quanto os dados das suas permissões_
            if(!user || user == null) throw new UnauthorizedException('Email Inválido!');
            
            console.log(user)
            //Aqui será construida a lógica de verificação das senhas, e da criação de tokens de autorização_
            const comparePassword = await this.verifyPasswords(password,user.password);
    
            if(!comparePassword) throw new UnauthorizedException('Senha Incorreta!');
            //Gerando o token de autorização_
            const token = this.generatedToken({user: user.email, sub:user.id});

            if(!token) throw new UnauthorizedException('Usuário não Autorizado!');
            
            const obj = {
                auth: token,
                user: {
                    id:user.id,
                    firstname:user.firstname,
                    lastname: user.lastname,
                    email:user.email,
                    cep:user.cep,
                }
            };
            console.log(obj);
            return obj;
        }catch(error){
            throw new UnauthorizedException();
        }
    }

    //Comparando as senhas_
    async verifyPasswords(passwordReq:string,passwordHash:string){
        if(!passwordReq || !passwordHash) throw new UnauthorizedException('Senha não fornecida');

        const comparePassword = await bcrypt.compare(passwordReq,passwordHash);

        if(!comparePassword) throw new UnauthorizedException('Senha Incorreta!');

        return comparePassword;
    }

    generatedPayload(payload:payloadDto):PayloadInterface{
        return {
            user: payload.user,
            sub:payload.sub
        }
    }

    generatedAcessToken(payload:PayloadInterface):string{
        return this.jwtService.sign(payload, {
            //Sempre iremos passar a chave secreta e o espiresIn para gerar os tokens,
            //Porem os dois tokens terão tempos de expiração diferentes_
            secret: this.jwtConfig.secret,
            expiresIn: this.jwtConfig.access.signOptions?.expiresIn
        });
    }

    generatedReflashToken(payload: PayloadInterface):string{
        return this.jwtService.sign(payload, {
            secret: this.jwtConfig.secret,
            expiresIn: this.jwtConfig.reflash.signOptions?.expiresIn
        });
    }

    generatedToken(user:payloadDto):TokenInterface{
        const payload = this.generatedPayload(user);
        const accessToken = this.generatedAcessToken(payload);
        const reflashToken = this.generatedReflashToken(payload);

        return {
            accessToken,
            reflashToken
        }
    }
}