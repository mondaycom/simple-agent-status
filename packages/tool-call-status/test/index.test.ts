import { describe, expect, it } from 'vitest'

import { BASH_RULES, FILE_RULES, TOOL_STATUS, commandStatus, toStatus } from '../src'

describe('toStatus: shell commands', () => {
  it.each([
    ['bash npm install', 'installing dependencies'],
    ['bash git clone git@github.com:a/b.git', 'cloning'],
    ['Bash pnpm add -D vitest', 'installing dependencies'],
    ['bash yarn', 'installing dependencies'],
    ['bash npm ci', 'installing dependencies'],
    ['bash npm i -g pnpm', 'installing dependencies'],
    ['bash npm --prefix app install', 'installing dependencies'],
    ['bash npm -w web install react', 'installing dependencies'],
    ['bash yarn install --frozen-lockfile', 'installing dependencies'],
    ['bash yarn workspace web add react', 'installing dependencies'],
    ['bash yarn global add serve', 'installing dependencies'],
    ['bash pnpm i', 'installing dependencies'],
    ['bash pnpm -w add -D typescript', 'installing dependencies'],
    ['bash pnpm --filter web add react', 'installing dependencies'],
    ['bash bun install', 'installing dependencies'],
    ['bash bun add -d x', 'installing dependencies'],
    ['bash bun', 'installing dependencies'],
    ['bash pip3 install -r requirements.txt', 'installing dependencies'],
    ['bash pip3.12 install requests', 'installing dependencies'],
    ['bash python -m pip install requests', 'installing dependencies'],
    ['bash python3 -m pip install -U pip', 'installing dependencies'],
    ['bash python3.12 -m pip install -e .', 'installing dependencies'],
    ['bash py -m pip install requests', 'installing dependencies'],
    ['bash python -m pip uninstall requests', 'removing dependencies'],
    ['bash python -m pip list', 'listing dependencies'],
    ['bash npm uninstall lodash', 'removing dependencies'],
    ['bash pnpm -w run build', 'building'],
    ['bash npm run install-hooks', 'running script'],
    ['bash npm test', 'running tests'],
    ['bash npm run test -- --watch=false', 'running tests'],
    ['bash pnpm -C mod build', 'building'],
    ['bash pnpm --filter tool-call-status test', 'running tests'],
    ['bash pnpm -r typecheck', 'type checking'],
    ['bash npm run lint', 'linting'],
    ['bash npm run dev', 'starting server'],
    ['bash npm run some-script', 'running script'],
    ['bash npx vitest run', 'running tests'],
    ['bash npx -y tsc --noEmit', 'type checking'],
    ['bash ./node_modules/.bin/eslint .', 'linting'],
    ['bash npx create-vite my-app', 'scaffolding project'],
    ['bash pip install -r requirements.txt', 'installing dependencies'],
    ['bash uv sync', 'installing dependencies'],
    ['bash python -m pytest -x', 'running tests'],
    ['bash pytest tests/', 'running tests'],
    ['bash python script.py', 'running python'],
    ['bash cargo test', 'running tests'],
    ['bash cargo clippy -- -D warnings', 'linting'],
    ['bash go test ./...', 'running tests'],
    ['bash go mod tidy', 'tidying modules'],
    ['bash ./gradlew test', 'running tests'],
    ['bash make', 'compiling'],
    ['bash make test', 'running tests'],
    ['bash git status', 'checking status'],
    ['bash git -C ../repo status', 'checking status'],
    ['bash git --no-pager log --oneline -5', 'reading history'],
    ['bash git diff HEAD~1', 'reviewing changes'],
    ['bash git add -A', 'staging changes'],
    ['bash git commit -m "fix: thing"', 'committing'],
    ['bash git push origin main', 'pushing'],
    ['bash git pull --rebase', 'pulling changes'],
    ['bash git checkout -b feature', 'branching'],
    ['bash git checkout main', 'switching branch'],
    ['bash git rebase -i HEAD~3', 'rebasing'],
    ['bash git frobnicate', 'using git'],
    ['bash gh pr create --fill', 'opening PR'],
    ['bash gh pr checks 12', 'checking CI'],
    ['bash gh pr view 12', 'reading PR'],
    ['bash gh run watch', 'checking CI'],
    ['bash docker build -t app .', 'building image'],
    ['bash docker compose up -d', 'starting containers'],
    ['bash docker-compose down', 'stopping containers'],
    ['bash kubectl get pods', 'inspecting cluster'],
    ['bash kubectl logs -f api', 'reading logs'],
    ['bash terraform plan', 'planning infra'],
    ['bash curl -s https://example.com', 'fetching URL'],
    ['bash rg "TODO" src', 'searching code'],
    ['bash grep -rn foo .', 'searching code'],
    ['bash find . -name "*.ts"', 'finding files'],
    ['bash ls -la', 'listing files'],
    ['bash cat package.json', 'reading files'],
    ['bash rm -rf dist', 'deleting files'],
    ['bash mkdir -p src/lib', 'creating files'],
    ['bash jq .version package.json', 'parsing JSON'],
    ['bash psql -c "select 1"', 'querying database'],
    ['bash brew install jq', 'installing packages'],
    ['bash kill 1234', 'stopping process'],
    ['bash sleep 5', 'waiting'],
    ['bash ./scripts/deploy.sh', 'running script'],
  ])('%s → %s', (call, status) => {
    expect(toStatus(call)).toBe(status)
  })
})

