import { registerAs } from "@nestjs/config";
import { JwtConfigInterface } from "../interfaces/jwt-config.interface";

export const JWTConfig = registerAs('JWT_CONFIG',():JwtConfigInterface => ({
    secret: process.env.JW_TOKEN_SECRET || 'jeffersons',
    access: {
        signOptions: {
            expiresIn: process.env.JWT_ACCESSTOKEN_EXPIRESIN || '10m'
        }
    },
    reflash: {
        signOptions: {
            expiresIn: process.env.JWT_REFLASHTOKEN_EXPIRESIN || '1h'
        }
    }
}));