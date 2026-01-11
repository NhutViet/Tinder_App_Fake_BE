import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MatchDocument = Match & Document;

@Schema({ timestamps: true })
export class Match {
  @Prop({ required: true, type: [Types.ObjectId], ref: 'User' })
  userIds: Types.ObjectId[]; // [userA, userB]

  createdAt: Date; // Automatically added by timestamps: true
}

export const MatchSchema = SchemaFactory.createForClass(Match);