describe('commandStatus: picking the command that matters', () => {
  it.each([
    ['cd app && npm install', 'installing dependencies'],
    ['cd app; export CI=1; npm test', 'running tests'],
    ['sudo apt-get install -y curl', 'installing packages'],
    ['NODE_ENV=test FOO="a b" npm test', 'running tests'],
    ['env -i npm test', 'running tests'],
    ['time cargo build --release', 'building'],
    ['echo start && npm run build', 'building'],
    ['npm test 2>&1 | tail -20', 'running tests'],
    ['cat log.txt | grep error', 'reading files'],
    ['(cd pkg && go test ./...)', 'running tests'],
    ['git add . && git commit -m wip', 'staging changes'],
    ['echo hello', 'printing'],
    ['frobnicate --all', undefined],
    ['', undefined],
    ['cd app', undefined],
  ])('%s → %s', (command, status) => {
    expect(commandStatus(command)).toBe(status)
  })
})

// Real calls from the session that built this library.
describe('commandStatus: commands from a real session', () => {
  const heredoc = (body: string) => `cat > package.json <<'EOF'\n${body}\nEOF`

  it.each([
    ['ls -la /Users/me/simple-agent-status', 'listing files'],
    ['cd /tmp/skill; grep -n -i -E "import|bundl" reference.md | head -60', 'searching code'],
    ['cd /tmp/skill; sed -n 10,60p reference.md | cut -c1-1200', 'reading files'],
    ['f=dist/config.d.ts; sed -n 3240,3275p $f; grep -n "interface Bench" $f', 'reading files'],
    ["sed -i '' \"s/'a'/'b'/\" src/rules.ts && grep -c x src/rules.ts", 'editing files'],
    ["sed 's/a/b/' file.txt", 'processing text'],
    ['npm view agent-status name 2>&1 | head -2', 'checking package'],
    ['for n in a b; do printf "%s: " $n; npm view $n name 2>&1 | grep -q E404 && echo free; done', 'checking package'],
    ['if [ -d dist ]; then rm -rf dist; fi', 'deleting files'],
    [heredoc('{ "name": "x" }'), 'writing files'],
    ['cd packages/lib\n' + heredoc('{}'), 'writing files'],
    ['echo "dist" > .gitignore', 'writing files'],
    ['npm test 2>&1 | tail', 'running tests'],
    [heredoc('rm -rf /\ngit push --force') + '\nnpm test', 'writing files'],
    ["python3 - <<'EOF'\nimport os\nos.system('rm -rf x')\nEOF", 'running python'],
    ['npx -y pnpm@10.18.0 install 2>&1 | tail -15', 'installing dependencies'],
    ['npx -y pnpm@10.18.0 -r build 2>&1 | tail -12; ls mod/hooks', 'building'],
    ['npx -y pnpm@10.18.0 bench', 'benchmarking'],
    ['npx -y pnpm@10.18.0 test', 'running tests'],
    ['corepack pnpm install', 'installing dependencies'],
    ['npx vitest run 2>&1 | grep FAIL', 'running tests'],
    ['npx vitest bench --run --reporter=verbose 2>&1 | tail -25', 'benchmarking'],
    ['vitest bench', 'benchmarking'],
    ['npx tsc -p . && echo TSC_OK', 'type checking'],
    ['cd mod && npx tsdown 2>&1 | head -20', 'building'],
    ['tsup src/index.ts', 'building'],
    ['npx vite build', 'building'],
    ['claude plugin validate . 2>&1 | tail -30', 'validating plugin'],
    ['claude plugin test . 2>&1 | tail -25', 'running tests'],
    ['claude plugin install tool-status --marketplace a/b', 'installing plugin'],
    ['claude -p "hi"', 'running claude'],
    ['D=/tmp/mods; cd $D && mv mod/hooks . && rmdir mod', 'moving files'],
    ['cp mod/hooks/register.js /tmp/hooks/register.js && grep -c x /tmp/hooks/register.js', 'copying files'],
    ['npm view vitest version && sleep 3', 'checking package'],
    ['which pnpm node claude; node -v', 'locating tool'],
    ['source ~/.nvm/nvm.sh >/dev/null && nvm use >/dev/null; npx vitest run', 'running tests'],
    ['source ~/.nvm/nvm.sh && nvm use && npm ci', 'installing dependencies'],
    ['nvm use >/dev/null; npx eslint --max-warnings=0 src', 'linting'],
    ['nvm use 20', 'switching node'],
    [`cd /tmp/pwdrive && timeout 200 node run.cjs "await page.goto('https://x')"`, 'running script'],
    ['timeout --signal=KILL 60s npm test', 'running tests'],
    ['gtimeout 30 curl -s https://x', 'fetching URL'],
    ['cd svc && source ~/.nvm/nvm.sh && nvm use && RUST_LOG=info mirrord exec -- node server.js', 'mirroring service'],
    ['mirrord exec -- node server.js', 'mirroring service'],
    ['tsh proxy db --tunnel --port=33061 mydb', 'opening tunnel'],
    ['tsh login --proxy=x', 'logging in'],
    ['tsh status', 'using teleport'],
    ["osascript <<'OSA'\ntell application \"Google Chrome\"\n  activate\nend tell\nOSA", 'scripting apps'],
    [`/Users/me/.claude/plugins/cache/x/run.sh '{"list":true}'`, 'running script'],
    [`/tmp/relay.sh 123 'hi'`, 'running script'],
    ['~/bin/sync.sh', 'running script'],
    [`reply() { gh api -X POST repos/a/b/pulls/1/comments/$1/replies -f body="$2"; }\nreply 42 "Fixed"`, 'calling GitHub'],
    [`function reply { gh api graphql -f query=x; }`, 'calling GitHub'],
  ])('%s → %s', (command, status) => {
    expect(commandStatus(command)).toBe(status)
  })
})

