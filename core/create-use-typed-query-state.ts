import {
  type inferParserType,
  type Options,
  type ParserWithOptionalDefault,
  type UseQueryStateReturn,
  useQueryState,
} from "nuqs";
import type { SearchParamsDefs } from "@/core/create-search-params";

/**
 * Creates a typed wrapper around `useQueryState` from `nuqs`.
 *
 * The returned hook receives a logical key from `defs`, maps it to the real
 * URL query param (`value`), and infers the state type from the parser.
 *
 * `options` are forwarded as-is to `nuqs`, so all `Options` are available.
 * When the parser has a default (eg: `parse.withDefault(...)`) or
 * `options.defaultValue` is provided, the returned state becomes non-nullable.
 *
 * @template Defs Map of logical keys to `{ value, parse }` definitions.
 * @param defs Search param configuration object.
 * @returns A typed hook bound to the provided definitions.
 */
export function createUseTypedQueryState<const Defs extends SearchParamsDefs>(
  defs: Defs,
) {
  type Key = keyof Defs;
  type Parser<K extends Key> =
    Defs[K]["parse"] extends ParserWithOptionalDefault<infer _Value>
      ? Defs[K]["parse"]
      : never;
  type Parsed<K extends Key> = inferParserType<Parser<K>>;
  type Value<K extends Key> = NonNullable<Parsed<K>>;
  type ExistingDefault<K extends Key> =
    Parsed<K> extends Value<K> ? Value<K> : undefined;

  /**
   * Typed version of `useQueryState` for a specific key in `defs`.
   *
   * @template K Logical key from the provided definitions.
   * @template D Optional default value type for that key.
   * @param key Logical key to read/update in the query string.
   * @param options Standard `nuqs` options plus an optional `defaultValue`.
   * @returns `[value, setValue]` tuple with type-safe inference per key.
   */
  function useTypedQueryState<
    K extends Key,
    D extends Value<K> | undefined = undefined,
  >(
    key: K,
    options?: Options & { defaultValue?: D },
  ): UseQueryStateReturn<
    Value<K>,
    D extends undefined ? ExistingDefault<K> : Value<K>
  > {
    const def = defs[key];
    const parser = def.parse as Parser<K>;
    const { defaultValue: overrideDefault, ...nuqsOptions } = options ?? {};

    const queryStateOptions =
      overrideDefault !== undefined
        ? {
            ...parser,
            ...nuqsOptions,
            defaultValue: overrideDefault,
          }
        : {
            ...parser,
            ...nuqsOptions,
          };

    return useQueryState(def.value, queryStateOptions) as UseQueryStateReturn<
      Value<K>,
      D extends undefined ? ExistingDefault<K> : Value<K>
    >;
  }

  return useTypedQueryState;
}
