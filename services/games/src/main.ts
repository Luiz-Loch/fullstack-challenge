import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

/** Bootstraps the Game Service: registers global pipes, mounts Swagger and starts the HTTP server. */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('games');

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Game Service')
    .setDescription('Crash game rounds, bets and provably fair verification')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('games/docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  const port = app.get(ConfigService).getOrThrow<string>('PORT');
  await app.listen(port, '0.0.0.0');
  console.log(`Games service running on port ${port}`);
}

bootstrap();
