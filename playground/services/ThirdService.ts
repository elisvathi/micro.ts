import { Service } from "../../src";
import { FirstService } from "./FirstSerivce";

@Service()
export class ThirdService{
	constructor(private first: FirstService){
	}
}
