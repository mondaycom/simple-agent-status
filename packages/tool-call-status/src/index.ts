import { BASH_RULES, FILE_RULES, TOOL_STATUS } from './rules'

export { BASH_RULES, FILE_RULES, TOOL_STATUS }

const SHELL_TOOLS = new Set(['bash', 'shell', 'powershell', 'monitor'])
const FILE_TOOLS = new Set(['read', 'edit', 'multiedit', 'write'])

// Segments that set the stage rather than do the work: `cd app && npm test` is "running tests".
const SETUP = /^(cd|pushd|popd|export|unset|set|source|\.|true|false|:|for|while|until|if|case|done|fi|esac)(\s|$)/
// Statuses a later segment should win over: `echo hi; npm test` is "running tests", so is `nvm use && npm test`.
const WEAK = new Set(['printing', 'waiting', 'checking system', 'switching node'])

const PREFIX = /^(sudo|time|g?timeout( --?\w[\w-]*(=\S+)?)* \d\S*|nohup|exec|nice|do|then|else|command(?! -v)|env(\s+-\S+)*|\w+=("[^"]*"|'[^']*'|\S*))\s+/
// A shell function's body is the work: `reply() { gh api ...` is `gh api ...`.
const FUNCTION_DEF = /^(function\s+[\w-]+(\s*\(\))?|[\w-]+\s*\(\))\s*\{?\s*/
const BIN_DIR = /^(\S*\/)?node_modules\/\.bin\//
// A package manager run through another: `npx -y pnpm@10 install` is `pnpm install`.
const PM_VIA = /^((npx|pnpx|bunx)( -y| --yes)*|corepack) (npm|pnpm|yarn)(@\S+)? /
// A heredoc's body is data, not commands: `cat > a.json <<'EOF' ... EOF` keeps only `cat > a.json <<`.
const HEREDOC = /<<-?\s*(['"]?)(\w+)\1([^\n]*)\n[\s\S]*?\n[ \t]*\2(?=\n|$)/g
// Flags between the binary and its subcommand: `pnpm -C mod build`, `git -C repo status`.
// `-w` takes a value in npm (`-w web install`) and none in pnpm (`-w add x`), so it is valueless before a subcommand.
const PM_SUBCOMMAND = '(i|install|ci|add|un|uninstall|remove|rm|up|update|upgrade|run|test|t|build|exec|dlx|x)\\b'
const PM_FLAGS = new RegExp(
  `^(npm|pnpm|yarn|bun) ((-w(?= ${PM_SUBCOMMAND})|-[CFw] \\S+|--(filter|dir|prefix|cwd|workspace) \\S+|--?[\\w-]+(=\\S+)?) )+`,
)
// yarn's `workspace <name>` and `global` sit where other managers put a flag: `yarn workspace web add react`.
const YARN_SCOPE = /^yarn (workspace \S+|global) /
const GIT_FLAGS = /^git ((-[Cc] \S+|--[\w-]+(=\S+)?) )+/

/**
 * Turns a tool call into a 1-2 word status.
 *
 * The input is the tool's name, a space, then its main argument:
 * `"bash npm install"` → `"installing dependencies"`, `"read src/a.test.ts"` → `"reading tests"`.
 * Tool names are case-insensitive. Returns `undefined` when no rule matches, so the caller can keep its own default.
 */
export function toStatus(call: string): string | undefined {
  const trimmed = call.trim()
  const space = trimmed.search(/\s/)
  const name = space < 0 ? trimmed : trimmed.slice(0, space)
  const arg = space < 0 ? '' : trimmed.slice(space + 1).trim()
  const tool = name.toLowerCase()

  if (SHELL_TOOLS.has(tool)) return commandStatus(arg)
  if (tool.startsWith('mcp__')) return `using ${mcpServer(name)}`

  const status = TOOL_STATUS[tool]
  if (status === undefined) return undefined
  if (FILE_TOOLS.has(tool) && arg) {
    const noun = FILE_RULES.find(([re]) => re.test(arg))?.[1]
    if (noun !== undefined) return `${status} ${noun}`
  }
  return status
}

// Only the head of a command decides its status, so longer input is cut before any regex runs over it.
const MAX_COMMAND_LENGTH = 16_384

/** The status of a shell command line: `"git clone x"` → `"cloning"`; `undefined` when no rule matches. */
export function commandStatus(command: string): string | undefined {
  command = command.slice(0, MAX_COMMAND_LENGTH)
  let weak: string | undefined
  // shortcut: splits on operators without parsing quotes, fine for picking the command that matters
  for (const segment of command.replace(HEREDOC, '<<$3').split(/&&|\|\||[;|\n]/)) {
    const cmd = normalize(segment)
    if (!cmd || SETUP.test(cmd)) continue
    const status = BASH_RULES.find(([re]) => re.test(cmd))?.[1]
    if (status === undefined) continue
    if (!WEAK.has(status)) return status
    weak ??= status
  }
  return weak
}

function normalize(segment: string): string {
  let cmd = segment.trim().replace(/^[({]\s*/, '')
  for (let prev = ''; prev !== cmd; ) {
    prev = cmd
    cmd = cmd.replace(PREFIX, '')
  }
  return cmd
    .replace(FUNCTION_DEF, '')
    .replace(BIN_DIR, '')
    .replace(PM_VIA, '$4 ')
    .replace(PM_FLAGS, '$1 ')
    .replace(YARN_SCOPE, 'yarn ')
    .replace(GIT_FLAGS, 'git ')
}

// `mcp__plugin_slack_slack__send_message` → "slack"
function mcpServer(name: string): string {
  const server = name.split('__')[1] ?? ''
  return server.split('_').pop() || 'tool'
}
