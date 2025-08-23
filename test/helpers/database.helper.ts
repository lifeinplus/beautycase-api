import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection } from 'mongoose';

export type Collections =
  | 'brands'
  | 'categories'
  | 'lessons'
  | 'makeupbags'
  | 'products'
  | 'questionnaires'
  | 'stages'
  | 'stores'
  | 'tools'
  | 'users';

let mongoServer: MongoMemoryServer | null = null;

export class DatabaseHelper {
  static async getMongoUri(): Promise<string> {
    if (!mongoServer) {
      mongoServer = await MongoMemoryServer.create();
    }
    return mongoServer.getUri();
  }

  static async clearDatabase(connection: Connection): Promise<void> {
    const collections = connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }

  static async clearCollection(
    connection: Connection,
    collectionName: Collections,
  ): Promise<void> {
    const collections = connection.collections;
    if (collections[collectionName]) {
      await collections[collectionName].deleteMany({});
    }
  }

  static async closeConnection() {
    if (mongoServer) {
      await mongoServer.stop();
      mongoServer = null;
    }
  }
}

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: async () => {
        const uri = await DatabaseHelper.getMongoUri();
        return { uri };
      },
    }),
  ],
})
export class TestDatabaseModule {}
