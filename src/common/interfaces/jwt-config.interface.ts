import { JwtModuleOptions } from "@nestjs/jwt"

export interface JwtConfigInterface{
    secret: string
    access: JwtModuleOptions
    reflash: JwtModuleOptions
}