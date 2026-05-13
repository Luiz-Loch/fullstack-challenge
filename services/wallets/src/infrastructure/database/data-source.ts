import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { WalletOrmEntity } from '../persistence/wallet.orm-entity';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [WalletOrmEntity],
  migrations: [__dirname + '/../migrations/*{.js,.ts}'],
});
