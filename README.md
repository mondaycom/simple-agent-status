# simple-agent-status

Claude Code's spinner shows a random word ("Discombobulating…") while it works.
This replaces it with what the agent is actually doing: "Installing dependencies…", "Cloning…", "Reading tests…".

Before: `bash grep -rnE --color=always '(?:(api|secret|token|auth|aws|private)[_-]?key\s*[:=]\s*["\x27]?[A-Za-z0-9/+_=.-]{16,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)' --exclude-dir={.git,node_modules,vendor,dist,build,.next} .`

After: `searching code`

| Folder | What it is |
| --- | --- |
| `packages/tool-call-status` | the npm library: `toStatus("bash npm install")` → `"installing dependencies"` |
| `mod` | the Claude Code mod: hooks every tool call and rewrites the spinner's word |

## Library
Will soon be available as an npm package if you want to use this outside claude code
```ts
import { toStatus } from 'tool-call-status'

toStatus('bash cd app && npm install') // "installing dependencies"
toStatus('bash git clone git@github.com:a/b.git') // "cloning"
toStatus('read src/a.test.ts') // "reading tests"
toStatus('SomeUnknownTool') // undefined: no rule matches, the mod keeps Claude Code's own word
```

The input is the tool name, a space, then its main argument. The mappings are in
`packages/tool-call-status/src/rules.ts`: ordered regexes, first match wins, so put specific rules above general ones.
Every status must be 1-2 words; the tests enforce it.

## Install the mod

```
/plugin install tool-status --marketplace mondaycom/simple-agent-status
```

## Develop

```sh
pnpm install
pnpm build        # library first, then the mod bundle (mod/hooks/register.js, committed)
pnpm test         # vitest for the library, `claude plugin test` for the mod
pnpm bench        # library benchmark
claude plugin validate mod
```

Live: run `pnpm -C mod dev` (rebuilds on change) and `claude --plugin-dir ./mod` in another terminal; the session reloads the mod after each rebuild.

A mod can only import its own files, so the library is bundled into `mod/hooks/register.js` and that file is committed.
`pnpm -C mod typecheck` needs the types Claude Code writes into `mod/.claude-plugin/types/` the first time it loads the mod.

Publish the library: `pnpm --filter tool-call-status publish`.

## License

[MIT](LICENSE) © 2026 monday.com Ltd.
