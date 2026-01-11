import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Match, MatchDocument } from './match.schema';

@Injectable()
export class MatchService {
  constructor(
    @InjectModel(Match.name) private matchModel: Model<MatchDocument>,
  ) {}

  /**
   * Tạo match khi like 2 chiều
   */
  async createMatch(userId1: string, userId2: string): Promise<Match> {
    // Kiểm tra xem đã có match chưa
    const existingMatch = await this.matchModel.findOne({
      userIds: {
        $all: [
          new Types.ObjectId(userId1),
          new Types.ObjectId(userId2),
        ],
      },
    });

    if (existingMatch) {
      return existingMatch;
    }

    const match = new this.matchModel({
      userIds: [
        new Types.ObjectId(userId1),
        new Types.ObjectId(userId2),
      ],
    });

    return match.save();
  }

  /**
   * Lấy danh sách match của user
   */
  async getMatches(userId: string): Promise<Match[]> {
    return this.matchModel
      .find({
        userIds: new Types.ObjectId(userId),
      })
      .populate('userIds', '-password')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Lấy match giữa 2 user
   */
  async getMatchBetweenUsers(
    userId1: string,
    userId2: string,
  ): Promise<Match | null> {
    return this.matchModel
      .findOne({
        userIds: {
          $all: [
            new Types.ObjectId(userId1),
            new Types.ObjectId(userId2),
          ],
        },
      })
      .exec();
  }

  /**
   * Kiểm tra 2 user có được chat không (có match không)
   */
  async canChat(userId1: string, userId2: string): Promise<boolean> {
    const match = await this.getMatchBetweenUsers(userId1, userId2);
    return !!match;
  }

  /**
   * Unmatch (xóa match)
   */
  async unmatch(userId1: string, userId2: string): Promise<boolean> {
    const result = await this.matchModel.deleteOne({
      userIds: {
        $all: [
          new Types.ObjectId(userId1),
          new Types.ObjectId(userId2),
        ],
      },
    });

    return result.deletedCount > 0;
  }

  /**
   * Lấy thông tin match với user khác
   */
  async getMatchWithUser(
    userId: string,
    otherUserId: string,
  ): Promise<Match | null> {
    return this.getMatchBetweenUsers(userId, otherUserId);
  }
}
