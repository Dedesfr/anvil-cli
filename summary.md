# Anvil CLI — Conversation Summary

## Project Overview

**Anvil CLI** is a fork of `opencode` (Bun monorepo + Turborepo) with proprietary Anvil features added on top. The main package is at `packages/opencode/`. The CLI binary is named `anvil`.

The current work in this thread focused on:
- Prompter integration and workspace commands
- TUI hidden template slash commands
- OpenCode/Anvil skill handling in the TUI
- Bundled proprietary Anvil skills
- Command naming cleanup around provider auth vs Anvil account auth

## Important Constraints

### 1. Real cwd preservation

`bun run --cwd pkgDir` overrides `process.cwd()`. This was fixed by:

**`packages/opencode/bin/opencode`**
```ts
env: { ...process.env, ANVIL_USER_CWD: process.cwd() }
```

**`packages/opencode/src/index.ts`**
```ts
if (process.env.ANVIL_USER_CWD) process.chdir(process.env.ANVIL_USER_CWD)
```

### 2. Package-level commands

- Run typecheck from `packages/opencode`, never from repo root.
- In this environment, `bun` is not on PATH inside the sandbox shell, so commands were run via:

```sh
/Users/saefurrohman/.bun/bin/bun ...
```

## Work Completed

### 1. Prompter -> Anvil integration

The Prompter codebase was copied into:

```text
packages/opencode/src/anvil/prompter/
```

Key changes:
- Branding changed from `prompter` to `anvil`
- Prompter workspace directory is now `anvil/`
- Hidden prompts remain bundled in the binary
- Visible workflow files written by `anvil init` are only:
  - `proposal`
  - `apply`
  - `archive`

Relevant files:
- [packages/opencode/src/anvil/prompter/core/config.ts](/Users/saefurrohman/Programming/learn/ai/anvil-cli/packages/opencode/src/anvil/prompter/core/config.ts)
- [packages/opencode/src/anvil/prompter/commands/init.ts](/Users/saefurrohman/Programming/learn/ai/anvil-cli/packages/opencode/src/anvil/prompter/commands/init.ts)
- [packages/opencode/src/anvil/prompter/core/prompt-templates.ts](/Users/saefurrohman/Programming/learn/ai/anvil-cli/packages/opencode/src/anvil/prompter/core/prompt-templates.ts)

### 2. Top-level Anvil workspace commands

Added `anvil` workspace commands, all gated by Anvil account auth:

- `anvil init`
- `anvil list`
- `anvil show [item]`
- `anvil validate [item]`
- `anvil archive [change]`
- `anvil update`
- `anvil guide`

Implemented in:
- [packages/opencode/src/cli/cmd/workspace.ts](/Users/saefurrohman/Programming/learn/ai/anvil-cli/packages/opencode/src/cli/cmd/workspace.ts)
- registered from [packages/opencode/src/index.ts](/Users/saefurrohman/Programming/learn/ai/anvil-cli/packages/opencode/src/index.ts)

### 3. Prompter TypeScript compatibility fixes

The copied Prompter code initially failed under this repo’s stricter TS settings. Those issues were fixed:

- type-only imports added where required
- `override` added where needed
- spec metadata schema updated to accept Anvil format
- direct `commander` type dependency removed from legacy helper code

Key files touched:
- [packages/opencode/src/anvil/prompter/commands/spec.ts](/Users/saefurrohman/Programming/learn/ai/anvil-cli/packages/opencode/src/anvil/prompter/commands/spec.ts)
- [packages/opencode/src/anvil/prompter/commands/config.ts](/Users/saefurrohman/Programming/learn/ai/anvil-cli/packages/opencode/src/anvil/prompter/commands/config.ts)
- [packages/opencode/src/anvil/prompter/core/schemas/spec.schema.ts](/Users/saefurrohman/Programming/learn/ai/anvil-cli/packages/opencode/src/anvil/prompter/core/schemas/spec.schema.ts)
- [packages/opencode/src/anvil/prompter/core/validation/validator.ts](/Users/saefurrohman/Programming/learn/ai/anvil-cli/packages/opencode/src/anvil/prompter/core/validation/validator.ts)

Verification performed:
- `bun typecheck` in `packages/opencode` passed

### 4. Hidden template slash commands in the TUI

Hidden bundled prompts such as `/prd-generator`, `/fsd-generator`, etc. are exposed in the TUI through:

