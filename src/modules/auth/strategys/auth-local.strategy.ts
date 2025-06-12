import { HttpException, HttpStatus, Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from 'passport-local';
import { AuthService } from "../auth.service";

@Injectable()
//Essa é a estratégia do passport-local_
export class AuthLocalStrategy extends PassportStrategy(Strategy){

    constructor(private authService:AuthService){
        super({
            //Aqui dentro estou especificando quais cmapos da requisição eu quero pegar_
            usernameField: 'email',
            passwordField: 'password'
        });
    }

    async validate(email:string,password:string):Promise<object>{
        //Aqui dentro eu construo toda a lógica de verificação dos dados do usuário, pegando os dados da requisição
        //e verificando se esses dados estão presentes no banco de dados, e o usuário esta autorizado;
            if(!email || !password) throw new UnauthorizedException('Dados não fornecidos!')

            const sendDataUser = await this.authService.signIn(email,password);
            
            if(!sendDataUser) throw new UnauthorizedException('Email ou Senha Inválido!');
        
            //Esse usuário retornado será inserido no req.user do endpoint;
            return sendDataUser;
    }
}