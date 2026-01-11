import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  /**
   * Gửi tin nhắn
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async sendMessage(@Request() req, @Body() body: SendMessageDto) {
    const senderId = req.user.userId;
    return this.messageService.sendMessage(
      senderId,
      body.receiverId,
      body.text,
    );
  }

  /**
   * Lấy tin nhắn giữa 2 user
   */
  @UseGuards(JwtAuthGuard)
  @Get('with/:otherUserId')
  async getMessagesBetweenUsers(
    @Request() req,
    @Param('otherUserId') otherUserId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    const userId = req.user.userId;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const beforeDate = before ? new Date(before) : undefined;

    return this.messageService.getMessagesBetweenUsers(
      userId,
      otherUserId,
      limitNum,
      beforeDate,
    );
  }

  /**
   * Lấy lịch sử tin nhắn theo match
   */
  @UseGuards(JwtAuthGuard)
  @Get('match/:matchId')
  async getMessagesByMatch(
    @Param('matchId') matchId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const beforeDate = before ? new Date(before) : undefined;

    return this.messageService.getMessagesByMatch(
      matchId,
      limitNum,
      beforeDate,
    );
  }

  /**
   * Đánh dấu tin nhắn đã xem
   */
  @UseGuards(JwtAuthGuard)
  @Post('seen/match/:matchId')
  async markAsSeen(
    @Request() req,
    @Param('matchId') matchId: string,
  ) {
    const userId = req.user.userId;
    const count = await this.messageService.markAsSeen(matchId, userId);
    return { markedCount: count };
  }

  /**
   * Đánh dấu tất cả tin nhắn từ một user là đã xem
   */
  @UseGuards(JwtAuthGuard)
  @Post('seen/user/:otherUserId')
  async markAllAsSeenFromUser(
    @Request() req,
    @Param('otherUserId') otherUserId: string,
  ) {
    const userId = req.user.userId;
    const count = await this.messageService.markAllAsSeenFromUser(
      userId,
      otherUserId,
    );
    return { markedCount: count };
  }

  /**
   * Lấy số tin nhắn chưa đọc
   */
  @UseGuards(JwtAuthGuard)
  @Get('unread/count')
  async getUnreadCount(@Request() req) {
    const userId = req.user.userId;
    const count = await this.messageService.getUnreadCount(userId);
    return { unreadCount: count };
  }

  /**
   * Lấy số tin nhắn chưa đọc với một user cụ thể
   */
  @UseGuards(JwtAuthGuard)
  @Get('unread/count/:otherUserId')
  async getUnreadCountWithUser(
    @Request() req,
    @Param('otherUserId') otherUserId: string,
  ) {
    const userId = req.user.userId;
    const count = await this.messageService.getUnreadCountWithUser(
      userId,
      otherUserId,
    );
    return { unreadCount: count };
  }
}