- [packages/opencode/src/anvil/tui-templates.ts](/Users/saefurrohman/Programming/learn/ai/anvil-cli/packages/opencode/src/anvil/tui-templates.ts)

Current behavior:

#### Selection from autocomplete

Selecting a template slash command now **inserts** it into the prompt instead of executing immediately.

Example:

```text
/prd-generator 
```

This behavior lives in:
- [packages/opencode/src/cli/cmd/tui/component/prompt/index.tsx](/Users/saefurrohman/Programming/learn/ai/anvil-cli/packages/opencode/src/cli/cmd/tui/component/prompt/index.tsx)

The old app-level direct execution path was removed from:
- [packages/opencode/src/cli/cmd/tui/app.tsx](/Users/saefurrohman/Programming/learn/ai/anvil-cli/packages/opencode/src/cli/cmd/tui/app.tsx)

#### Submit behavior

When the user presses Enter on:

```text
/prd-generator create prd for add new homepage landing page
```

Anvil sends:
- the hidden bundled template content
- plus appended user instruction under:

```text
# User Request
create prd for add new homepage landing page
```

So templates now behave like “insert first, customize, then send”.

### 5. Skill behavior in the TUI

There are now two skill entry paths in the TUI:

#### Direct slash autocomplete

Skills from the OpenCode skill service now appear in `/` autocomplete with a `:skill` suffix.

Example:

```text
/pdf:skill
/ui-ux-pro:skill
```

Selecting one inserts:

```text
/pdf 
```

Implemented in:
- [packages/opencode/src/cli/cmd/tui/component/prompt/autocomplete.tsx](/Users/saefurrohman/Programming/learn/ai/anvil-cli/packages/opencode/src/cli/cmd/tui/component/prompt/autocomplete.tsx)

#### `/skills` picker

`/skills` opens a skill picker dialog and selecting a skill inserts:

```text
/<skill-name> 
```

Fixes added:
- visible loading state
- visible empty state
- toast on load failure
- typing `/skills` and pressing Enter also opens the picker instead of sending `/skills` as a prompt

Implemented in:
- [packages/opencode/src/cli/cmd/tui/component/dialog-skill.tsx](/Users/saefurrohman/Programming/learn/ai/anvil-cli/packages/opencode/src/cli/cmd/tui/component/dialog-skill.tsx)
- [packages/opencode/src/cli/cmd/tui/component/prompt/index.tsx](/Users/saefurrohman/Programming/learn/ai/anvil-cli/packages/opencode/src/cli/cmd/tui/component/prompt/index.tsx)

### 6. Bundled proprietary Anvil skills

The OpenCode runtime skill loader was extended to include bundled Anvil skills in addition to external/project skills.

Current bundled registry:
- [packages/opencode/src/anvil/skills.ts](/Users/saefurrohman/Programming/learn/ai/anvil-cli/packages/opencode/src/anvil/skills.ts)

Current bundled skill source folder:
- [packages/opencode/src/anvil/skills/gamma-builder/SKILL.md](/Users/saefurrohman/Programming/learn/ai/anvil-cli/packages/opencode/src/anvil/skills/gamma-builder/SKILL.md)

Skill loader integration:
- [packages/opencode/src/skill/index.ts](/Users/saefurrohman/Programming/learn/ai/anvil-cli/packages/opencode/src/skill/index.ts)

Current behavior:
- bundled Anvil skills are merged into `state.skills`
- they appear in `/skills`
- they appear in slash autocomplete as `:skill`
- duplicate skill names log a warning; bundled Anvil skill currently wins because it is loaded last

### 7. Generated bundled skill registry

`skills.ts` is now generated instead of hand-maintained.

Generator script:
- [packages/opencode/script/generate-anvil-skills.ts](/Users/saefurrohman/Programming/learn/ai/anvil-cli/packages/opencode/script/generate-anvil-skills.ts)

Package script:
```sh
bun run generate:anvil-skills
```

Build integration:
- [packages/opencode/script/build.ts](/Users/saefurrohman/Programming/learn/ai/anvil-cli/packages/opencode/script/build.ts) now imports `generate-anvil-skills.ts`

Package.json script entry:
- [packages/opencode/package.json](/Users/saefurrohman/Programming/learn/ai/anvil-cli/packages/opencode/package.json)

Current add-skill workflow:

1. Add:
```text
packages/opencode/src/anvil/skills/<skill-name>/SKILL.md
```
2. Ensure frontmatter `name` matches folder name
3. Run:
```sh
bun run generate:anvil-skills
```
4. Commit both:
   - the source `SKILL.md`
   - generated `src/anvil/skills.ts`

