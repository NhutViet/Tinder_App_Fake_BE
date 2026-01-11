import { IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { SwipeType } from '../swipe.schema';

export class CreateSwipeDto {
  @IsString()
  @IsNotEmpty()
  toUserId: string;

  @IsEnum(SwipeType)
  type: SwipeType;
}
