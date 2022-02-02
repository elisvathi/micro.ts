import { BrokerBuilder } from './BrokerBuilder';

export type BrokerResolver<T extends BrokerBuilder<any, any>> = (
	builder: T
) => BrokerBuilder<any, any>;
