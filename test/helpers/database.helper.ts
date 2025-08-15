import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer | null;

export class DatabaseHelper {
  static async getMongoUri(): Promise<string> {
    if (!mongoServer) {
      mongoServer = await MongoMemoryServer.create();
    }
    return mongoServer.getUri();
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
