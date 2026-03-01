import type { ParserWithOptionalDefault } from "nuqs";

type SearchParamInput<Key extends string = string> = {
  key: Key;
  parse: unknown;
};

type QueryParamDef<Name extends string, Parser> = {
  value: Name;
  parse: Parser;
};

export type SearchParamsDefs = Record<string, QueryParamDef<string, unknown>>;

type SearchParamsFromInputs<Defs extends readonly SearchParamInput[]> = {
  [Def in Defs[number] as Def["key"]]: Def extends {
    key: infer Key extends string;
    parse: infer Parser;
  }
    ? Parser extends ParserWithOptionalDefault<infer _Value>
      ? QueryParamDef<Key, Parser>
      : never
    : never;
};

export function createSearchParams<
  const Defs extends readonly SearchParamInput[],
>(...defs: Defs): SearchParamsFromInputs<Defs> {
  const entries = defs.map((def) => [
    def.key,
    { value: def.key, parse: def.parse },
  ]);

  return Object.fromEntries(entries) as SearchParamsFromInputs<Defs>;
}
