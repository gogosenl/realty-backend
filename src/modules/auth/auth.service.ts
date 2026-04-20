import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './user.schema';
import { RegisterDto, LoginDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) throw new ConflictException('Bu e-posta zaten kayıtlı');

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