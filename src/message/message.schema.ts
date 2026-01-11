import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Match' })
  matchId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  senderId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  text: string;

  @Prop({ default: false })
  seen: boolean;

  createdAt: Date; // Automatically added by timestamps: true
}

export const MessageSchema = SchemaFactory.createForClass(Message);
