import { Service } from "../../di";
import { getGlobalMetadata } from "../../decorators/GlobalMetadata";

function isPrimitive(type: string) {
    const primitives = ['String', 'Number', 'Boolean'];
    return primitives.includes(type);
}
@Service()
export class GrpcGenerator {
    constructor() {
        const dir: string = __dirname;
    }

    public generateString(): string {
        const metadata = getGlobalMetadata();
        let str = "";
        metadata.controllers.forEach(x => {
            str += `service ${x.name} {\n\n`;
            const handlers = x.handlers || {};
            Object.keys(handlers).forEach((key: string) => {
                // const metadata = handlers[key].metadata || {};
                const params = handlers[key].params;
                const names = params.map(x => x.type.name).map(x => {
                    if (isPrimitive(x)) {
                        return x.toLowerCase();
                    };
                    return x;
                }).join(" ");
                str += `    rpc ${key} (${names}) returns () {}\n\n`
            });
            str += `}\n\n`
        });
        return str;
    }
}
