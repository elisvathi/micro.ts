import {Required, ValidOptions} from "joi-typescript-validator/lib";

export class ParamsRequest {
  @Required()
  @ValidOptions('mobile', 'adult', 'native')
  platform!: string;
  @Required()
  userId!: number;
}
