import { parseParam, parseParamList } from "./params";

describe("parseParam", () => {
  it("reads the value out of a typed tag", () => {
    expect(parseParam("name: Rainfall", "name")).toBe("Rainfall");
  });

  it("keeps colons that belong to the value", () => {
    expect(parseParam("name: Focus: Deep Rain", "name")).toBe("Focus: Deep Rain");
  });

  it("rejects a tag that is not the one the step expects", () => {
    expect(() => parseParam("file: rainfall.mp3", "name")).toThrow(/Expected a "name: <value>"/);
  });

  it("rejects a parameter with no tag", () => {
    expect(() => parseParam("Rainfall", "name")).toThrow(/Expected a "name: <value>"/);
  });

  it("rejects a tag with no value", () => {
    expect(() => parseParam("name:   ", "name")).toThrow(/has no value/);
  });
});

describe("parseParamList", () => {
  it("splits a comma separated tag", () => {
    expect(parseParamList("names: Rainfall, Forest", "names")).toEqual(["Rainfall", "Forest"]);
  });

  it("ignores empty entries", () => {
    expect(parseParamList("names: Rainfall, , Forest,", "names")).toEqual(["Rainfall", "Forest"]);
  });
});
