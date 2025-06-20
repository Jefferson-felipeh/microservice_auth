//Biblotecas para utilização do redis para definir sessões na aplicação_
import * as session from 'express-session';
import * as connectRedis from 'connect-redis';
import * as redis from 'redis';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
//O ThrottlerGuard funciona para limitar as infinitas tentativas de requisições nos endpoints da aplicação;
import { ThrottlerGuard } from '@nestjs/throttler';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //Dessa forma, o nosso microservice de autenticação vai tanto ser um producer quando um consumer,
  //e para ser um consumer, preciso configurar o microservice receiver no próprio main.ts_
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://guest:guest@localhost:5672'],//Endereço do rabbitmq no docker;
      queue: 'ms_auth',//Nome da fila do ms_auth;
      queueOptions: {
        durable: true
      }
    }
  });
  app.startAllMicroservices();//Inicia o RMQ;
  await app.listen(process.env.PORT ?? 3031);
}
bootstrap();
