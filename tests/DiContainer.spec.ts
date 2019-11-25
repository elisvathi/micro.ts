import { expect } from "chai";
import { Service, Container, Inject } from '../src'

@Service()
class SingletonService {
  public value: number = 0;
}

@Service({ transient: true })
class TransientService {
  public value: number = 0;
}

@Service({ transient: true })
class ConfigurableService {
  constructor(@Inject('obj') public config: any) { }
}

@Service()
class ScopedService {
  public value: number = 1;
  constructor() { };
}

@Service({ scope: "test-scope" })
class ScopedConsumer {
  constructor(public service: ScopedService) {
  }
}

describe("Dependency Injection tests", () => {
  it("Should keep singletons in memory ", () => {
    const firstReference = Container.get<SingletonService>(SingletonService);
    firstReference.value += 1;
    const secondReference = Container.get<SingletonService>(SingletonService);
    secondReference.value += 2;
    expect(firstReference.value).to.equal((secondReference.value));
  });
  it("Should build new transients on every call", () => {
    const firstReference = Container.get<TransientService>(TransientService);
    firstReference.value += 1;
    const secondReference = Container.get<TransientService>(TransientService);
    secondReference.value += 2;
    expect(firstReference.value).to.not.equal((secondReference.value));
  });
  it("Should return singleton named values", () => {
    const obj = { value: 1 };
    Container.set("obj", obj);
    const val = Container.get("obj");
    val.value = 3;
    const val2 = Container.get("obj");
    expect(val.value).to.equal(val2.value);
  });
  it("Should inject named values in constructor", () => {
    const obj = { value: 1 };
    Container.set("obj", obj);
    const service = Container.get<ConfigurableService>(ConfigurableService);
    obj.value = 3;
    expect(service.config.value).to.equal(3);
  });
  it("Should inject scoped values first", () => {
    const scopedService = new ScopedService();
    scopedService.value = 3;
    Container.setScoped("test-scope", ScopedService, scopedService);
    const singletonScoped = new ScopedService();
    Container.set(ScopedService, singletonScoped);
    const scopedConsumer = Container.get<ScopedConsumer>(ScopedConsumer);
    expect(scopedConsumer.service.value).to.not.equal(1);
    const singleton = Container.get<ScopedService>(ScopedService);
    expect(singleton.value).to.equal(1);
  });
  it("Should resolve with resolver values", () => {
    Container.bindResolver("test-value", () => {
      return 3;
    });
    expect(Container.get("test-value")).to.equal(3);
  })
})
