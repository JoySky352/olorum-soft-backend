import { ApiProperty } from "@nestjs/swagger";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
@Entity("themes")
export class Theme {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: "#1677ff" })
  @Column({ type: "text", default: "#1677ff" })
  primaryColor: string;

  @ApiProperty({ example: "#0ea5a4", required: false })
  @Column({ type: "text", nullable: true })
  secondaryColor?: string;

  @ApiProperty({ example: "#ffffff" })
  @Column({ type: "text", default: "#ffffff" })
  background: string;

  @ApiProperty({ example: "#111827" })
  @Column({ type: "text", default: "#111827" })
  textColor: string;

  @ApiProperty({ example: "#f3f4f6", required: false })
  @Column({ type: "text", nullable: true })
  surface?: string;

  @ApiProperty({ example: "#e5e7eb", required: false })
  @Column({ type: "text", nullable: true })
  borderColor?: string;

  @ApiProperty({ example: "8px", required: false })
  @Column({ type: "text", nullable: true })
  borderRadius?: string;

  @ApiProperty({ example: "Inter, sans-serif", required: false })
  @Column({ type: "text", nullable: true })
  fontFamily?: string;

  @ApiProperty({ example: false, required: false })
  @Column({ type: "boolean", default: false })
  darkMode: boolean;

  @ApiProperty({ example: "#001529" })
  @Column({ type: "text", default: "#001529" })
  menuColor: string;

  @ApiProperty({ example: "#ffffff" })
  @Column({ type: "text", default: "#ffffff" })
  menuTextColor: string;
}
