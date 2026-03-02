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

type TypedSearchParamsFromInputs<Defs extends readonly SearchParamInput[]> = {
  [Def in Defs[number] as Def["key"]]: Def extends {
    key: infer Key extends string;
    parse: infer Parser;
  }
    ? Parser extends ParserWithOptionalDefault<infer _Value>
      ? QueryParamDef<Key, Parser>
      : never
    : never;
};

export function createTypedSearchParams<
  const Defs extends readonly SearchParamInput[],
>(...defs: Defs): TypedSearchParamsFromInputs<Defs> {
  const entries = defs.map((def) => [
    def.key,
    { value: def.key, parse: def.parse },
  ]);

  return Object.fromEntries(entries);
}
