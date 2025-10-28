import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateThemeDto {
  @ApiProperty()
  @IsString()
  primaryColor: string;

  @ApiProperty()
  @IsString()
  menuColor: string;

  @ApiProperty()
  @IsString()
  menuTextColor: string;
}
