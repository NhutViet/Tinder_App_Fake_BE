import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument, Gender, InterestedIn } from './user.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: Partial<User>): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findOne(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async update(id: string, updateUserDto: Partial<User>): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<User | null> {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  /**
   * Lấy danh sách user để swipe (trừ user đã swipe và chính mình)
   * Chỉ hiển thị user phù hợp với sở thích của cả hai bên
   */
  async getUsersForSwipe(
    userId: string,
    swipedUserIds: string[],
    limit: number = 10,
  ): Promise<User[]> {
    const currentUser = await this.findOne(userId);
    if (!currentUser) {
      return [];
    }

    // Lọc theo interestedIn của current user
    const genderFilter: Gender[] = [];
    if (currentUser.interestedIn === InterestedIn.ALL) {
      genderFilter.push(Gender.MALE, Gender.FEMALE, Gender.OTHER);
    } else if (currentUser.interestedIn === InterestedIn.MALE) {
      genderFilter.push(Gender.MALE);
    } else if (currentUser.interestedIn === InterestedIn.FEMALE) {
      genderFilter.push(Gender.FEMALE);
    }

    // Tìm users chưa được swipe, không phải chính mình, và có gender phù hợp
    const excludeIds = [
      new Types.ObjectId(userId),
      ...swipedUserIds.map((id) => new Types.ObjectId(id)),
    ];

    // Tìm tất cả users phù hợp với gender filter
    const candidates = await this.userModel
      .find({
        _id: { $nin: excludeIds },
        gender: { $in: genderFilter },
      })
      .exec();

    // Lọc thêm: chỉ giữ lại những user có interestedIn phù hợp với currentUser.gender
    const filteredCandidates = candidates.filter((user) => {
      if (user.interestedIn === InterestedIn.ALL) {
        return true;
      }
      if (user.interestedIn === InterestedIn.MALE && currentUser.gender === Gender.MALE) {
        return true;
      }
      if (user.interestedIn === InterestedIn.FEMALE && currentUser.gender === Gender.FEMALE) {
        return true;
      }
      return false;
    });

    // Giới hạn số lượng và trả về
    return filteredCandidates.slice(0, limit);
  }

  /**
   * Lấy profile user để hiển thị khi swipe
   */
  async getProfileForSwipe(userId: string): Promise<User | null> {
    return this.userModel
      .findById(userId)
      .select('-password -email')
      .exec();
  }

  /**
   * Cập nhật sở thích của user
   */
  async updateInterests(userId: string, interests: string[]): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { interests },
        { new: true }
      )
      .select('-password')
      .exec();
  }

  /**
   * Lấy danh sách user có chung sở thích cho trang home
   * Chỉ trả về những user có ít nhất 1 sở thích chung với current user
   * Hỗ trợ phân trang với page (mỗi page 20 items)
   */
  async getUsersWithCommonInterests(
    userId: string,
    swipedUserIds: string[] = [],
    page: number = 1,
  ): Promise<User[]> {
    const limit = 20; // Limit cố định mỗi page
    const currentUser = await this.findOne(userId);
    if (!currentUser) {
      return [];
    }

    // Nếu current user không có interests, trả về mảng rỗng
    if (!currentUser.interests || currentUser.interests.length === 0) {
      return [];
    }

    // Normalize current user interests (trim và lowercase để so sánh chính xác)
    const normalizedCurrentInterests = currentUser.interests
      .filter((interest) => interest && interest.trim().length > 0)
      .map((interest) => interest.trim().toLowerCase());

    if (normalizedCurrentInterests.length === 0) {
      return [];
    }

    // Lọc theo interestedIn của current user
    const genderFilter: Gender[] = [];
    if (currentUser.interestedIn === InterestedIn.ALL) {
      genderFilter.push(Gender.MALE, Gender.FEMALE, Gender.OTHER);
    } else if (currentUser.interestedIn === InterestedIn.MALE) {
      genderFilter.push(Gender.MALE);
    } else if (currentUser.interestedIn === InterestedIn.FEMALE) {
      genderFilter.push(Gender.FEMALE);
    }

    // Tìm users chưa được swipe, không phải chính mình, có gender phù hợp
    const excludeIds = [
      new Types.ObjectId(userId),
      ...swipedUserIds.map((id) => new Types.ObjectId(id)),
    ];

    // Tìm tất cả users phù hợp với gender filter và có interests
    const candidates = await this.userModel
      .find({
        _id: { $nin: excludeIds },
        gender: { $in: genderFilter },
        interests: { $exists: true, $ne: [], $type: 'array' }, // Chỉ lấy users có interests
      })
      .exec();

    // Lọc thêm: chỉ giữ lại những user có interestedIn phù hợp với currentUser.gender
    const filteredCandidates = candidates.filter((user) => {
      if (user.interestedIn === InterestedIn.ALL) {
        return true;
      }
      if (user.interestedIn === InterestedIn.MALE && currentUser.gender === Gender.MALE) {
        return true;
      }
      if (user.interestedIn === InterestedIn.FEMALE && currentUser.gender === Gender.FEMALE) {
        return true;
      }
      return false;
    });

    // Lọc: chỉ giữ lại những user có ít nhất 1 sở thích chung
    const usersWithCommonInterests = filteredCandidates.filter((user) => {
      if (!user.interests || user.interests.length === 0) {
        return false;
      }

      // Normalize user interests
      const normalizedUserInterests = user.interests
        .filter((interest) => interest && interest.trim().length > 0)
        .map((interest) => interest.trim().toLowerCase());

      if (normalizedUserInterests.length === 0) {
        return false;
      }

      // Đếm số sở thích chung (so sánh đã normalize)
      const commonInterests = normalizedUserInterests.filter((interest) =>
        normalizedCurrentInterests.includes(interest),
      );

      // Phải có ít nhất 1 sở thích chung
      return commonInterests.length >= 1;
    });

    // Tính toán phân trang
    const skip = (page - 1) * limit;
    const startIndex = skip;
    const endIndex = skip + limit;

    // Áp dụng phân trang và trả về
    return usersWithCommonInterests.slice(startIndex, endIndex);
  }
}
