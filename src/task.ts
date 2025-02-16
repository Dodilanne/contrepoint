import type { AnyOutputs, Task } from "./types";

export function createTask<TName extends string, TOutput, TInput, TOutputs extends AnyOutputs = {}>(
  task: Task<TName, TOutput, TInput, TOutputs>,
) {
  return task;
}
