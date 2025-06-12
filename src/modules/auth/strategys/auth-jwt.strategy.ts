import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from 'passport-jwt';

@Injectable()
//Essa é a estratégia JWT que vai capturar as informações do header e verificar a autenticação e autorização dos usuários_
export class AuthJWTStrategy extends PassportStrategy(Strategy){
    constructor(){
        super({
           jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey:'jeffersons',
        });
    }

    async validate(){
        
    }
}