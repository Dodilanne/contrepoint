import { assert, describe, expect, it, vi } from "vitest";
import { createRunner } from "./runner";

function getTestRunner() {
	const a = vi.fn(async () => "a");
	const b = vi.fn(async () => "b");
	const c = vi.fn(async () => "c");
	const runner = createRunner()
		.register({ name: "a", run: a })
		.register({ name: "b", run: b })
		.register({ name: "c", run: c });
	return {
		runner,
		tasks: { a, b, c },
	};
}

describe("run", () => {
	it("runs registered tasks", async () => {
		const { runner, tasks } = getTestRunner();
		await runner.run();
		expect(tasks.a).toHaveBeenCalledOnce();
		expect(tasks.b).toHaveBeenCalledOnce();
	});

	it("runs registered tasks in order", async () => {
		const { runner, tasks } = getTestRunner();
		await runner.run();
		expect(tasks.a).toHaveBeenCalledBefore(tasks.b);
		expect(tasks.b).toHaveBeenCalledBefore(tasks.c);
	});

	it("returns execution result for each task", async () => {
		const { runner } = getTestRunner();
		const res = await runner.run();
		expect(res).toStrictEqual({
			a: { status: "fulfilled", value: "a" },
			b: { status: "fulfilled", value: "b" },
			c: { status: "fulfilled", value: "c" },
		});
	});

	it("returns errors without crashing", async () => {
		const { runner } = getTestRunner();
		const error = new Error("oops");
		const res = await runner
			.register({
				name: "d",
				run: async () => {
					throw error;
				},
			})
			.run();
		expect(res).toStrictEqual({
			a: { status: "fulfilled", value: "a" },
			b: { status: "fulfilled", value: "b" },
			c: { status: "fulfilled", value: "c" },
			d: { status: "rejected", reason: error },
		});
	});

	it("provides task outputs to subsequent tasks", async () => {
		const { runner } = getTestRunner();
		const res = await runner
			.register({
				name: "d",
				run: async (ctx) => {
					return {
						a: await ctx.outputs.a,
						b: await ctx.outputs.b,
						c: await ctx.outputs.c,
					};
				},
			})
			.run();
		assert(res.d.status === "fulfilled");
		expect(res.d.value).toStrictEqual({
			a: "a",
			b: "b",
			c: "c",
		});
	});

	it("provides input to tasks", async () => {
		const runner = createRunner<string>().register({
			name: "d",
			run: async (ctx) => ctx.input,
		});
		const res = await runner.run("in");
		assert(res.d.status === "fulfilled");
		expect(res.d.value).toBe("in");
	});

	it("rejects when a task depends on unregistered tasks", async () => {
		const runner = createRunner<string>().register({
			name: "d",
			// biome-ignore lint/suspicious/noExplicitAny:
			run: async (ctx) => await (ctx.outputs as any).a,
		});
		const res = await runner.run("in");
		assert(res.d.status === "rejected");
	});

	it("rejects when a task depends on unregistered tasks", async () => {
		const runner = createRunner<string>().register({
			name: "d",
			// biome-ignore lint/suspicious/noExplicitAny:
			run: async (ctx) => await (ctx.outputs as any).a,
		});
		const res = await runner.run("in");
		assert(res.d.status === "rejected");
	});
});

describe("all", () => {
	it("returns execution result for each task", async () => {
		const { runner } = getTestRunner();
		const res = await runner.all();
		expect(res).toStrictEqual({
			a: "a",
			b: "b",
			c: "c",
		});
	});

	it("crashes when a task crashes", async () => {
		const { runner } = getTestRunner();
		const res = runner
			.register({
				name: "d",
				run: async () => {
					throw new Error();
				},
			})
			.all();
		await expect(res).rejects.toThrow();
	});
});
