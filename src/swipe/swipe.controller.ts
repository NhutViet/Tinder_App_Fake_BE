import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Param,
  Query,
} from '@nestjs/common';
import { SwipeService } from './swipe.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateSwipeDto } from './dto/create-swipe.dto';

@Controller('swipes')
export class SwipeController {
  constructor(private readonly swipeService: SwipeService) {}

  /**
   * Ghi nhận like / dislike
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async createSwipe(@Request() req, @Body() body: CreateSwipeDto) {
    const fromUserId = req.user.userId;
    return this.swipeService.createSwipe(
      fromUserId,
      body.toUserId,
      body.type,
    );
  }

  /**
   * Kiểm tra user đã swipe người này chưa
   */
  @UseGuards(JwtAuthGuard)
  @Get('check/:toUserId')
  async hasSwiped(@Request() req, @Param('toUserId') toUserId: string) {
    const fromUserId = req.user.userId;
    return {
      hasSwiped: await this.swipeService.hasSwiped(fromUserId, toUserId),
    };
  }

  /**
   * Kiểm tra người kia có like mình không
   */
  @UseGuards(JwtAuthGuard)
  @Get('liked/:toUserId')
  async hasLikedMe(@Request() req, @Param('toUserId') toUserId: string) {
    const fromUserId = req.user.userId;
    return {
      hasLiked: await this.swipeService.hasLikedMe(fromUserId, toUserId),
    };
  }

  /**
   * Lấy danh sách user đã swipe
   */
  @UseGuards(JwtAuthGuard)
  @Get('swiped')
  async getSwipedUsers(@Request() req) {
    const userId = req.user.userId;
    const swipedUserIds = await this.swipeService.getSwipedUsers(userId);
    return { swipedUserIds };
  }

  /**
   * Thống kê số lượt swipe/ngày
   */
  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async getSwipeStats(
    @Request() req,
    @Query('date') date?: string,
  ) {
    const userId = req.user.userId;
    const dateObj = date ? new Date(date) : undefined;
    return this.swipeService.getSwipeStats(userId, dateObj);
  }
}
