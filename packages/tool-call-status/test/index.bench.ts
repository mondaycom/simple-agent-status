import { test } from 'vitest'

import { toStatus } from '../src'

const CALLS = [
  'bash npm install',
  'bash git status',
  'bash cd app && NODE_ENV=test pnpm --filter web test 2>&1 | tail -50',
  'bash ./scripts/deploy.sh',
  'bash frobnicate --all', // no rule matches: walks the whole table
  'read src/components/Button.test.tsx',
  'edit src/index.ts',
  'Grep TODO',
  'mcp__plugin_slack_slack__slack_send_message',
]

test('toStatus', async ({ bench }) => {
  await bench.compare(
    bench('first rule (npm install)', () => {
      toStatus('bash npm install')
    }),
    bench('no match (walks every rule)', () => {
      toStatus('bash frobnicate --all')
    }),
    bench('chained command with prefixes and pipes', () => {
      toStatus('bash cd app && NODE_ENV=test pnpm --filter web test 2>&1 | tail -50')
    }),
    bench('file tool with a file rule', () => {
      toStatus('read src/components/Button.test.tsx')
    }),
    bench('mixed batch of 9 calls', () => {
      for (const call of CALLS) toStatus(call)
    }),
  )
})
