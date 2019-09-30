import { getGlobalMetadata, GlobalMetadata } from "../../decorators/ControllersMetadata";
import { Service } from "../../di/DiDecorators";

function isPrimitive(type: string) {
    const prims = ['String', 'Number', 'Boolean'];
    return prims.includes(type);
}
@Service()
export class GrpcGenerator{
    constructor(){
        const dir: string = __dirname;
    }

    public generateString(): string {
        const metdata = getGlobalMetadata();
        let str = "";
        metdata.controllers.forEach(x=>{
            str += `service ${x.name} {\n\n`
            const handlers = x.handlers|| {}
            Object.keys(handlers).forEach((key: string)=>{
                // const metadata = handlers[key].metadata || {};
                const params = handlers[key].params;
                const names = params.map(x=>x.type.name).map(x=>{
                    if(isPrimitive(x)){
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
