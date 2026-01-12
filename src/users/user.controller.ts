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
import { SwipeService } from '../swipe/swipe.service';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly swipeService: SwipeService,
  ) {}

  @Post()
  create(@Body() createUserDto: Partial<User>) {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  /**
   * Lấy danh sách user để swipe
   * Tự động loại trừ những user đã swipe (LIKE hoặc DISLIKE)
   */
  @UseGuards(JwtAuthGuard)
  @Get('swipe/candidates')
  async getUsersForSwipe(
    @Request() req,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.userId;
    // Tự động lấy danh sách user đã swipe từ database
    const swipedUserIds = await this.swipeService.getSwipedUsers(userId);
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
   * Lấy danh sách user có chung sở thích cho trang home
   * Chỉ hiển thị những user có ít nhất một sở thích chung với current user
   * Tự động loại trừ những user đã swipe (LIKE hoặc DISLIKE)
   * Hỗ trợ phân trang với query param: page (mỗi page 20 items)
   */
  @UseGuards(JwtAuthGuard)
  @Get('home/candidates')
  async getUsersForHome(
    @Request() req,
    @Query('page') page?: string,
  ) {
    const userId = req.user.userId;
    // Tự động lấy danh sách user đã swipe từ database
    const swipedUserIds = await this.swipeService.getSwipedUsers(userId);
    const pageNum = page ? parseInt(page, 10) : 1;

    return this.userService.getUsersWithCommonInterests(
      userId,
      swipedUserIds,
      pageNum,
    );
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
