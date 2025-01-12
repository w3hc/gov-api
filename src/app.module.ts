import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DaoService } from './database/dao.service';
import { DaoController } from './database/dao.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController, DaoController],
  providers: [AppService, DaoService],
})
export class AppModule {}
