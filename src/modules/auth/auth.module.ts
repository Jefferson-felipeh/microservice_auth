import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { ConfigModule, ConfigType } from "@nestjs/config";
import { AuthGuardService } from "./guards/authGuardService.guard";
import { AuthLocalStrategy } from "./strategys/auth-local.strategy";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { JWTConfig } from "src/common/config/jwt.config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from '@nestjs/core';

@Module({
    imports: [

    //ThrottlerModule.forRoot({
    //   ttl: 60,
    //   limit: 10,
    //}),

        ConfigModule.forRoot({
            isGlobal: true,
            load: [JWTConfig],
            envFilePath: ['.env'],
            ignoreEnvFile: false
        }),

        //Agora como o microservice de autenticação envia uma mensagem para o microservice de usuários,
        //ele precisa ser um producer, e para ser um producer, preciso configurar o clientProxy no authModule,
        //para que só assim ele consiga emitir uma mensagem para o microservice de usuarios, que agora se comportará
        //como um consumer, cujo consumer também irá precisat da ocnfiguração do microservice receiver_
        ClientsModule.register([
            {
                name: 'MICROSERVICE_USERS',
                transport: Transport.RMQ,
                options: {
                    urls: ['amqp://guest:guest@localhost:5672'],
                    queue: 'ms-users',
                    queueOptions: {
                        durable: true
                    }
                }
            }
        ]),

        //Preciso configurar o módulo do JWT no AuthModule_
        //Para implementar qualquer funcionalidade do JWT na aplicação, é necessário registra-lo no módule_
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [JWTConfig.KEY],
            useFactory: (config:ConfigType<typeof JWTConfig>) => ({
                secret: config.secret,
                signOptions: config.access.signOptions
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        AuthGuardService,
        AuthLocalStrategy,
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ]
})
export class AuthModule { }