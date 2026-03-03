import {
  type inferParserType,
  type Options,
  type ParserMap,
  type UseQueryStateReturn,
  type UseQueryStatesReturn,
  useQueryState,
  useQueryStates,
} from "nuqs";

type TypedQueryParamConfig = {
  parse: ParserMap[string];
  urlKey?: string;
};

type TypedQueryStateConfig = Record<string, TypedQueryParamConfig>;
type QueryValue<
  Params extends TypedQueryStateConfig,
  K extends keyof Params = keyof Params,
> = inferParserType<Params[K]["parse"]>;

export function createTypedQueryState<const Defs extends TypedQueryStateConfig>(
  defs: Defs,
) {
  type Key = keyof Defs & string;
  type Parser<K extends Key> = Defs[K]["parse"];
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

  function useTypedQueryState<K extends Key>(
    key: K,
    options?: Options,
  ): UseQueryStateReturn<Value<K>, ExistingDefault<K>>;
  function useTypedQueryState<K extends Key>(
    key: K,
    options: Options & { defaultValue: Value<K> },
  ): UseQueryStateReturn<Value<K>, Value<K>>;
  function useTypedQueryState<K extends Key>(
    key: K,
    options?: Options & { defaultValue?: Value<K> },
  ) {
    const def = defs[key];
    const { defaultValue, ...nuqsOptions } = options ?? {};

    const queryStateOptions =
      defaultValue !== undefined
        ? {
            ...def.parse,
            ...nuqsOptions,
            defaultValue,
          }
        : {
            ...def.parse,
            ...nuqsOptions,
          };

    return useQueryState(def.urlKey ?? key, queryStateOptions);
  }

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
        const overrideDefault = defaultValues?.[key];

        return [
          key,
          overrideDefault !== undefined
            ? {
                ...def.parse,
                defaultValue: overrideDefault,
              }
            : def.parse,
        ];
      }),
    ) as KeyMapFor<Keys, D>;

    const urlKeys = keys.reduce<Partial<Record<Keys[number], string>>>(
      (current, key) => {
        current[key] = defs[key].urlKey ?? key;
        return current;
      },
      {},
    );

    return useQueryStates(keyMap, {
      ...nuqsOptions,
      urlKeys,
    });
  }

  return {
    searchParams: defs,
    useQueryState: useTypedQueryState,
    useQueryStates: useTypedQueryStates,
  };
}

export type { TypedQueryParamConfig, TypedQueryStateConfig };
export type { QueryValue };
