import { Optional } from "joi-typescript-validator";
import {
	Body,
	FilterBrokers,
	Get,
	Header,
	JsonController,
	Param,
	Post,
	QueryParam,
	Service,
	BrokerRouteOptions,
} from "../../src";
import { SpecBuilder } from "../../src/openapi/SpecBuilder";

export class TestValdiator {
	@Optional()
	items?: any[];
}

@Service()
class LogService {
	calls: number = 0;
}

@JsonController("data")
export class DataController {
	constructor(private log: LogService, private swagger: SpecBuilder) {}

	@Get("logs/:id/:test/:bool/:string")
	public getLogInfo(
		@QueryParam("test", { required: false }) test: number,
		@Param("id") id: number,
		@Header("Authorization") auth: string,
		@Param("test") testParam: number,
		@Param("bool") bl: boolean,
		@Param("string") str: string
	) {
		return { testParam, id, bl, str };
	}

	@Get("swagger")
	getSwagger() {
		return this.swagger.getDocument();
	}

	@Get(":name")
	// @Authorize()
	public async getData(@Body() body: any) {
		console.dir(body, { depth: null });
		return { ok: true, body };
	}

	@Post(":name")
	@BrokerRouteOptions((b) => {
		return {
			payload: {
				parse: false,
			},
		};
	})
	public async postData(@Param("name") name: string, @Body() body: any) {
		console.log("BODY", body);
		return "get data called";
	}

	@Post("custom")
	public async customCall(
		@Body({ required: true, validate: true }) body: TestValdiator
	) {
		return "custom call called";
	}

	@Post("slow-route", { queueOptions: { consumeOptions: { noAck: true } } })
	public async slowRoute() {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve({ ok: true });
			}, 1 * 5 * 1000);
		});
	}
}
