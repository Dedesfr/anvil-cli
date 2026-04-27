# Anvil CLI — Testing Guide

## Prerequisites

- Anvil web app running locally (`http://localhost:3000` or `3001`)
- An Anvil account with the **coder plan**
- An API key from Settings → Anvil CLI → Create key

---

## Step 1: Link the CLI locally

```sh
cd /Users/saefurrohman/Programming/learn/ai/anvil-cli/packages/opencode
bun link
```

Then verify it's available:

```sh
which anvil
anvil --version
```

---

## Step 2: Authenticate

```sh
anvil login
```

- Paste your API key when prompted (starts with `anvil_sk_`)
- You should see: `Logged in as <your email>`

To verify auth is working:

```sh
anvil account status
```

---

## Step 3: Initialize a workspace

Navigate to any test project directory (or create one):

```sh
mkdir ~/Desktop/test-project && cd ~/Desktop/test-project
git init
```

Run init:

```sh
anvil init
```

- Select one or more AI tools (e.g. **Claude Code**, **OpenCode**)
- Check that the following are created:
  - `prompter/project.md`
  - `prompter/AGENTS.md`
  - `prompter/CLAUDE.md`
  - `CLAUDE.md` (in root)
  - `AGENTS.md` (in root)
  - `.claude/commands/prompter/proposal.md` (if Claude selected)
  - `.claude/commands/prompter/apply.md`
  - `.claude/commands/prompter/archive.md`

**Verify hidden templates are NOT on disk:**

```sh
ls prompter/core/
# Should be empty or not exist — no prd-generator.md etc.
```

---

## Step 4: Test the guide

```sh
anvil guide
```

Should print the document workflow table and Prompter Solo Dev workflow.

---

## Step 5: Test hidden template access

```sh
anvil show prd-generator
```

Should print the PRD Generator template content to stdout (not write it to disk).

Try a few more:

```sh
anvil show fsd-generator
anvil show epic-single
anvil show tdd-generator
```

**Pipe to a file if you want to use it:**

```sh
anvil show prd-generator > my-prd-prompt.md
```

---

## Step 6: Create a test change proposal

Inside `~/Desktop/test-project`, create a change manually:

```sh
mkdir -p prompter/changes/my-first-feature/specs/user-auth
cat > prompter/changes/my-first-feature/proposal.md << 'EOF'
# My First Feature

## Summary
Add user authentication.

## Tasks
- [ ] Design login flow
- [x] Define requirements
EOF

cat > prompter/changes/my-first-feature/specs/user-auth/spec.md << 'EOF'
## ADDED Requirements

### Requirement: User can log in
#### Scenario: Valid credentials
Given a registered user
When they submit valid credentials
Then they are authenticated and redirected to the dashboard
EOF
```

---

## Step 7: Test list

```sh
anvil list
```

Should show `my-first-feature` with task progress (1/2 complete).

```sh
anvil list --specs
```

Should show no specs yet (specs in `prompter/specs/` — the main ones, not the change delta specs).

---

## Step 8: Test validate

```sh
anvil validate my-first-feature
```

Should validate the delta spec and report pass/fail.

```sh
anvil validate --all
```

Validates everything.

---

## Step 9: Test archive

```sh
anvil archive my-first-feature
```

- Confirms task status (1 incomplete task — it will warn)
- Press `y` to continue
- Confirms spec updates
- Moves change to `prompter/changes/archive/YYYY-MM-DD-my-first-feature/`

Or skip confirmations:

```sh
anvil archive my-first-feature --yes
```

---

## Step 10: Test update

After init, if workflow files need refreshing:

```sh
anvil update
```

Should update `.claude/commands/prompter/*.md` files to latest content.

---

## Step 11: Test auth guard

Log out and verify commands are blocked:

```sh
anvil logout
anvil init
# Should print: "This feature requires an Anvil account. Run: anvil login"

anvil list
# Same error

anvil show prd-generator
# Same error
```

Log back in:

```sh
anvil login
```

---

## Step 12: Re-init (add/remove tools)

```sh
cd ~/Desktop/test-project
anvil init
```

- Uncheck Claude, check OpenCode
- Verify Claude files are removed and OpenCode files are created

---

## Quick reference

| Command | What to check |
|---|---|
| `anvil login` | Prompts for key, confirms email |
| `anvil account status` | Shows current user |
| `anvil logout` | Clears saved key |
| `anvil init` | Creates `prompter/` + tool workflow files |
| `anvil list` | Shows active changes with progress |
| `anvil list --specs` | Shows specs |
| `anvil show <name>` | Prints hidden template to stdout |
| `anvil validate <id>` | Validates change or spec |
| `anvil archive <id>` | Archives change, merges specs |
| `anvil update` | Refreshes workflow files |
| `anvil guide` | Shows document workflow table |