describe('toStatus: other tools', () => {
  it.each([
    ['read src/index.ts', 'reading'],
    ['Read src/index.test.ts', 'reading tests'],
    ['edit package.json', 'editing manifest'],
    ['write README.md', 'writing docs'],
    ['edit .github/workflows/ci.yml', 'editing workflows'],
    ['read tsconfig.json', 'reading config'],
    ['grep TODO', 'searching code'],
    ['glob **/*.ts', 'finding files'],
    ['WebFetch https://example.com', 'fetching page'],
    ['websearch claude code mods', 'searching web'],
    ['Agent explore the repo', 'delegating'],
    ['TodoWrite', 'planning'],
    ['Skill plugin-authoring', 'loading skill'],
    ['Write packages/lib/src/rules.ts', 'writing'],
    ['AskUserQuestion', 'asking you'],
    ['StructuredOutput', 'reporting'],
    ['SubagentHandback', 'reporting back'],
    ['mcp__plugin_slack_slack__slack_send_message', 'using slack'],
    ['mcp__github__create_issue {"title":"x"}', 'using github'],
    ['SomeNewTool', undefined],
    ['', undefined],
    ['bash frobnicate --all', undefined],
    ['bash', undefined],
    ['   bash   npm i  ', 'installing dependencies'],
  ])('%s → %s', (call, status) => {
    expect(toStatus(call)).toBe(status)
  })
})

describe('commandStatus: pathological input stays fast', () => {
  const ms = (command: string) => {
    const start = Date.now()
    commandStatus(command)
    return Date.now() - start
  }

  it('many double-dash timeout flags', () => {
    expect(ms('timeout' + ' --foreground'.repeat(40) + ' x')).toBeLessThan(50)
  })

  it('an unterminated heredoc over blank-ish lines', () => {
    expect(ms('cat <<EOF\n' + ' \n'.repeat(20_000) + 'x')).toBeLessThan(100)
  })

  it('many unterminated heredocs in a huge command', () => {
    expect(ms('cat <<EOF\n'.repeat(100_000))).toBeLessThan(100)
  })
})

describe('every status is short', () => {
  const words = (s: string) => s.split(' ').length
  const fileVerbs = ['reading', 'editing', 'writing']

  it('bash rules are 1-2 words', () => {
    for (const [re, status] of BASH_RULES) expect(words(status), String(re)).toBeLessThanOrEqual(2)
  })

  it('tool statuses are 1-2 words', () => {
    for (const status of Object.values(TOOL_STATUS)) expect(words(status), status).toBeLessThanOrEqual(2)
  })

  it('file verbs plus a file noun are 1-2 words', () => {
    for (const [, noun] of FILE_RULES)
      for (const verb of fileVerbs) expect(words(`${verb} ${noun}`), noun).toBeLessThanOrEqual(2)
  })

  it('every rule is anchored, so it matches the command and not an argument', () => {
    for (const [re] of BASH_RULES) expect(re.source.startsWith('^'), String(re)).toBe(true)
  })
})
