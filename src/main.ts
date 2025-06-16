import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
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
