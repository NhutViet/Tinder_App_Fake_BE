import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class UpdateInterestsDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Phải chọn ít nhất 1 sở thích' })
  @IsString({ each: true, message: 'Mỗi sở thích phải là chuỗi' })
  interests: string[];
}
