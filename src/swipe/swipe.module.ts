import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SwipeController } from './swipe.controller';
import { SwipeService } from './swipe.service';
import { Swipe, SwipeSchema } from './swipe.schema';
import { MatchModule } from '../match/match.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Swipe.name, schema: SwipeSchema }]),
    MatchModule,
  ],
  controllers: [SwipeController],
  providers: [SwipeService],
  exports: [SwipeService],
})
export class SwipeModule {}
