npm install bcrypt
npm install @nestjs/jwt jsonwebtoken
npm install @nestjs/passport passpor-local
npm install @nestjs/microservices
npm install class-validator class-transformer
npm install @nestjs/config
npm install swagger
npm install amqplib
npm install amqp-connection-manager
npm install typeorm @netsjs/typeorm pg

## OBS:
Eu posso construir o microservice de autenticação de duas formas:
1º Quando o ms-auth não precisa de banco_
    1- Ele não vai armazenar dados;
    2- Ele consome os dados do ms-users via client.send();
    3- Apenas verifica a senha com bcrypt e gera token com @nestjs/jwt;
    4- Toda a fonte de verdade sobre usuários esta no microservice de usuarios;
Esse é o melhor modelo para manter responsábiçidade única e serviços desacoplados.

2º Quando o ms-auth precisa de banco de dados_
1- Reflesh token persistente{
    > Se for imlementado o reflesh token com blaclist ou revogação de sções, será necessário armazenar:
    - Token ID
    - ID do usuário
    - Data de expiração
} Isso evita que um relfesh token seja reutilizado;
2- Sessões ativas / Login Simultaneo(Para controlar sessões por dipositivos, horário, ip e etc);
3- Token revogation list(WJT blacklist){
    - se voce quer invalidar tokens antes do vencimento;
    - Isso exige um armazenamento que prmita veificar se o token esta banido.
};
4- Logs de autenticação / AUditoria;

<hr/>

## OBS:
Um clientProxy é necessário sempre que um microservice precisa enviar mensagem para outro microservice;
Ou seja, sempre irei configurar o ClientProxy no microservice quando ele for um producer.
Dessa forma, o nosso ms-auth precisará ser um producer para enviar mensagem ao ms-users a fim de receber dados
para autenticação do usuário.
A forma recomendada de configurar o ClientProxy do producer é sempre do seu módulo;

Já para escutar mensagem/receber mensagem de um producer, o ms vai precisar ser um consumer,
para isso, no main.ts, irei configurar o microservice receiver para que ele consuma eventos(por exemplo,
para que ele escute evento de um outro microservice producer e receba os dados desse evento).

<hr/>

## OBS: 
<p>Após adicionarmos o LocalStrategy para autenticar as credenciais do usuário quando ele faz login,
irei adicionar a strategy JWT para geração de tokens para autorização.</p>
<p>Para isso, precisaremos fazer algumas configurações necessárias para adicionarmos Autenticação JWT no ms.</p>
1. Precisamos entender que para autorização com JWT irei precisar de um AcessToken, ReflashToken,
cada um tem essa estrutura: 
    AccessToken: {                     ReflashToken{
       secret: '',                           secret: '',
       expiresIn: ''                         expiresIn: ''
    }                                  }
Para preecher esses valores, irei utilizar variaveis de ambiente;
2. Depois de criarmos as variaveis de ambiente que irá preencher esses valores para criação dos tokens,
irei agrupar e organizar variaveis relacionadas para a configuração do JWT, para isso irei criar um namespace_
E assim ficará o namespace para agrupar variaveis relacionadas ao JWT:
import { registerAs } from "@nestjs/config";
import { JwtConfigInterface } from "../interfaces/jwt-config.interface";

export const JWTConfig = registerAs('JWT_CONFIG',():JwtConfigInterface => ({
    secret: process.env.JW_TOKEN_SECRET || 'jeffersons',
    access: {
        signOptions: {
            expiresIn: process.env.JWT_ACESSTOKEN_EXPIRESIN
        }
    },
    reflash: {
        signOptions: {
            expiresIn: process.env.JWT_REFLASHTOKEN_EXPIRESIN
        }
    }
}));

Também precisei criar a interface para esse namespace: 
import { JwtModuleOptions } from "@nestjs/jwt"
export interface JwtConfigInterface{
    secret: string
    access: JwtModuleOptions
    reflash: JwtModuleOptions
}

3. Após isso, irei configurar o JwtModule no módulo que vai utilizar o JWTService, que é o próprio AuthModule_
JwtModule.registerAsync({
            imports: [JwtModule],
            inject: [JWTConfig.KEY],
            useFactory: (config:ConfigType<typeof JWTConfig>) => ({
                secret: config.secret,
                signOptions: config.access.signOptions
            }),
        })

<!-- ---------------------------------------------------------------------------------------------------- -->

CRIANDO SESSÕES COM O BANCO DE DADOS REDIS_

Instalação das dependencias_
npm install express-session 
npm install connect-redis
npm install ioredis
npm install redis

Irei precisar instalar o servidor redis, para isso irei criar um container docker para rodar o servidor redis:
com o comando: docker run -d --name redis-server -p 6379:6379 redis

-d -> Roda em background
--name redis-server -> Da um nome ao container
-p 6379:6379 -> Mapeia a porta padrão do redis
redis -> Usa a imagem oficial do redis no DockerHub

Após isso será criado um uma imagem com um container docker do servidor redis rodando;
Para verificar se o servidor redis esta funcionando, basta entrar no container com esse comando:
docker exec -it redis-server redis-cli

Após esse comando, voce entrará no container do servidor redis que esta rodando no docker,
e para verificar se ele esta executando, digite o comando 'ping', e ele vai responder com 'PONG'.

Por padrão, os dados são volateis(eles somes quando o container para), mas para persistir os dados armazenados,
podemos criar um volume no docker para armazenar esses dados, iremos precisar deletar ou remover o server
do redis criado no docker anteriormente, com o comando: 
docker stop redis-server(Parar)
docker rm redis-server(Remover)
 
 e iremos criar um volume com o comando: 
docker run -d --name redis-server -p 6379:6379 -v redis_data:/data redis --appendonly yes
Após esse comando, será criado uma nova image com um novo container e um volume para persistir os dados
do servidor do redis.