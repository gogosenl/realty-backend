import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';
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
  @IsString()
  @Matches(/^05\d{9}$/, { message: 'Lütfen Geçerli Bir Telefon Numarası Giriniz' })
  phone?: string;

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

export class UpdateRoleDto {
  @IsNotEmpty()
  @IsEnum(UserRole)
  role!: UserRole;
}