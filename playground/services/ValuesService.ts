import { Service } from '../../src';
import { ServiceScope } from '../../src/di/types/DiOptionsTypes';

@Service({ scope: ServiceScope.Singleton })
export class ValuesService {
	values: string[] = ['value1', 'value2'];

	public async getValues(): Promise<string[]> {
		return this.values;
	}

	public async setValue(value: string): Promise<string[]> {
		this.values.push(value);
		return this.values;
	}
}
