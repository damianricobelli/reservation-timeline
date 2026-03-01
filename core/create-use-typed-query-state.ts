import {
  type inferParserType,
  type Options,
  type ParserWithOptionalDefault,
  type UseQueryStateReturn,
  type UseQueryStatesReturn,
  useQueryState,
  useQueryStates,
} from "nuqs";
import type { SearchParamsDefs } from "@/core/create-search-params";

/**
 * Creates typed wrappers around `useQueryState` and `useQueryStates` from `nuqs`.
 *
 * The returned hooks receive logical keys from `defs`, map them to the real
 * URL query params (`value`), and infer state types from each parser.
 *
 * `options` are forwarded as-is to `nuqs`, so all `Options` are available.
 * When the parser has a default (eg: `parse.withDefault(...)`) or
 * `options.defaultValue` is provided, the returned state becomes non-nullable.
 *
 * @template Defs Map of logical keys to `{ value, parse }` definitions.
 * @param defs Search param configuration object.
 * @returns Typed wrappers `{ useQueryState, useQueryStates }` bound to `defs`.
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
  type DefaultsFor<Keys extends readonly Key[]> = Partial<{
    [K in Keys[number]]: Value<K>;
  }>;
  type KeyMapFor<Keys extends readonly Key[], D extends DefaultsFor<Keys>> = {
    [K in Keys[number]]: Parser<K> &
      (K extends keyof D ? { defaultValue: Value<K> } : Record<never, never>);
  };

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

  /**
   * Typed version of `useQueryStates` for a subset of keys in `defs`.
   *
   * @template Keys Logical keys from the provided definitions.
   * @template D Optional default values per key.
   * @param keys Logical keys to read/update in the query string.
   * @param options Standard `nuqs` options plus optional `defaultValues`.
   * @returns `[values, setValues]` tuple with type-safe inference per key.
   */
  function useTypedQueryStates<
    const Keys extends readonly Key[],
    D extends DefaultsFor<Keys> = Record<never, never>,
  >(
    keys: Keys,
    options?: Options & { defaultValues?: D },
  ): UseQueryStatesReturn<KeyMapFor<Keys, D>> {
    const { defaultValues, ...nuqsOptions } = options ?? {};

    const keyMap = Object.fromEntries(
      keys.map((key) => {
        const def = defs[key];
        const parser = def.parse as Parser<typeof key>;
        const overrideDefault = defaultValues?.[key];

        return [
          key,
          overrideDefault !== undefined
            ? {
                ...parser,
                defaultValue: overrideDefault,
              }
            : parser,
        ];
      }),
    ) as KeyMapFor<Keys, D>;

    const urlKeys = Object.fromEntries(
      keys.map((key) => [key, defs[key].value]),
    ) as {
      [K in Keys[number]]: Defs[K]["value"];
    };

    return useQueryStates(keyMap, {
      ...nuqsOptions,
      urlKeys,
    });
  }

  return {
    useQueryState: useTypedQueryState,
    useQueryStates: useTypedQueryStates,
  };
}
