import {OptionsBuilder} from "../src/server";

declare module "../src/server/OptionsBuilder"{
  interface OptionsBuilder {
    testData(): void;
  }
}

OptionsBuilder.prototype.testData = function () {
  console.log("THIS", this);
};

