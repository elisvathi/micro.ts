import { Service } from "../../src";
import { SecondService } from "./SecondService";

@Service()
export class FirstService{
	constructor(private dep: SecondService){
	}
}
