import { PrimaryGeneratedColumn, Entity, Column } from "typeorm";
@Entity()
export class TestModel {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column()
  name!: string;
}
