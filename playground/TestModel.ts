import { PrimaryGeneratedColumn, Entity, Column, CreateDateColumn } from "typeorm";
@Entity()
export class TestModel {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column()
  name!: string;
}

@Entity()
export class SecondModel{
  @PrimaryGeneratedColumn()
  id!: number;
  @Column()
  name!: string;

}
