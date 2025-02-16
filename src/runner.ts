import type { Runner, Task } from "./types";

export function createRunner<TInput = void>(): Runner<TInput> {
	const tasks: Task<string, unknown, TInput>[] = [];

	function runTasks(input: TInput) {
		const running: Record<string, unknown> = {};
		const outputs = new Proxy(running, {
			get(obj, prop) {
				if (prop in obj) {
					return obj[prop as keyof typeof obj];
				}
				throw new Error(
					`Trying to await result for unregistered task ${prop as string}`,
				);
			},
		});
		for (const task of tasks) {
			running[task.name] = task.run({ input, outputs });
		}
		return tasks.map((t) => running[t.name]);
	}

	function mapResultsToTasks<T>(results: T[]) {
		return tasks.reduce<Record<string, T>>((acc, t, idx) => {
			acc[t.name] = results[idx];
			return acc;
		}, {});
	}

	return {
		register<TName extends string, TOutput = void>(
			task: Task<TName, TOutput, TInput>,
		) {
			tasks.push(task);
			return this;
		},
		async run(input) {
			const results = await Promise.allSettled(runTasks(input));
			return mapResultsToTasks(results);
		},
		async all(input) {
			const results = await Promise.all(runTasks(input));
			return mapResultsToTasks(results);
		},
	} as Runner<TInput>;
}
