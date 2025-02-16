# Contrepoint

Simple utility for orchestrating interdependent concurrent tasks in TypeScript.

## Installation

```bash
npm i contrepoint
```

## Basic Usage

```typescript
import { createRunner } from 'contrepoint';

// Create a runner
const runner = createRunner()
  .register({
    name: 'first',
    run: async () => 'Hello'
  })
  .register({
    name: 'second',
    run: async ({ outputs }) => {
      // Access results from other tasks
      const firstResult = await outputs.first;
      return `${firstResult} World`;
    }
  });

// Run with error handling (Promise.allSettled)
const results = await runner.run();
// { 
//   first: { status: 'fulfilled', value: 'Hello' },
//   second: { status: 'fulfilled', value: 'Hello World' }
// }

// Run where all tasks must succeed (Promise.all)
const allResults = await runner.all();
// { first: 'Hello', second: 'Hello World' }

// You can also pass input to all tasks
const runnerWithInput = createRunner<string>()
  .register({
    name: 'task',
    run: async ({ input }) => `Got input: ${input}`
  });

await runnerWithInput.run('my input');
```

## Standalone Tasks

```typescript
import { createTask, createRunner } from "contrepoint";

const first = createTask("first", async () => "Hello");

const second = createTask(
  "second",
  // Declare dependencies by typing the context
  async (ctx: Context<void, [typeof first]>) => {
    // Full type safety!
    const firstResult = await ctx.outputs.first;
    return `${firstResult} World`;
  },
);

// This work
const runner = createRunner().register(first).register(second);

// If you try to register `second` before `first`, you will get
// a type error because `first`'s output will be missing from `second`'s context
const runner = createRunner().register(second).register(first);
```
