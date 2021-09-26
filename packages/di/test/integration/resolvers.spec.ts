import { Container, InjectorService } from "@tsed/di";
import { expect } from "chai";

describe("DI Resolvers", () => {
  describe("create new injector", () => {
    it("should load all providers with the SINGLETON scope only", async () => {
      class ExternalService {
        constructor() {
        }
      }

      class MyService {
        constructor(public externalService: ExternalService) {
        }
      }

      const externalDi = new Map();
      externalDi.set(ExternalService, "MyClass");
      // GIVEN
      const injector = new InjectorService();
      injector.settings.resolvers.push(externalDi);

      const container = new Container();
      container.add(MyService, {
        deps: [ExternalService]
      });

      // WHEN
      expect(injector.get(ExternalService)).to.eq("MyClass");

      await injector.load(container);

      // THEN
      expect(injector.get(MyService)).to.instanceOf(MyService);
      expect(injector.get<MyService>(MyService)!.externalService).to.eq("MyClass");
    });
  });
});
