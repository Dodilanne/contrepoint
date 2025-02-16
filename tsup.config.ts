import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src", "!**/*.test.ts"],
	dts: true,
	format: ["cjs", "esm"],
	clean: true,
});
