/**
 * Specs pass typed tags — `'name: Rainfall'` — so a scenario step reads like a sentence.
 * The DSL unwraps them here.
 */
export function parseParam(param: string, expected: string): string {
  const separator = param.indexOf(":");
  if (separator < 0) {
    throw new Error(`Expected a "${expected}: <value>" parameter but received "${param}"`);
  }

  const tag = param.slice(0, separator).trim();
  if (tag !== expected) {
    throw new Error(`Expected a "${expected}: <value>" parameter but received "${param}"`);
  }

  const value = param.slice(separator + 1).trim();
  if (!value) throw new Error(`"${param}" has no value`);

  return value;
}

/** For tags that carry several values — `'names: Rainfall, Forest'`. */
export function parseParamList(param: string, expected: string): string[] {
  return parseParam(param, expected)
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);
}