The generator currently:
- scans `src/anvil/skills/*/SKILL.md`
- validates required `name` and `description`
- requires folder name == frontmatter `name`
- emits ASCII-safe escaped TS strings

### 8. Provider auth vs Anvil account auth command cleanup

There was a command conflict caused by the fork:

- upstream OpenCode used `auth` as an alias for provider credentials
- Anvil added `auth` for Anvil account auth

This was resolved by changing command names:

#### AI provider credentials

These now work:

```sh
anvil providers login
anvil provider login
anvil auth login
```

Also:

```sh
anvil providers list
anvil provider list
anvil auth list

anvil providers logout
anvil provider logout
anvil auth logout
```

Implemented in:
- [packages/opencode/src/cli/cmd/providers.ts](/Users/saefurrohman/Programming/learn/ai/anvil-cli/packages/opencode/src/cli/cmd/providers.ts)

Current aliases for providers:
- `auth`
- `provider`

#### Anvil account auth

Anvil account auth moved from `auth` to:

```sh
anvil account
```

Supported:

```sh
anvil account status
anvil account set-key <key>
anvil account clear
anvil login
anvil logout
```

Implemented in:
- [packages/opencode/src/cli/cmd/anvil-auth.ts](/Users/saefurrohman/Programming/learn/ai/anvil-cli/packages/opencode/src/cli/cmd/anvil-auth.ts)
- [packages/opencode/src/cli/cmd/login.ts](/Users/saefurrohman/Programming/learn/ai/anvil-cli/packages/opencode/src/cli/cmd/login.ts)

Guide updated:
- [guide.md](/Users/saefurrohman/Programming/learn/ai/anvil-cli/guide.md)

### 9. Current local skill sources visible to OpenCode

Before bundled Anvil skills, OpenCode runtime skills were being discovered from:

```text
/Users/saefurrohman/.agents/skills
```

Observed local skills there:
- `design-md`
- `enhance-prompt`
- `find-skills`
- `pdf`
- `ui-ux-pro`

These are separate from bundled Anvil proprietary skills.

## Command Semantics to Remember

### Anvil account auth
```sh
anvil login
anvil logout
anvil account status
```

### Provider credentials
```sh
anvil providers login
anvil provider login
anvil auth login
```

### Bundled templates
- selecting template slash command inserts it into prompt
- pressing Enter sends hidden template plus optional user request

### Skills
- direct `/` autocomplete shows skills as `:skill`
- `/skills` opens picker
- selecting skill inserts `/<skill-name> `

## Key Files

| File | Purpose |
|------|---------|
| `packages/opencode/src/index.ts` | CLI entry, command registration, cwd fix |
| `packages/opencode/src/cli/cmd/workspace.ts` | Top-level Anvil workspace commands |
| `packages/opencode/src/anvil/tui-templates.ts` | Hidden template command registry |
| `packages/opencode/src/cli/cmd/tui/component/prompt/index.tsx` | Template insertion, `/skills` behavior, prompt submit logic |
| `packages/opencode/src/cli/cmd/tui/component/prompt/autocomplete.tsx` | Slash autocomplete, direct skill entries |
| `packages/opencode/src/cli/cmd/tui/component/dialog-skill.tsx` | Skill picker dialog |
| `packages/opencode/src/skill/index.ts` | OpenCode skill loader plus bundled Anvil skill merge |
| `packages/opencode/src/anvil/skills.ts` | Generated bundled Anvil skill registry |
| `packages/opencode/src/anvil/skills/gamma-builder/SKILL.md` | Current proprietary source skill |
| `packages/opencode/script/generate-anvil-skills.ts` | Regenerates `src/anvil/skills.ts` |
| `packages/opencode/src/cli/cmd/providers.ts` | Provider credential command and aliases |
| `packages/opencode/src/cli/cmd/anvil-auth.ts` | Anvil account auth under `account` |
| `guide.md` | Current testing/usage guide |

## Verification Performed

Repeatedly verified during this thread:

- `bun typecheck` from `packages/opencode` passed after each major change
- `anvil providers --help` works
- `anvil provider --help` works
- `anvil auth --help` now routes to provider auth
- `anvil account --help` shows Anvil account auth

## Current Git State Caveat

There is a large existing dirty worktree with many staged and unstaged changes. Some of the newer fixes in this thread were not staged because `git add` needed elevated permission and that approval was declined earlier in the session.
