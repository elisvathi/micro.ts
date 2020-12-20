import { expect } from 'chai';
import { Container, Inject, Service } from '../src';
import { ServiceScope } from '../src/di/types/DiOptionsTypes';
import { ContainerModule } from '../src/di/ContainerModule';


describe('Dependency Injection Main Scope Test', () => {
  it('Should keep singletons in memory ', () => {
    @Service()
    class SingletonService {
      public value: number = 0;
    }
    const firstReference = Container.get<SingletonService>(SingletonService);
    firstReference.value += 1;
    const secondReference = Container.get<SingletonService>(SingletonService);
    secondReference.value += 2;
    expect(firstReference.value).to.equal(secondReference.value);
  });

  it('Should build new transients on every call', () => {
    @Service({ scope: ServiceScope.Transient })
    class TransientService {
      public value: number = 0;
    }
    const firstReference = Container.get<TransientService>(TransientService);
    firstReference.value += 1;
    const secondReference = Container.get<TransientService>(TransientService);
    secondReference.value += 2;
    expect(firstReference.value).to.not.equal(secondReference.value);
  });

  it('Should return singleton named values', () => {
    const obj = { value: 1 };
    Container.set('obj', obj);
    const val = Container.get('obj');
    val.value = 3;
    const val2 = Container.get('obj');
    expect(val.value).to.equal(val2.value);
  });

  it('Should inject named values in constructor', () => {
    @Service({ scope: ServiceScope.Transient })
    class ConfigurableService {
      constructor(@Inject('obj') public config: any) { }
    }
    const obj = { value: 1 };
    Container.set('obj', obj);
    const service = Container.get<ConfigurableService>(ConfigurableService);
    obj.value = 3;
    expect(service.config.value).to.equal(3);
  });


  it('Should resolve with resolver values', () => {
    Container.bindResolver('test-value', () => {
      return 3;
    });
    expect(Container.get('test-value')).to.equal(3);
  });

  it('Should inject in constructor-less hierarchy', () => {
    @Service()
    class Dependency { }

    @Service()
    class SecondDependency { }
    @Service()
    class BaseClass {
      constructor(public dep: Dependency, public dep2: SecondDependency) { }
    }

    @Service()
    class ChildClass extends BaseClass { }
    expect(!!Container.get<ChildClass>(ChildClass).dep).to.equal(true);
  });

  it('Should inject named value in constructor-less hierarchy', () => {
    const val = '12345';
    Container.set('stringvalue', val);
    @Service()
    class Dependency { }

    @Service()
    class SecondDependency { }
    @Service()
    class BaseClass {
      constructor(
        public dep: Dependency,
        public dep2: SecondDependency,
        @Inject('stringvalue') public strVal: string
      ) { }
    }

    @Service()
    class ChildClass extends BaseClass { }
    const value2 = Container.get<ChildClass>(ChildClass);
    expect(value2.strVal).to.equal(val);
  });
});

