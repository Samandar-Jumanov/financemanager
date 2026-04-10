import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './transactions/transaction.entity';
import { Category } from './categories/category.entity';
import { BudgetLimit } from './common/budget-limit.entity';
import { User } from './auth/user.entity';
import { TransactionsModule } from './transactions/transactions.module';
import { CategoriesModule } from './categories/categories.module';
import { BudgetModule } from './common/budget.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesService } from './categories/categories.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('DATABASE_URL');
        const isLocal = url?.includes('localhost') || url?.includes('127.0.0.1');
        return {
          type: 'postgres',
          url,
          ssl: isLocal ? false : { rejectUnauthorized: false },
          entities: [Transaction, Category, BudgetLimit, User],
          synchronize: true,
          logging: false,
        };
      },
    }),
    AuthModule,
    TransactionsModule,
    CategoriesModule,
    BudgetModule,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly categoriesService: CategoriesService) {}

  async onModuleInit() {
    // Seed global default categories (userId = null) on every startup
    await this.categoriesService.seedDefaults();
  }
}
