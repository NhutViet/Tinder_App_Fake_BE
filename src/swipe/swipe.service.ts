import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Swipe, SwipeDocument, SwipeType } from './swipe.schema';
import { MatchService } from '../match/match.service';

@Injectable()
export class SwipeService {
  constructor(
    @InjectModel(Swipe.name) private swipeModel: Model<SwipeDocument>,
    private matchService: MatchService,
  ) {}

  /**
   * Ghi nhận like / dislike
   */
  async createSwipe(
    fromUserId: string,
    toUserId: string,
    type: SwipeType,
  ): Promise<Swipe> {
    // Kiểm tra xem đã swipe chưa
    const existingSwipe = await this.swipeModel.findOne({
      fromUserId: new Types.ObjectId(fromUserId),
      toUserId: new Types.ObjectId(toUserId),
    });

    if (existingSwipe) {
      throw new HttpException(
        'Bạn đã swipe người này rồi',
        HttpStatus.BAD_REQUEST,
      );
    }

    const swipe = new this.swipeModel({
      fromUserId: new Types.ObjectId(fromUserId),
      toUserId: new Types.ObjectId(toUserId),
      type,
    });

    const savedSwipe = await swipe.save();

    // Nếu là like, kiểm tra xem người kia có like mình không
    if (type === SwipeType.LIKE) {
      const reverseSwipe = await this.swipeModel.findOne({
        fromUserId: new Types.ObjectId(toUserId),
        toUserId: new Types.ObjectId(fromUserId),
        type: SwipeType.LIKE,
      });

      if (reverseSwipe) {
        // Tạo match nếu cả 2 đều like nhau
        await this.matchService.createMatch(fromUserId, toUserId);
      }
    }

    return savedSwipe;
  }

  /**
   * Kiểm tra user đã swipe người này chưa
   */
  async hasSwiped(
    fromUserId: string,
    toUserId: string,
  ): Promise<boolean> {
    const swipe = await this.swipeModel.findOne({
      fromUserId: new Types.ObjectId(fromUserId),
      toUserId: new Types.ObjectId(toUserId),
    });

    return !!swipe;
  }

  /**
   * Kiểm tra người kia có like mình không
   */
  async hasLikedMe(
    fromUserId: string,
    toUserId: string,
  ): Promise<boolean> {
    const swipe = await this.swipeModel.findOne({
      fromUserId: new Types.ObjectId(toUserId),
      toUserId: new Types.ObjectId(fromUserId),
      type: SwipeType.LIKE,
    });

    return !!swipe;
  }

  /**
   * Lấy danh sách user đã swipe
   */
  async getSwipedUsers(userId: string): Promise<string[]> {
    const swipes = await this.swipeModel
      .find({ fromUserId: new Types.ObjectId(userId) })
      .select('toUserId')
      .exec();

    return swipes.map((swipe) => swipe.toUserId.toString());
  }

  /**
   * Thống kê số lượt swipe/ngày
   */
  async getSwipeStats(userId: string, date?: Date): Promise<{
    likes: number;
    dislikes: number;
    total: number;
  }> {
    const startDate = date
      ? new Date(date.setHours(0, 0, 0, 0))
      : new Date(new Date().setHours(0, 0, 0, 0));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    const swipes = await this.swipeModel
      .find({
        fromUserId: new Types.ObjectId(userId),
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },
      })
      .exec();

    const likes = swipes.filter((s) => s.type === SwipeType.LIKE).length;
    const dislikes = swipes.filter((s) => s.type === SwipeType.DISLIKE).length;

    return {
      likes,
      dislikes,
      total: swipes.length,
    };
  }
}
