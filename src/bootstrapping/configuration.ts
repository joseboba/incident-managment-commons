// NestJS imports
import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// Third-party imports
import { json, urlencoded } from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards';
import { CustomExceptionFilter } from '../filters';
import { TransformInterceptor } from '../interceptors';

export interface IConfiguration {
  basePath: string;
  title: string;
  description: string;
  version: string;
}

export function configureMicroservice(
  app: INestApplication,
  configuration: IConfiguration,
) {
  const reflector = app.get(Reflector);

  app.useGlobalGuards(new JwtAuthGuard(reflector));
  app.useGlobalFilters(new CustomExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));
  app.setGlobalPrefix(configuration.basePath);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableCors();

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  const config = new DocumentBuilder()
    .setTitle(configuration.title)
    .setDescription(configuration.description)
    .setVersion(configuration.version)
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${configuration.basePath}/docs`, app, document);
}