describe('Dependency Injection Request Scope Test', () => {
  it('Scoped services should be singletons inside scope', () => {
    @Service({ scope: ServiceScope.Request })
    class ClassA {
      public value = 0;
    }

    const module = Container.newModule();
    const service = module.get<ClassA>(ClassA);
    service.value = 123;
    const repeated = module.get<ClassA>(ClassA);
    expect(repeated.value).to.equal(123);
  });

  it('Scoped services should be different on other modules', () => {
    @Service({ scope: ServiceScope.Request })
    class ClassA {
      public value = 0;
    }
    const module = Container.newModule();
    const service = module.get<ClassA>(ClassA);
    service.value = 123;
    const secondModule = Container.newModule();
    const repeated = secondModule.get<ClassA>(ClassA);
    expect(repeated.value).to.equal(0);
  });

  it('Scoped services should be injected with singletons', () => {

    @Service()
    class Singleton {
      value: number = 0;
    }

    @Service({ scope: ServiceScope.Request })
    class ClassA {
      constructor(public single: Singleton) { }
      value = 0;
    }

    const module = Container.newModule();
    const service = module.get<ClassA>(ClassA);
    service.value = 123;
    service.single.value = 100;
    const secondModule = Container.newModule();
    const repeated = secondModule.get<ClassA>(ClassA);
    expect(repeated.value).to.equal(0);
    expect(repeated.single.value).to.equal(100);
  });

  it('Scoped services should be injected with transients', () => {
    @Service({ scope: ServiceScope.Transient })
    class Transient {
      value: number = 0;
    }

    @Service({ scope: ServiceScope.Request })
    class ClassA {
      constructor(public single: Transient) { }
      value = 0;
    }

    const module = Container.newModule();
    const service = module.get<ClassA>(ClassA);
    service.value = 123;
    service.single.value = 100;
    const secondModule = Container.newModule();
    const repeated = secondModule.get<ClassA>(ClassA);
    expect(repeated.value).to.equal(0);
    expect(repeated.single.value).to.not.equal(100);
  });

  it('Transients can have scoped dependencies', () => {
    @Service({ scope: ServiceScope.Request })
    class ClassA {
      value = 0;
    }

    @Service({ scope: ServiceScope.Transient })
    class Transient {
      constructor(public dep: ClassA) { }
      value: number = 0;
    }

    const module = Container.newModule();
    const first = module.get<Transient>(Transient);
    first.value = 100;
    const second = module.get<Transient>(Transient);
    first.dep.value = 100;
    expect(second.value).to.not.equal(100);
    expect(second.dep.value).to.equal(100);
  });

  it('Non scoped should throw on scoped dependencies', () => {
    @Service({ scope: ServiceScope.Request })
    class ClassA {
      value = 0;
    }

    @Service({ scope: ServiceScope.Transient })
    class Transient {
      constructor(public dep: ClassA) { }
      value: number = 0;
    }
		const f = ()=>{
			Container.get(Transient);
		}
    expect(f).to.throw();
  });

  it('Should save scoped resolvers', () => {
    // Container.bindResolver()
    @Service({ scope: ServiceScope.Request })
    class ClassA {
      value = 0;
    }

    @Service({ scope: ServiceScope.Transient })
    class Transient {
      constructor(public dep: ClassA) { }
      value: number = 0;
    }

    let error = false;
    try {
      Container.get(Transient);
    } catch (e) {
      error = true;
    }
    expect(error).to.equal(true);
  });

});

describe('Dependency Injection Request Scope Test', () => {
  it("Should cache resolver in root scope", () => {
    class A {
      value = 1;
    }
    Container.bindResolver("test", (m: ContainerModule) => {
      return new A();
    }, ServiceScope.Singleton);
    const first = Container.get<A>("test");
    first.value = 100;
    const second = Container.get<A>("test");
    expect(second.value).to.equal(100);
  });

  it("Should cache resolver in request scope", () => {
    class A {
      value = 1;
    }
    Container.bindResolver("test", (m: ContainerModule) => {
      return new A();
    }, ServiceScope.Request);
    const module = Container.newModule();
    const first = module.get<A>("test");
    first.value = 100;
    const second = module.get<A>("test");
    expect(second.value).to.equal(100);
  });

  it("Should not cache resolver in different request scopes", () => {
    class A {
      value = 1;
    }
    Container.bindResolver("test", (m: ContainerModule) => {
      return new A();
    }, ServiceScope.Request);
    const first = Container.newModule().get<A>("test");
    first.value = 100;
    const second = Container.newModule().get<A>("test");
    expect(second.value).to.not.equal(100);
  });


});

describe("Registry tests", () => {
  it("Should throw error when requesting a scoped dep from the main Container", () => {
    @Service({ scope: ServiceScope.Request })
    class A {
    }
    const f = () => {
      Container.get<A>(A);
    }
    expect(f).to.throw();
  });
});
