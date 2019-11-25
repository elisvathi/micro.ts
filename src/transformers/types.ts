import { DecoderError, EncoderError } from "../errors";
import { Class } from "../server";
import { Container, Service } from "../di";
const compressor = require('@elisvathi/json-compressor');
export interface DataTransformer<TFirst = any, TSecond = any> {
  decode(input: TFirst, ...options: any[]): Promise<TSecond>;
  encode(input: TSecond, ...options: any[]): Promise<TFirst>;
}
export type TransformerClass = Class<DataTransformer>;
export function DataTransformer(){
  return (target: any)=>{
    Reflect.decorate([Service()], target);
  }
}

export abstract class BaseTransformer<TFirst = any, TSecond = any> implements DataTransformer<TFirst, TSecond>{
  protected abstract async tryDecode<T = TFirst>(input: T, ...options: any[]): Promise<TSecond>;
  protected abstract async tryEncode<T = TSecond>(input: T, ...options: any[]): Promise<TFirst>;
  /**
   * Convert from first to second
   * @param input
   */
  public async decode<T = TFirst>(input: T, ...options: any[]): Promise<TSecond> {
    try {
      return await this.tryDecode<T>(input, ...options);
    } catch (err) {
      console.log("DECODER ERROR", err);
      throw new DecoderError(err);
    }
  }
  /**
   * Convert from second to first
   * @param input
   */
  public async encode<T = TSecond>(input: T, ...options: any[]): Promise<TFirst> {
    try {
      return await this.tryEncode<T>(input, ...options);
    } catch (err) {
      throw new EncoderError(err);
    }
  }
}

export class ChainTransformer<TFirst, TSecond> extends BaseTransformer<TFirst, TSecond>{
  constructor(private transformers: TransformerClass[]) {
    super();
  }
  protected async tryDecode<T = TFirst>(input: T): Promise<TSecond> {
    let transformed = input as any;
    for (let i = 0; i < this.transformers.length; i++) {
      const transformer = Container.get<BaseTransformer>(this.transformers[i]);
      transformed = await transformer.decode(transformed);
    }
    return transformed as TSecond;
  }

  protected async tryEncode<T = TSecond>(input: T): Promise<TFirst> {
    let transformed = input as any;
    for (let i = this.transformers.length - 1; i >= 0; i--) {
      const transformer = Container.get<BaseTransformer>(this.transformers[i]);
      transformed = await transformer.encode(transformed);
    }
    return transformed as TFirst;
  }
}

@DataTransformer()
export class StringJsonTransformer extends BaseTransformer<string, any>{
  protected async tryDecode<T = string>(input: T): Promise<any> {
    return JSON.parse(input as any as string);
  }
  protected async tryEncode<T = any>(input: T): Promise<string> {
    return JSON.stringify(input);
  }
}

@DataTransformer()
export class BufferStringTransformer extends BaseTransformer<Buffer, string>{
  protected async tryDecode<T = Buffer>(input: T, encoding: string = 'utf8'): Promise<string> {
    return (input as any as Buffer).toString();
  }

  protected async tryEncode<T = string>(input: T, encoding: BufferEncoding = 'utf-8'): Promise<Buffer> {
    return Buffer.from((input as any) as string, encoding);
  }
}
@DataTransformer()
export class EmptyTransformer extends BaseTransformer<any, any>{
  protected tryDecode<T = any>(input: T, ...options: any[]): Promise<any> {
    return input as any;
  }
  protected tryEncode<T = any>(input: T, ...options: any[]): Promise<any> {
    return input as any;
  }
}

@DataTransformer()
export class BufferJsonTransformer extends ChainTransformer<Buffer, any>{
  constructor() {
    super([BufferStringTransformer, StringJsonTransformer]);
  }
}

@DataTransformer()
export class CompressedJsonTransformer extends BaseTransformer<{ keys: any, data: any }, any>{

  protected tryDecode<T = { keys: any; data: any; }>(input: T, ...options: any[]): Promise<any> {
    const castedInput = input as any as {keys: any, data: any};
    return compressor.decompress(castedInput.data, castedInput.keys);
  }

  protected tryEncode<T = any>(input: T, ...options: any[]): Promise<{ keys: any; data: any; }> {
    return compressor.compress(input);
  }

}
