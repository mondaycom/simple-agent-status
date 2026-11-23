import { defineConfig } from 'tsdown'

// A mod can only import its own files, so the library is bundled into
// hooks/register.js (devDependencies are inlined), and the output is committed.
export default defineConfig({
  entry: { register: 'src/register.ts' },
  outDir: 'hooks',
  format: 'esm',
  platform: 'neutral',
  deps: { neverBundle: ['claude-code'] }, // provided by the engine at load time
  clean: false, // hooks/ also holds hooks.json
  dts: false,
})
