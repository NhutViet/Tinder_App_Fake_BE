import { Module, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule, InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { SwipeModule } from './swipe/swipe.module';
import { MatchModule } from './match/match.module';
import { MessageModule } from './message/message.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI');
        const logger = new Logger('MongoDB');
        
        logger.log(`Đang kết nối đến MongoDB...`);
        logger.log(`URI: ${uri?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`); // Ẩn password trong log
        
        return {
          uri,
        };
      },
      inject: [ConfigService],
    }),
    UserModule,
    AuthModule,
    SwipeModule,
    MatchModule,
    MessageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger('MongoDB');

  constructor(@InjectConnection() private connection: Connection) {}

  onModuleInit() {
    this.logger.log('Đang kiểm tra kết nối MongoDB...');
    
    if (this.connection.readyState === 1) {
      this.logger.log('✅ Đã kết nối MongoDB thành công!');
      if (this.connection.db) {
        this.logger.log(`Database: ${this.connection.db.databaseName}`);
      }
      if (this.connection.host) {
        this.logger.log(`Host: ${this.connection.host}`);
      }
    } else {
      this.logger.warn(`⚠️ Trạng thái kết nối: ${this.getConnectionState()}`);
    }

    this.connection.on('connected', () => {
      this.logger.log('✅ MongoDB đã kết nối!');
      if (this.connection.db) {
        this.logger.log(`Database: ${this.connection.db.databaseName}`);
      }
    });

    this.connection.on('error', (err) => {
      this.logger.error('❌ Lỗi kết nối MongoDB:', err.message);
    });

    this.connection.on('disconnected', () => {
      this.logger.warn('⚠️ MongoDB đã ngắt kết nối');
    });
  }

  private getConnectionState(): string {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    return states[this.connection.readyState] || 'unknown';
  }
}
