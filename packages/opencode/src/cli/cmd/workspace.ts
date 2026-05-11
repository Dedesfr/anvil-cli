import type { Argv } from "yargs"
import { cmd } from "./cmd"
import { requireAnvilAuth } from "@/anvil/auth-guard"

import { InitCommand } from "@/anvil/prompter/commands/init"
import { ListCommand } from "@/anvil/prompter/commands/list"
import { ShowCommand } from "@/anvil/prompter/commands/show"
import { ValidateCommand } from "@/anvil/prompter/commands/validate"
import { ArchiveCommand } from "@/anvil/prompter/commands/archive"
import { UpdateCommand } from "@/anvil/prompter/commands/update"
import { GuideCommand } from "@/anvil/prompter/commands/guide"
import { AVAILABLE_PROMPTS } from "@/anvil/prompter/core/config"
import { PROMPT_TEMPLATES } from "@/anvil/prompter/core/prompt-templates"

export const WorkspaceInitCommand = cmd({
  command: "init",
  describe: "initialize Anvil workspace in your project",
  builder: (yargs: Argv) =>
    yargs
      .option("no-interactive", {
        type: "boolean",
        describe: "run without interactive prompts",
        default: false,
      }),
  async handler(args) {
    await requireAnvilAuth()
    const cmd = new InitCommand()
    await cmd.execute({
      noInteractive: args["no-interactive"] as boolean,
    })
  },
})

export const WorkspaceListCommand = cmd({
  command: "list",
  describe: "list changes and specs in the workspace",
  builder: (yargs: Argv) =>
    yargs
      .option("specs", {
        type: "boolean",
        describe: "list specs instead of changes",
        default: false,
      })
      .option("sort", {
        type: "string",
        choices: ["recent", "name"] as const,
        describe: "sort order",
        default: "recent",
      })
      .option("json", {
        type: "boolean",
        describe: "output as JSON",
        default: false,
      }),
  async handler(args) {
    await requireAnvilAuth()
    const cmd = new ListCommand()
    await cmd.execute(".", args.specs ? "specs" : "changes", {
      sort: args.sort as "recent" | "name",
      json: args.json,
    })
  },
})

export const WorkspaceShowCommand = cmd({
  command: "show [item]",
  describe: "show a change, spec, or hidden prompt template",
  builder: (yargs: Argv) =>
    yargs
      .positional("item", {
        type: "string",
        describe: "change name, spec name, or template name (e.g. prd-generator)",
      })
      .option("type", {
        type: "string",
        choices: ["change", "spec"] as const,
        describe: "force item type",
      })
      .option("json", {
        type: "boolean",
        describe: "output as JSON",
        default: false,
      })
      .option("deltas-only", {
        type: "boolean",
        describe: "show only spec deltas (for changes)",
        default: false,
      }),
  async handler(args) {
    await requireAnvilAuth()
    const item = args.item as string | undefined

    // Check if item is a hidden prompt template
    if (item) {
      const template = AVAILABLE_PROMPTS.find(p => p.value === item)
      if (template) {
        const content = PROMPT_TEMPLATES[item as keyof typeof PROMPT_TEMPLATES]
        if (content) {
          process.stdout.write(content)
          return
        }
      }
    }

    const cmd = new ShowCommand()
    await cmd.execute(item, {
      type: args.type,
      json: args.json,
      deltasOnly: args["deltas-only"],
    })
  },
})

export const WorkspaceValidateCommand = cmd({
  command: "validate [item]",
  describe: "validate changes and specs",
  builder: (yargs: Argv) =>
    yargs
      .positional("item", {
        type: "string",
        describe: "change or spec name to validate",
      })
      .option("all", {
        type: "boolean",
        describe: "validate all changes and specs",
        default: false,
      })
      .option("changes", {
        type: "boolean",
        describe: "validate all changes",
        default: false,
      })
      .option("specs", {
        type: "boolean",
        describe: "validate all specs",
        default: false,
      })
      .option("strict", {
        type: "boolean",
        describe: "enable strict validation",
        default: false,
      })
      .option("json", {
        type: "boolean",
        describe: "output as JSON",
        default: false,
      })
      .option("no-interactive", {
        type: "boolean",
        describe: "disable interactive mode",
        default: false,
      }),
  async handler(args) {
    await requireAnvilAuth()
    const cmd = new ValidateCommand()
    await cmd.execute(args.item as string | undefined, {
      all: args.all,
      changes: args.changes,
      specs: args.specs,
      strict: args.strict,
      json: args.json,
      noInteractive: args["no-interactive"] as boolean,
    })
  },
})

export const WorkspaceArchiveCommand = cmd({
  command: "archive [change]",
  describe: "archive a completed change and update specs",
  builder: (yargs: Argv) =>
    yargs
      .positional("change", {
        type: "string",
        describe: "change name to archive",
      })
      .option("yes", {
        alias: "y",
        type: "boolean",
        describe: "skip confirmation prompts",
        default: false,
      })
      .option("skip-specs", {
        type: "boolean",
        describe: "skip updating main specs",
        default: false,
      })
      .option("no-validate", {
        type: "boolean",
        describe: "skip validation before archiving",
        default: false,
      }),
  async handler(args) {
    await requireAnvilAuth()
    const cmd = new ArchiveCommand()
    await cmd.execute(args.change as string | undefined, {
      yes: args.yes,
      skipSpecs: args["skip-specs"] as boolean,
      noValidate: args["no-validate"] as boolean,
    })
  },
})

export const WorkspaceUpdateCommand = cmd({
  command: "update",
  describe: "update workflow files to the latest version",
  async handler() {
    await requireAnvilAuth()
    const cmd = new UpdateCommand()
    await cmd.execute()
  },
})

export const WorkspaceGuideCommand = cmd({
  command: "guide",
  describe: "show the Anvil workspace setup guide",
  async handler() {
    await requireAnvilAuth()
    const cmd = new GuideCommand()
    await cmd.execute()
  },
})
