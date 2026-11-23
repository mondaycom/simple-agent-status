import { atom, read, update } from "claude-code";
// ../packages/tool-call-status/dist/index.js
const BASH_RULES = [
	[/^(npm|pnpm|yarn|bun) (i|install|ci|add)\b/, "installing dependencies"],
	[/^(yarn|bun)$/, "installing dependencies"],
	[/^(npm|pnpm|yarn|bun) (un|uninstall|remove|rm)\b/, "removing dependencies"],
	[/^(npm|pnpm|yarn|bun) (up|update|upgrade)\b/, "updating dependencies"],
	[/^(npm|pnpm|yarn) outdated\b/, "checking updates"],
	[/^(npm|pnpm|yarn) audit\b/, "auditing dependencies"],
	[/^(npm|pnpm|yarn|bun) (publish|pack)\b/, "publishing package"],
	[/^(npm|pnpm|yarn) (ls|list|why)\b/, "listing dependencies"],
	[/^npm (view|info|show)\b/, "checking package"],
	[/^(npm|pnpm|yarn) version\b/, "bumping version"],
	[/^(npm|pnpm|yarn) (init|create)\b/, "scaffolding project"],
	[/^(npm|pnpm|yarn|bun) (run |run-script )?(test|t)\b/, "running tests"],
	[/^(npm|pnpm|yarn|bun) (run )?build\b/, "building"],
	[/^(npm|pnpm|yarn|bun) (run )?(lint|eslint)\b/, "linting"],
	[/^(npm|pnpm|yarn|bun) (run )?(format|fmt|prettier)\b/, "formatting"],
	[/^(npm|pnpm|yarn|bun) (run )?(typecheck|tsc|check-types|types)\b/, "type checking"],
	[/^(npm|pnpm|yarn|bun) (run )?(dev|start|serve)\b/, "starting server"],
	[/^(npm|pnpm|yarn|bun) (run )?bench\b/, "benchmarking"],
	[/^(npm|pnpm|yarn|bun) (run )?(e2e|test:e2e)\b/, "running e2e"],
	[/^(npm|pnpm|yarn|bun) (run )?(deploy|release)\b/, "deploying"],
	[/^(npm|pnpm|yarn|bun) (run|exec|dlx|x)\b/, "running script"],
	[/^((npx|bunx|pnpx) (-y )?)?vitest bench\b/, "benchmarking"],
	[/^((npx|bunx|pnpx) (-y )?)?(tsdown|tsup|esbuild|rollup|rolldown|webpack|parcel build|vite build|next build|turbo (run )?build)\b/, "building"],
	[/^(npx|bunx|pnpx) (-y )?(vitest|jest|mocha|ava|playwright test)\b/, "running tests"],
	[/^(npx|bunx|pnpx) (-y )?(tsc|vue-tsc)\b/, "type checking"],
	[/^(npx|bunx|pnpx) (-y )?(eslint|biome|oxlint)\b/, "linting"],
	[/^(npx|bunx|pnpx) (-y )?prettier\b/, "formatting"],
	[/^(npx|bunx|pnpx) (-y )?(prisma|drizzle-kit) (migrate|db push)\b/, "migrating database"],
	[/^(npx|bunx|pnpx) (-y )?create-/, "scaffolding project"],
	[/^(npx|bunx|pnpx)\b/, "running package"],
	[/^corepack\b/, "setting up"],
	[/^(nvm|fnm|volta) (use|install)\b/, "switching node"],
	[/^(pip(3(\.\d+)?)?|uv pip|pipx|(python[\d.]*|py) -m pip) install\b/, "installing dependencies"],
	[/^(poetry|pipenv|uv) (install|sync|add)\b/, "installing dependencies"],
	[/^(pip(3(\.\d+)?)?|uv pip|(python[\d.]*|py) -m pip) uninstall\b/, "removing dependencies"],
	[/^(pip(3(\.\d+)?)?|uv pip|(python[\d.]*|py) -m pip) (list|freeze|show)\b/, "listing dependencies"],
	[/^(python3?|uv run|poetry run) -m (pytest|unittest)\b/, "running tests"],
	[/^(uv run |poetry run )?(pytest|tox|nox)\b/, "running tests"],
	[/^(uv run |poetry run )?(mypy|pyright)\b/, "type checking"],
	[/^(uv run |poetry run )?(ruff check|flake8|pylint)\b/, "linting"],
	[/^(uv run |poetry run )?(ruff format|black|isort)\b/, "formatting"],
	[/^(python3?|uv run) -m venv\b/, "creating venv"],
	[/^(uv venv|virtualenv)\b/, "creating venv"],
	[/^(python3?|uv run|poetry run) manage\.py migrate\b/, "migrating database"],
	[/^(alembic upgrade|flask db upgrade)\b/, "migrating database"],
	[/^(python3?|uv run|poetry run)\b/, "running python"],
	[/^cargo (build|b)\b/, "building"],
	[/^cargo (test|t|nextest)\b/, "running tests"],
	[/^cargo (check|c)\b/, "checking code"],
	[/^cargo clippy\b/, "linting"],
	[/^cargo fmt\b/, "formatting"],
	[/^cargo (add|install)\b/, "installing dependencies"],
	[/^cargo run\b/, "running program"],
	[/^cargo bench\b/, "benchmarking"],
	[/^go build\b/, "building"],
	[/^go test\b/, "running tests"],
	[/^go (get|mod download|install)\b/, "installing dependencies"],
	[/^go mod tidy\b/, "tidying modules"],
	[/^go vet\b/, "checking code"],
	[/^(go fmt|gofmt)\b/, "formatting"],
	[/^go run\b/, "running program"],
	[/^golangci-lint\b/, "linting"],
	[/^(\.\/)?(gradlew?|mvnw?) .*\btest\b/, "running tests"],
	[/^(\.\/)?(gradlew?|mvnw?)\b/, "building"],
	[/^dotnet test\b/, "running tests"],
	[/^dotnet (build|publish)\b/, "building"],
	[/^dotnet (add|restore)\b/, "installing dependencies"],
	[/^bundle (install|add)\b/, "installing dependencies"],
	[/^(bundle exec )?(rspec|rake test)\b/, "running tests"],
	[/^(bundle exec )?rubocop\b/, "linting"],
	[/^(bundle exec )?rails db:migrate\b/, "migrating database"],
	[/^gem install\b/, "installing gems"],
	[/^composer (install|require|update)\b/, "installing dependencies"],
	[/^(vendor\/bin\/)?(phpunit|pest)\b/, "running tests"],
	[/^(swift build|xcodebuild)\b/, "building"],
	[/^swift test\b/, "running tests"],
	[/^(pod|carthage) install\b/, "installing pods"],
	[/^mix test\b/, "running tests"],
	[/^mix deps\.get\b/, "installing dependencies"],
	[/^(make|cmake|ninja|bazel build|meson)\b.*\btest\b/, "running tests"],
	[/^(make|cmake|ninja|bazel build|meson|gcc|g\+\+|clang|rustc|javac|tsc)\b/, "compiling"],
	[/^(node|deno run|bun run|tsx|ts-node)\b/, "running script"],
	[/^(vitest|jest|mocha|playwright test|cypress run|deno test|bun test)\b/, "running tests"],
	[/^(eslint|biome (check|lint)|oxlint|stylelint|shellcheck)\b/, "linting"],
	[/^(prettier|biome format|dprint)\b/, "formatting"],
	[/^git clone\b/, "cloning"],
	[/^git (pull|fetch)\b/, "pulling changes"],
	[/^git push\b/, "pushing"],
	[/^git commit\b/, "committing"],
	[/^git add\b/, "staging changes"],
	[/^git (status|diff --stat)\b/, "checking status"],
	[/^git (diff|show)\b/, "reviewing changes"],
	[/^git (log|shortlog|reflog)\b/, "reading history"],
	[/^git blame\b/, "blaming"],
	[/^git (checkout -b|switch -c|branch)\b/, "branching"],
	[/^git (checkout|switch)\b/, "switching branch"],
	[/^git merge\b/, "merging"],
	[/^git rebase\b/, "rebasing"],
	[/^git cherry-pick\b/, "cherry-picking"],
	[/^git stash\b/, "stashing"],
	[/^git (reset|restore|revert)\b/, "reverting changes"],
	[/^git tag\b/, "tagging"],
	[/^git (rm|mv)\b/, "moving files"],
	[/^git (worktree|submodule)\b/, "managing repo"],
	[/^git (grep|ls-files)\b/, "searching repo"],
	[/^git bisect\b/, "bisecting"],
	[/^git init\b/, "initializing repo"],
	[/^git (remote|config)\b/, "configuring git"],
	[/^git\b/, "using git"],
	[/^gh pr create\b/, "opening PR"],
	[/^gh pr (merge)\b/, "merging PR"],
	[/^gh pr (checks|status)\b/, "checking CI"],
	[/^gh pr (review|comment)\b/, "reviewing PR"],
	[/^gh pr\b/, "reading PR"],
	[/^gh issue create\b/, "filing issue"],
	[/^gh issue\b/, "reading issues"],
	[/^gh (run|workflow)\b/, "checking CI"],
	[/^gh repo clone\b/, "cloning"],
	[/^gh release\b/, "releasing"],
	[/^gh api\b/, "calling GitHub"],
	[/^gh\b/, "using GitHub"],
	[/^glab\b/, "using GitLab"],
	[/^docker (build|buildx)\b/, "building image"],
	[/^docker(-| )compose (up|start)\b/, "starting containers"],
	[/^docker(-| )compose (down|stop)\b/, "stopping containers"],
	[/^docker(-| )compose logs\b/, "reading logs"],
	[/^docker (run|start)\b/, "starting container"],
	[/^docker (stop|kill|rm)\b/, "stopping container"],
	[/^docker (pull)\b/, "pulling image"],
	[/^docker (push)\b/, "pushing image"],
	[/^docker (ps|images|inspect)\b/, "inspecting containers"],
	[/^docker logs\b/, "reading logs"],
	[/^docker exec\b/, "using container"],
	[/^docker\b/, "using docker"],
	[/^kubectl (apply|create)\b/, "deploying"],
	[/^kubectl (get|describe|top)\b/, "inspecting cluster"],
	[/^kubectl logs\b/, "reading logs"],
	[/^kubectl (delete)\b/, "deleting resources"],
	[/^kubectl (rollout|scale)\b/, "rolling out"],
	[/^kubectl (exec|port-forward)\b/, "connecting pod"],
	[/^kubectl\b/, "using kubectl"],
	[/^helm (install|upgrade)\b/, "deploying chart"],
	[/^helm\b/, "using helm"],
	[/^terraform (plan)\b/, "planning infra"],
	[/^terraform (apply)\b/, "applying infra"],
	[/^terraform (init)\b/, "initializing terraform"],
	[/^terraform\b/, "using terraform"],
	[/^aws s3\b/, "using S3"],
	[/^aws\b/, "calling AWS"],
	[/^gcloud\b/, "calling GCP"],
	[/^az\b/, "calling Azure"],
	[/^(vercel|netlify|fly|wrangler)\b/, "deploying"],
	[/^(curl|wget|http|xh)\b/, "fetching URL"],
	[/^(ssh|mosh)\b/, "connecting remotely"],
	[/^(scp|rsync|sftp)\b/, "copying remotely"],
	[/^(ping|dig|nslookup|traceroute|host)\b/, "checking network"],
	[/^(lsof|netstat|ss) /, "checking ports"],
	[/^(psql|mysql|sqlite3|mongosh?|redis-cli)\b/, "querying database"],
	[/^(rg|grep|egrep|ag|ack)\b/, "searching code"],
	[/^(find|fd|locate)\b/, "finding files"],
	[/^(ls|tree|exa|eza|du|stat|file)\b/, "listing files"],
	[/^(cat|echo|printf)\b.*(\s>>?\s?\S|<<)|^tee\b/, "writing files"],
	[/^(cat|head|tail|less|more|bat|wc|nl|sed -n)\b/, "reading files"],
	[/^(sed|gsed)\b.* -i\b|^perl -pi\b/, "editing files"],
	[/^(sed|awk|tr)\b/, "processing text"],
	[/^(mkdir|touch)\b/, "creating files"],
	[/^(cp)\b/, "copying files"],
	[/^(mv|rename)\b/, "moving files"],
	[/^(rm|rmdir|trash)\b/, "deleting files"],
	[/^(chmod|chown|chgrp)\b/, "changing permissions"],
	[/^(ln)\b/, "linking files"],
	[/^(tar|zip|gzip|gunzip|unzip|7z|xz)\b/, "archiving"],
	[/^(diff|cmp|comm)\b/, "comparing files"],
	[/^(jq|yq|xq)\b/, "parsing JSON"],
	[/^(sort|uniq|cut|column)\b/, "processing text"],
	[/^(open|xdg-open)\b/, "opening"],
	[/^(ps|top|htop|pgrep)\b/, "checking processes"],
	[/^(kill|pkill|killall)\b/, "stopping process"],
	[/^(brew|apt|apt-get|yum|dnf|pacman|apk) (install|add)\b/, "installing packages"],
	[/^(brew|apt|apt-get) (update|upgrade)\b/, "updating packages"],
	[/^(brew|apt|apt-get|yum|dnf|pacman|apk)\b/, "managing packages"],
	[/^(sleep|wait)\b/, "waiting"],
	[/^(which|type|command -v|whereis)\b/, "locating tool"],
	[/^(env|printenv)$/, "checking env"],
	[/^(pwd|whoami|uname|hostname|date|id)\b/, "checking system"],
	[/^(echo|printf)\b/, "printing"],
	[/^mirrord\b/, "mirroring service"],
	[/^tsh (proxy|db connect)\b/, "opening tunnel"],
	[/^tsh login\b/, "logging in"],
	[/^tsh\b/, "using teleport"],
	[/^osascript\b/, "scripting apps"],
	[/^claude plugin validate\b/, "validating plugin"],
	[/^claude plugin test\b/, "running tests"],
	[/^claude plugin (install|marketplace add)\b/, "installing plugin"],
	[/^(claude)\b/, "running claude"],
	[/^((\.\.?|~)?\/\S*\.(sh|bash|zsh)\b|\.\/|(bash|sh|zsh) )\S*/, "running script"]
];
const TOOL_STATUS = {
	read: "reading",
	edit: "editing",
	multiedit: "editing",
	write: "writing",
	notebookedit: "editing notebook",
	notebookread: "reading notebook",
	grep: "searching code",
	glob: "finding files",
	ls: "listing files",
	lsp: "inspecting code",
	webfetch: "fetching page",
	websearch: "searching web",
	agent: "delegating",
	task: "delegating",
	workflow: "orchestrating",
	sendmessage: "messaging agent",
	todowrite: "planning",
	taskcreate: "planning",
	taskupdate: "updating plan",
	enterplanmode: "planning",
	exitplanmode: "presenting plan",
	askuserquestion: "asking you",
	subagenthandback: "reporting back",
	structuredoutput: "reporting",
	skill: "loading skill",
	toolsearch: "finding tools",
	bashoutput: "checking output",
	killshell: "stopping task",
	taskstop: "stopping task",
	croncreate: "scheduling",
	crondelete: "unscheduling",
	cronlist: "checking schedule",
	schedulewakeup: "scheduling",
	enterworktree: "creating worktree",
	exitworktree: "leaving worktree",
	listmcpresourcestool: "listing resources",
	readmcpresourcetool: "reading resource"
};
const FILE_RULES = [
	[/(\.|_|-)(test|spec)\.\w+$|(^|\/)(__tests__|tests?)\//, "tests"],
	[/(^|\/)(package\.json|pyproject\.toml|Cargo\.toml|go\.mod|Gemfile|requirements[\w-]*\.txt)$/, "manifest"],
	[/(^|\/)(README|CHANGELOG|CONTRIBUTING)[^/]*$|\.mdx?$/i, "docs"],
	[/(^|\/)(CLAUDE|AGENTS)\.md$/, "instructions"],
	[/(^|\/)(\.github\/workflows\/|\.gitlab-ci)/, "workflows"],
	[/(^|\/)(Dockerfile|docker-compose[\w.-]*)$/, "Dockerfile"],
	[/\.(json|ya?ml|toml|ini)$|(^|\/)\.\w+rc$|\.config\.\w+$/, "config"],
	[/\.(css|scss|sass|less)$/, "styles"],
	[/\.(sql)$|(^|\/)migrations?\//, "migrations"],
	[/(^|\/)\.env/, "env"],
	[/\.(png|jpe?g|gif|svg|webp)$/, "image"],
	[/\.pdf$/, "PDF"],
	[/\.lock$|-lock\.(json|yaml)$/, "lockfile"]
];
const SHELL_TOOLS = /* @__PURE__ */ new Set([
	"bash",
	"shell",
	"powershell",
	"monitor"
]);
const FILE_TOOLS = /* @__PURE__ */ new Set([
	"read",
	"edit",
	"multiedit",
	"write"
]);
const SETUP = /^(cd|pushd|popd|export|unset|set|source|\.|true|false|:|for|while|until|if|case|done|fi|esac)(\s|$)/;
const WEAK = /* @__PURE__ */ new Set([
	"printing",
	"waiting",
	"checking system",
	"switching node"
]);
const PREFIX = /^(sudo|time|g?timeout( --?\w[\w-]*(=\S+)?)* \d\S*|nohup|exec|nice|do|then|else|command(?! -v)|env(\s+-\S+)*|\w+=("[^"]*"|'[^']*'|\S*))\s+/;
const FUNCTION_DEF = /^(function\s+[\w-]+(\s*\(\))?|[\w-]+\s*\(\))\s*\{?\s*/;
const BIN_DIR = /^(\S*\/)?node_modules\/\.bin\//;
const PM_VIA = /^((npx|pnpx|bunx)( -y| --yes)*|corepack) (npm|pnpm|yarn)(@\S+)? /;
const HEREDOC = /<<-?\s*(['"]?)(\w+)\1([^\n]*)\n[\s\S]*?\n[ \t]*\2(?=\n|$)/g;
const PM_FLAGS = new RegExp(`^(npm|pnpm|yarn|bun) ((-w(?= (i|install|ci|add|un|uninstall|remove|rm|up|update|upgrade|run|test|t|build|exec|dlx|x)\\b)|-[CFw] \\S+|--(filter|dir|prefix|cwd|workspace) \\S+|--?[\\w-]+(=\\S+)?) )+`);
const YARN_SCOPE = /^yarn (workspace \S+|global) /;
const GIT_FLAGS = /^git ((-[Cc] \S+|--[\w-]+(=\S+)?) )+/;
/**
* Turns a tool call into a 1-2 word status.
*
* The input is the tool's name, a space, then its main argument:
* `"bash npm install"` → `"installing dependencies"`, `"read src/a.test.ts"` → `"reading tests"`.
* Tool names are case-insensitive. Returns `undefined` when no rule matches, so the caller can keep its own default.
*/
function toStatus(call) {
	const trimmed = call.trim();
	const space = trimmed.search(/\s/);
	const name = space < 0 ? trimmed : trimmed.slice(0, space);
	const arg = space < 0 ? "" : trimmed.slice(space + 1).trim();
	const tool = name.toLowerCase();
	if (SHELL_TOOLS.has(tool)) return commandStatus(arg);
	if (tool.startsWith("mcp__")) return `using ${mcpServer(name)}`;
	const status = TOOL_STATUS[tool];
	if (status === void 0) return void 0;
	if (FILE_TOOLS.has(tool) && arg) {
		const noun = FILE_RULES.find(([re]) => re.test(arg))?.[1];
		if (noun !== void 0) return `${status} ${noun}`;
	}
	return status;
}
const MAX_COMMAND_LENGTH = 16384;
/** The status of a shell command line: `"git clone x"` → `"cloning"`; `undefined` when no rule matches. */
function commandStatus(command) {
	command = command.slice(0, MAX_COMMAND_LENGTH);
	let weak;
	for (const segment of command.replace(HEREDOC, "<<$3").split(/&&|\|\||[;|\n]/)) {
		const cmd = normalize(segment);
		if (!cmd || SETUP.test(cmd)) continue;
		const status = BASH_RULES.find(([re]) => re.test(cmd))?.[1];
		if (status === void 0) continue;
		if (!WEAK.has(status)) return status;
		weak ??= status;
	}
	return weak;
}
function normalize(segment) {
	let cmd = segment.trim().replace(/^[({]\s*/, "");
	for (let prev = ""; prev !== cmd;) {
		prev = cmd;
		cmd = cmd.replace(PREFIX, "");
	}
	return cmd.replace(FUNCTION_DEF, "").replace(BIN_DIR, "").replace(PM_VIA, "$4 ").replace(PM_FLAGS, "$1 ").replace(YARN_SCOPE, "yarn ").replace(GIT_FLAGS, "git ");
}
function mcpServer(name) {
	return (name.split("__")[1] ?? "").split("_").pop() || "tool";
}
// src/register.ts
const current = atom({
	plugin: "tool-status",
	key: "current"
}, null);
const ARG_KEYS = [
	"command",
	"file_path",
	"notebook_path",
	"pattern",
	"url",
	"query",
	"skill",
	"description"
];
const register = (on) => {
	on("turn.start", async ($, e, next) => {
		if (e.agentId === void 0) await update($, current, () => null);
		return next(e);
	}).catch(($, e, next) => next(e));
	on("tool.call", async ($, e, next) => {
		const input = e;
		const arg = ARG_KEYS.map((key) => input[key]).find((value) => typeof value === "string") ?? "";
		const status = toStatus(`${String(e.tool)} ${arg}`);
		if (status !== void 0) await update($, current, () => status);
		return next(e);
	}).catch(($, e, next) => next(e));
	on("ui.render", { component: "Spinner" }, async ($, e, next) => {
		const status = await read($, current);
		if (status === null || e.props.message !== null) return next(e);
		const word = status.charAt(0).toUpperCase() + status.slice(1);
		return next({
			...e,
			props: {
				...e.props,
				word
			}
		});
	});
};
export { register };
