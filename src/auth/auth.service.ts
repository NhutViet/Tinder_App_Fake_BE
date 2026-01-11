import {
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../users/user.service';
import { User } from '../users/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      // Convert Mongoose document to plain object
      const userAny = user as any;
      const userObj = userAny.toObject ? userAny.toObject() : user;
      const { password: _, ...result } = userObj;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user._id };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async register(createUserDto: any): Promise<any> {
    if (!createUserDto.email || !createUserDto.password) {
      throw new HttpException(
        'Email và password là bắt buộc',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingUser = await this.userService.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new HttpException('Email đã được sử dụng', HttpStatus.CONFLICT);
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.userService.create({
      ...createUserDto,
      password: hashedPassword,
    });

    // Convert Mongoose document to plain object
    const userAny = user as any;
    const userObj = userAny.toObject ? userAny.toObject() : user;
    const { password: _, ...result } = userObj;
    return this.login(result);
  }
}
