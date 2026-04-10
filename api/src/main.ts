import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: '*', credentials: true });
  app.setGlobalPrefix('api');

  // Health check (used by Railway)
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/health', (_req: any, res: any) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('FinanceBot API')
    .setDescription('Business Finance Manager — REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication')
    .addTag('transactions', 'Income & expense transactions')
    .addTag('categories', 'Transaction categories')
    .addTag('budgets', 'Budget limits')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`✅ API running at http://localhost:${port}/api`);
  console.log(`📖 Swagger docs at http://localhost:${port}/docs`);
}
bootstrap();
