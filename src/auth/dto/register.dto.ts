import { IsEmail, IsString, MinLength, IsEnum, IsDateString, IsObject, ValidateNested, IsNotEmpty, IsNumber, IsArray, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { Gender, InterestedIn } from '../../users/user.schema';

class LocationDto {
  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @IsNumber()
  @IsNotEmpty()
  lng: number;
}

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsEnum(InterestedIn)
  interestedIn: InterestedIn;

  @IsDateString()
  birthDate: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photos?: string[];
}
