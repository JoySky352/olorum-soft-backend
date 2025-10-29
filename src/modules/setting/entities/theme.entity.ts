import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("themes")
export class Theme {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, name: "primary_color" })
  primaryColor: string;

  @Column({ length: 100, name: "menu_color" })
  menuColor: string;

  @Column({ length: 100, name: "menu_text_color" })
  menuTextColor: string;
}
