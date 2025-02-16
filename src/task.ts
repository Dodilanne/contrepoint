import type { AnyOutputs, Context, Task } from "./types";

export function createTask<
	TName extends string,
	TOutput,
	TInput,
	TOutputs extends AnyOutputs = {},
>(
	name: TName,
	run: (context: Context<TInput, TOutputs>) => Promise<TOutput>,
): Task<TName, TOutput, TInput, TOutputs> {
	return { name, run };
}
