import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
//Essse é o Guard do JWT que será usado nos endpoints_
export class AuthGuardJwt extends AuthGuard('jwt'){}