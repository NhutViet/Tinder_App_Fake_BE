import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SwipeDocument = Swipe & Document;

export enum SwipeType {
  LIKE = 'like',
  DISLIKE = 'dislike',
}

@Schema({ timestamps: true })
export class Swipe {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  fromUserId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  toUserId: Types.ObjectId;

  @Prop({ required: true, enum: SwipeType })
  type: SwipeType;

  createdAt: Date;
}

export const SwipeSchema = SchemaFactory.createForClass(Swipe);
