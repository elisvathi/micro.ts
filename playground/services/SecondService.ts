import { Service } from "../../src";
import { ThirdService } from "./ThirdService";

@Service()
export class SecondService{
	constructor(private dep: ThirdService){}
}
