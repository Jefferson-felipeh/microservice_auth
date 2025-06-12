import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
//Esse é o Guard do passport-local, que será usado para verificar a autorização do usuário na aplicação_
export class AuthGuardService extends AuthGuard('local'){};