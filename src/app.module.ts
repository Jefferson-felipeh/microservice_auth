import { Module } from '@nestjs/common';
import { modules } from './modules/auth';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 10
      }
    ]),
    ...modules,
  ],
  providers: [ThrottlerGuard]
})
export class AppModule { }
