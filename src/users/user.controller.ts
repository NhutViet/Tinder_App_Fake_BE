import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateInterestsDto } from './dto/update-interests.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: Partial<User>) {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: Partial<User>,
    @Request() req,
  ) {
    // Chỉ cho phép user cập nhật profile của chính mình
    if (req.user.userId !== id) {
      throw new HttpException(
        'Không có quyền cập nhật profile này',
        HttpStatus.FORBIDDEN,
      );
    }
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  /**
   * Lấy danh sách user để swipe
   * Cần truyền danh sách userIds đã swipe qua query params
   */
  @UseGuards(JwtAuthGuard)
  @Get('swipe/candidates')
  async getUsersForSwipe(
    @Request() req,
    @Query('swipedIds') swipedIds?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.userId;
    const swipedUserIds = swipedIds ? swipedIds.split(',') : [];
    const limitNum = limit ? parseInt(limit, 10) : 10;

    return this.userService.getUsersForSwipe(userId, swipedUserIds, limitNum);
  }

  /**
   * Lấy profile của một user để hiển thị khi swipe
   */
  @UseGuards(JwtAuthGuard)
  @Get('swipe/profile/:id')
  async getProfileForSwipe(@Param('id') id: string) {
    return this.userService.getProfileForSwipe(id);
  }

  /**
   * Cập nhật sở thích của user
   * Sau khi đăng nhập, user sẽ vào màn hình chọn sở thích và gọi API này
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/interests')
  async updateInterests(
    @Param('id') id: string,
    @Body() updateInterestsDto: UpdateInterestsDto,
    @Request() req,
  ) {
    // Chỉ cho phép user cập nhật sở thích của chính mình
    if (req.user.userId !== id) {
      throw new HttpException(
        'Không có quyền cập nhật sở thích của user này',
        HttpStatus.FORBIDDEN,
      );
    }
    return this.userService.updateInterests(id, updateInterestsDto.interests);
  }
}
