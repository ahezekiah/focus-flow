import { DslContext } from "./dsl-context";

describe("DslContext", () => {
  it("returns the same alias every time for the same value", () => {
    const ctx = new DslContext("seed-1");

    expect(ctx.alias("Rainfall")).toBe(ctx.alias("Rainfall"));
  });

  it("keeps the plain value readable at the front of the alias", () => {
    const ctx = new DslContext("seed-1");

    expect(ctx.alias("Rainfall")).toMatch(/^Rainfall\d[0-9a-f]{4}$/);
  });

  it("gives different values different aliases", () => {
    const ctx = new DslContext("seed-1");

    expect(ctx.alias("Rainfall")).not.toBe(ctx.alias("Forest"));
  });

  it("gives separate runs different aliases for the same value", () => {
    expect(new DslContext("seed-1").alias("Rainfall")).not.toBe(
      new DslContext("seed-2").alias("Rainfall"),
    );
  });

  it("aliases only the local part of an email", () => {
    const ctx = new DslContext("seed-1");

    expect(ctx.aliasEmail("designer@example.com")).toMatch(/^designer\d[0-9a-f]{4}@example\.com$/);
  });

  it("interpolates a value that was already aliased", () => {
    const ctx = new DslContext("seed-1");
    const rainfall = ctx.alias("Rainfall");

    expect(ctx.interpolate("Playlist for ${Rainfall}")).toBe(`Playlist for ${rainfall}`);
  });

  it("refuses to interpolate a value that has not been aliased yet", () => {
    const ctx = new DslContext("seed-1");

    expect(() => ctx.interpolate("Playlist for ${Unknown}")).toThrow(/has not been aliased/);
  });
});
