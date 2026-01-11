import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './message.schema';
import { MatchService } from '../match/match.service';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private matchService: MatchService,
  ) {}

  /**
   * Gửi tin nhắn
   */
  async sendMessage(
    senderId: string,
    receiverId: string,
    text: string,
  ): Promise<Message> {
    // Kiểm tra xem 2 user có match không
    const canChat = await this.matchService.canChat(senderId, receiverId);
    if (!canChat) {
      throw new HttpException(
        'Bạn không thể gửi tin nhắn cho người này vì chưa match',
        HttpStatus.FORBIDDEN,
      );
    }

    // Lấy matchId
    const match = await this.matchService.getMatchBetweenUsers(
      senderId,
      receiverId,
    );
    if (!match) {
      throw new HttpException('Không tìm thấy match', HttpStatus.NOT_FOUND);
    }

    const message = new this.messageModel({
      matchId: (match as any)._id,
      senderId: new Types.ObjectId(senderId),
      text,
      seen: false,
    });

    return message.save();
  }

  /**
   * Lấy lịch sử tin nhắn theo match
   */
  async getMessagesByMatch(
    matchId: string,
    limit: number = 50,
    before?: Date,
  ): Promise<Message[]> {
    const query: any = {
      matchId: new Types.ObjectId(matchId),
    };

    if (before) {
      query.createdAt = { $lt: before };
    }

    return this.messageModel
      .find(query)
      .populate('senderId', '-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Lấy tin nhắn giữa 2 user
   */
  async getMessagesBetweenUsers(
    userId1: string,
    userId2: string,
    limit: number = 50,
    before?: Date,
  ): Promise<Message[]> {
    const match = await this.matchService.getMatchBetweenUsers(userId1, userId2);
    if (!match) {
      return [];
    }

    const matchId = (match as any)._id;
    return this.getMessagesByMatch(matchId.toString(), limit, before);
  }

  /**
   * Đánh dấu tin nhắn đã xem
   */
  async markAsSeen(
    matchId: string,
    userId: string,
  ): Promise<number> {
    // Lấy tất cả tin nhắn trong match mà không phải của user này
    const result = await this.messageModel.updateMany(
      {
        matchId: new Types.ObjectId(matchId),
        senderId: { $ne: new Types.ObjectId(userId) },
        seen: false,
      },
      {
        $set: { seen: true },
      },
    );

    return result.modifiedCount;
  }

  /**
   * Đánh dấu tất cả tin nhắn từ một user là đã xem
   */
  async markAllAsSeenFromUser(
    userId: string,
    otherUserId: string,
  ): Promise<number> {
    const match = await this.matchService.getMatchBetweenUsers(
      userId,
      otherUserId,
    );
    if (!match) {
      return 0;
    }

    const matchId = (match as any)._id;
    const result = await this.messageModel.updateMany(
      {
        matchId: matchId,
        senderId: new Types.ObjectId(otherUserId),
        seen: false,
      },
      {
        $set: { seen: true },
      },
    );

    return result.modifiedCount;
  }

  /**
   * Lấy số tin nhắn chưa đọc
   */
  async getUnreadCount(userId: string): Promise<number> {
    // Lấy tất cả match của user
    const matches = await this.matchService.getMatches(userId);
    const matchIds = matches.map((m) => (m as any)._id);

    // Đếm tin nhắn chưa đọc (không phải của user này)
    return this.messageModel.countDocuments({
      matchId: { $in: matchIds },
      senderId: { $ne: new Types.ObjectId(userId) },
      seen: false,
    });
  }

  /**
   * Lấy số tin nhắn chưa đọc với một user cụ thể
   */
  async getUnreadCountWithUser(
    userId: string,
    otherUserId: string,
  ): Promise<number> {
    const match = await this.matchService.getMatchBetweenUsers(
      userId,
      otherUserId,
    );
    if (!match) {
      return 0;
    }

    const matchId = (match as any)._id;
    return this.messageModel.countDocuments({
      matchId: matchId,
      senderId: new Types.ObjectId(otherUserId),
      seen: false,
    });
  }
}
