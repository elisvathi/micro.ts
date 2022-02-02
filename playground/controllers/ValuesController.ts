import { Get, JsonController, Param } from '../../src';
import { ValuesService } from '../services/ValuesService';

@JsonController('values')
export class ValuesController {
	public constructor(private service: ValuesService) {}

	@Get('')
	public async getValues(): Promise<string[]> {
		return this.service.getValues();
	}

	@Get(':value')
	public async setvalue(@Param('value') value: string): Promise<string[]> {
		return this.service.setValue(value);
	}
}
