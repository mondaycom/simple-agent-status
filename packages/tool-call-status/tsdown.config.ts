import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: 'src/index.ts',
  format: 'esm',
  dts: true,
  // no node:* or DOM, so it also runs inside a Claude Code mod
  platform: 'neutral',
})
