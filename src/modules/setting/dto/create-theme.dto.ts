import { ApiProperty } from "@nestjs/swagger";

import { IsBoolean, IsOptional, IsString, Matches } from "class-validator";

const HEX = /^#([0-9A-Fa-f]{3}){1,2}$/;

export class CreateThemeDto {
  @ApiProperty({ example: "#1677ff" })
  @IsString()
  @Matches(HEX)
  primaryColor: string;

  @ApiProperty({ example: "#0ea5a4", required: false })
  @IsOptional()
  @IsString()
  @Matches(HEX)
  secondaryColor?: string;

  @ApiProperty({ example: "#ffffff" })
  @IsString()
  @Matches(HEX)
  background: string;

  @ApiProperty({ example: "#111827" })
  @IsString()
  @Matches(HEX)
  textColor: string;

  @ApiProperty({ example: "#f3f4f6", required: false })
  @IsOptional()
  @IsString()
  @Matches(HEX)
  surface?: string;

  @ApiProperty({ example: "#e5e7eb", required: false })
  @IsOptional()
  @IsString()
  @Matches(HEX)
  borderColor?: string;

  @ApiProperty({ example: "8px", required: false })
  @IsOptional()
  @IsString()
  borderRadius?: string;

  @ApiProperty({ example: "Inter, sans-serif", required: false })
  @IsOptional()
  @IsString()
  fontFamily?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  darkMode?: boolean;

  @ApiProperty({ example: "#001529", required: false })
  @IsOptional()
  @IsString()
  @Matches(HEX)
  menuColor?: string;

  @ApiProperty({ example: "#ffffff", required: false })
  @IsOptional()
  @IsString()
  @Matches(HEX)
  menuTextColor?: string;
}
