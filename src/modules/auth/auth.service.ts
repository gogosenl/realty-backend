import { Injectable, UnauthorizedException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument, UserRole } from './user.schema';
import { RegisterDto, LoginDto, InviteDto } from './auth.dto';
import { Invite, InviteDocument } from './invite.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Invite.name) private inviteModel: Model<InviteDocument>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) throw new ConflictException('Bu e-posta zaten kayıtlı');

    if (dto.role === UserRole.AGENT) {
      const invite = await this.inviteModel.findOne({ email: dto.email, used: false });
      if (!invite) throw new ForbiddenException('Bu e-posta ile kayıt olmak için admin daveti gerekli');
      invite.used = true;
      await invite.save();
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = new this.userModel({ ...dto, password: hashed });
    await user.save();

    return this.signToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) throw new UnauthorizedException('E-posta veya şifre hatalı');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('E-posta veya şifre hatalı');

    return this.signToken(user);
  }

  async getMe(userId: string) {
    const user = await this.userModel.findById(userId).select('-password');
    if (!user) throw new UnauthorizedException();
    return user;
  }

  async inviteAgent(dto: InviteDto) {
    const existing = await this.inviteModel.findOne({ email: dto.email });
    if (existing) {
      if (existing.used) throw new ConflictException('Bu e-posta zaten kullanılmış');
      throw new ConflictException('Bu e-posta zaten davet edilmiş');
    }
    const invite = new this.inviteModel({ email: dto.email });
    await invite.save();
    return { message: `${dto.email} başarıyla davet edildi` };
  }

  async getInvites() {
    return this.inviteModel.find().sort({ createdAt: -1 }).exec();
  }

  async deleteInvite(id: string) {
    const invite = await this.inviteModel.findByIdAndDelete(id);
    if (!invite) throw new NotFoundException('Davet bulunamadı');
    return { message: 'Davet silindi' };
  }

  private signToken(user: UserDocument) {
    const payload = { sub: user._id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}