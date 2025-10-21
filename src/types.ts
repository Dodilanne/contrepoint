export type Task<TName extends string, TOutput, TInput, TOutputs extends AnyOutputs = {}> = {
  name: TName;
  run: (context: Context<TInput, TOutputs>) => Promise<TOutput>;
};

export type Runner<TInput, TOutputs extends AnyOutputs = {}> = {
  register<TName extends string, TOutput, TTaskInput, TTaskOutputs extends AnyOutputs>(
    task: TInput extends TTaskInput
      ? inferOutputs<TOutputs> extends inferOutputs<TTaskOutputs>
        ? Task<TName, TOutput, TTaskInput, TTaskOutputs>
        : never
      : never,
  ): Runner<TInput, Prettify<TOutputs & Record<TName, TOutput>>>;
  run: (input: TInput) => Promise<{
    [TName in keyof TOutputs]: PromiseSettledResult<TOutputs[TName]>;
  }>;
  all: (input: TInput) => Promise<{ [TName in keyof TOutputs]: TOutputs[TName] }>;
};

export type Context<TInput, TOutputs extends AnyOutputs = {}> = {
  input: TInput;
  outputs: inferOutputs<TOutputs>;
};

export type AnyOutputs =
  | Record<string, unknown>
  // biome-ignore lint/suspicious/noExplicitAny:
  | readonly Task<string, any, any, any>[];

export type inferOutputs<TOutputs extends AnyOutputs> = TOutputs extends Record<string, unknown>
  ? { [TName in keyof TOutputs]: Promise<TOutputs[TName]> }
  : inferOutputsFromTasks<TOutputs>;

export type inferOutputsFromTasks<TTasks, TAcc = {}> = TTasks extends [
  // biome-ignore lint/suspicious/noExplicitAny:
  Task<infer TName, infer TOutput, any, any>,
  ...infer TRest,
]
  ? inferOutputsFromTasks<TRest, Prettify<TAcc & { [K in TName]: Promise<TOutput> }>>
  : TAcc;

export type Prettify<T> = { [K in keyof T]: T[K] } & {};
