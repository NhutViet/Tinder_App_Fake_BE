import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum InterestedIn {
  MALE = 'male',
  FEMALE = 'female',
  ALL = 'all',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, enum: Gender })
  gender: Gender;

  @Prop({ required: true, enum: InterestedIn })
  interestedIn: InterestedIn;

  @Prop({ required: true, type: Date })
  birthDate: Date;

  @Prop({ trim: true, default: '' })
  bio: string;

  @Prop({ type: [String], default: [] })
  photos: string[];

  @Prop({ type: [String], default: [] })
  interests: string[];

  @Prop({
    type: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    required: true,
    _id: false,
  })
  location: {
    lat: number;
    lng: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
