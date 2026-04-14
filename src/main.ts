import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const config = new DocumentBuilder()
    .setTitle('KAWSAYMI CARE API')
    .setDescription(
      'Backend API para gestión de medicamentos y cuidado personal',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'KAWSAYMI CARE API Docs',
    // Swagger UI es usable en mobile pero necesita ajustes de layout.
    customCss: `
      /* Reduce padding/spacing on small screens */
      @media (max-width: 768px) {
        .swagger-ui .wrapper { padding: 0 12px; }
        .swagger-ui .info { margin: 16px 0 12px; }
        .swagger-ui .info .title { font-size: 22px; line-height: 1.2; }

        /* Make the topbar less dominant */
        .swagger-ui .topbar { padding: 8px 0; }
        .swagger-ui .topbar .download-url-wrapper { display: none; }

        /* Buttons and inputs: make them easier to tap */
        .swagger-ui .btn { padding: 10px 12px; }
        .swagger-ui input[type=text],
        .swagger-ui input[type=password],
        .swagger-ui select,
        .swagger-ui textarea {
          font-size: 16px; /* prevent iOS zoom on focus */
        }

        /* Let summary row wrap instead of overflowing */
        .swagger-ui .opblock-summary { flex-wrap: wrap; gap: 8px; }
        .swagger-ui .opblock-summary-path { word-break: break-word; }
        .swagger-ui .opblock-summary-description { width: 100%; }

        /* Keep tables readable */
        .swagger-ui table { display: block; overflow-x: auto; }
      }
    `,
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
