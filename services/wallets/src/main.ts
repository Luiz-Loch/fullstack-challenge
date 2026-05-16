import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

/** Bootstraps the Wallet Service: registers global pipes, mounts Swagger and starts the HTTP server. */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true
  }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Wallet Service')
    .setDescription('Player wallet management')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('wallets/docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL ?? 'amqp://localhost:5672'],
      queue: 'wallet_queue',
      queueOptions: { durable: true },
    },
  });

  await app.startAllMicroservices();

  const port = app.get(ConfigService).getOrThrow<string>('PORT');
  await app.listen(port, '0.0.0.0');
  console.log(`Wallets service running on port ${port}`);
}

bootstrap();
