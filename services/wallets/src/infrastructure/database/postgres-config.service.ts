import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class PostgresConfigService
    implements TypeOrmOptionsFactory {
      
  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      url: this.configService.getOrThrow<string>('DATABASE_URL'),
      autoLoadEntities: true,
      migrations: [__dirname + '/../migrations/*{.js,.ts}'],
      migrationsRun: true,
      synchronize: false,
    };
  }
}
