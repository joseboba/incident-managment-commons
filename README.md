# Common Library

Common shared library between microservices with common definitions like errors types, filters, transformers, base entities, services and utilities.

### Bootstrapping

* configureMicroservice: Function that configures a nest application with the transformers, filters and logger services.

### Common

* BaseEntity: It is an abstract class that works as base type for all the entities, this base entity depend of typeorm.

* BusinessError: It is a base class for all custom errors, it is required that custom errors inherit from this class so that they could be interpreted and formatted by our error filters.

### Filter

* CustomExceptionFilter: This is a nestjs filter that handle custom error responses.

### Interceptor

* TransformInterceptor: This is a nestjs interceptor that apples a common controller response for all requests.

### Modules

* SharedModule: This is a shared module that exports some shared services within the application like the logger service, it is recommended to import this function in the main module (ex. AppModule).
* JwtAuthModule: Reusable module that adds JWT validation using Passport strategy `jwt`. Useful to protect microservices with shared auth logic. Exports strategy, `PassportModule`, and `JwtModule`.  
  See [JWT Auth Module](#jwt-auth-module) section for detailed configuration and usage.

### Requirements

* NodeJs v16 or greater
* NestJs framework v.9 or equivalent

### Usage

1. Install the library in you project

    ```bash
    npm install incident-managment-commons
    ```

2. Import IncidentManagementSharedModule in the main module of your application.

    ```javascript
    import { Module } from '@nestjs/common';

    import { IncidentManagementSharedModule } from 'incident-managment-commons';

    import { AppController } from './app.controller';

    @Module({
      imports: [
        IncidentManagementSharedModule,
      ],
      controllers: [AppController],
    })
    export class AppModule {}

    ```

3. Import and run the configureMicroservice function within your bootstrap application function

    ```javascript
    import { ConfigService } from '@nestjs/config';
    import { NestFactory } from '@nestjs/core';

    import { configureMicroservice } from 'incident-managment-commons';

    import { AppModule } from './app.module';

    async function bootstrap() {
      const app = await NestFactory.create(AppModule);

      configureMicroservice(app, {
        title: 'Example Service',
        description: 'API for example service',
        version: '1.0',
        basePath: 'example',
      });

      const configService = app.select(AppModule).get(ConfigService);

      const port = configService.get('PORT') || 3001;

      await app.listen(port);
    }
    bootstrap();
    ```

### JWT Auth Module

1. Add the following environment variables to your .env file:

    ```text
      JWT_SECRET=your-jwt-secret
    ```

2. Import `JwtAuthModule` in the main module of your application:

    ```typescript
    import { Module } from '@nestjs/common';
    import { JwtAuthModule } from 'incident-managment-commons';

    @Module({
      imports: [
        JwtAuthModule,
      ],
    })
    export class AppModule {}
    ```
3. The `JwtAuthGuard` is typically applied globally using `app.useGlobalGuards(...)` during application bootstrap, so you don't need to use `@UseGuards(JwtAuthGuard)` manually on each controller.

4. If you want to make a route public (no authentication required), use the `@Public()` decorator:

    ```typescript
    import { Controller, Get } from '@nestjs/common';
    import { Public } from 'incident-managment-commons';

    @Controller('healthz')
    export class HealthController {
      @Get()
      @Public()
      getHealthStatus() {
        return { status: 'ok' };
      }
    }
    ```