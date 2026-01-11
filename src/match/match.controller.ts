import {
  Controller,
  Get,
  Delete,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { MatchService } from './match.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('matches')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  /**
   * Lấy danh sách match của user
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  async getMatches(@Request() req) {
    const userId = req.user.userId;
    return this.matchService.getMatches(userId);
  }

  /**
   * Lấy thông tin match với user khác
   */
  @UseGuards(JwtAuthGuard)
  @Get('with/:otherUserId')
  async getMatchWithUser(
    @Request() req,
    @Param('otherUserId') otherUserId: string,
  ) {
    const userId = req.user.userId;
    return this.matchService.getMatchWithUser(userId, otherUserId);
  }

  /**
   * Kiểm tra 2 user có được chat không
   */
  @UseGuards(JwtAuthGuard)
  @Get('can-chat/:otherUserId')
  async canChat(
    @Request() req,
    @Param('otherUserId') otherUserId: string,
  ) {
    const userId = req.user.userId;
    const canChat = await this.matchService.canChat(userId, otherUserId);
    return { canChat };
  }

  /**
   * Unmatch (xóa match)
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':otherUserId')
  async unmatch(
    @Request() req,
    @Param('otherUserId') otherUserId: string,
  ) {
    const userId = req.user.userId;
    const result = await this.matchService.unmatch(userId, otherUserId);
    return { success: result };
  }
}
