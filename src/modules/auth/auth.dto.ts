import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from './user.schema';

export class RegisterDto {
  @IsNotEmpty()
    @IsString()
    name!: string;

  @IsNotEmpty()
    @IsEmail()
    email!: string;

  @IsNotEmpty()
    @IsString()
    @MinLength(6)
    password!: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class LoginDto {
  @IsNotEmpty()
    @IsEmail()
    email!: string;

  @IsNotEmpty()
    @IsString()
    password!: string;
}

export class InviteDto {
  @IsNotEmpty()
  @IsEmail()
  email!: string;
}