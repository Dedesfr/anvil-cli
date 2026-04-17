// Copyright (c) 2025 Saefurrohman. All Rights Reserved.
// Licensed under the Anvil Proprietary License. See LICENSE-PROPRIETARY for details.

import { cmd } from "./cmd"
import { UI } from "../ui"
import { setKey, clearKey, validate, getConfig, ANVIL_BASE_URL } from "../../anvil/auth"

const SetKeyCommand = cmd({
  command: "set-key <key>",
  describe: "save your Anvil API key",
  builder: (yargs) =>
    yargs
      .positional("key", {
        type: "string",
        describe: "Anvil API key (anvil_sk_...)",
        demandOption: true,
      }),
  async handler(args) {
    const key = String(args.key).trim()

    if (!key.startsWith("anvil_sk_")) {
      UI.error("Invalid API key format. Key must start with anvil_sk_")
      process.exitCode = 1
      return
    }

    UI.empty()
    UI.println(UI.Style.TEXT_DIM + "Validating key against " + ANVIL_BASE_URL + "..." + UI.Style.TEXT_NORMAL)

    await setKey(key)

    const result = await validate()
    if (!result) {
      UI.error("Could not validate API key. Check the key and URL and try again.")
      process.exitCode = 1
      return
    }

    UI.println(
      UI.Style.TEXT_SUCCESS + "✓" + UI.Style.TEXT_NORMAL +
      " Authenticated as " +
      UI.Style.TEXT_HIGHLIGHT_BOLD + result.user.email + UI.Style.TEXT_NORMAL +
      UI.Style.TEXT_DIM + " (" + result.user.plan + " plan)" + UI.Style.TEXT_NORMAL,
    )
  },
})

const StatusCommand = cmd({
  command: "status",
  describe: "show current authentication status",
  builder: (yargs) => yargs,
  async handler() {
    UI.empty()
    const config = await getConfig()

    if (!config) {
      UI.println(UI.Style.TEXT_DIM + "Not authenticated. Run: anvil login" + UI.Style.TEXT_NORMAL)
      return
    }

    UI.println(UI.Style.TEXT_DIM + "Checking " + ANVIL_BASE_URL + "..." + UI.Style.TEXT_NORMAL)
    const result = await validate()

    if (!result) {
      UI.println(UI.Style.TEXT_DANGER + "✗ API key invalid or expired. Run: anvil login" + UI.Style.TEXT_NORMAL)
      return
    }

    UI.println(UI.Style.TEXT_SUCCESS + "✓ Authenticated" + UI.Style.TEXT_NORMAL)
    UI.println("  Email:   " + result.user.email)
    UI.println("  Name:    " + result.user.displayName)
    UI.println("  Plan:    " + result.user.plan)
    UI.println("  Server:  " + ANVIL_BASE_URL)
  },
})

const ClearCommand = cmd({
  command: "clear",
  describe: "remove saved API key",
  builder: (yargs) => yargs,
  async handler() {
    UI.empty()
    await clearKey()
    UI.println(UI.Style.TEXT_DIM + "API key removed." + UI.Style.TEXT_NORMAL)
  },
})

export const AnvilAuthCommand = cmd({
  command: "auth",
  describe: "manage Anvil authentication",
  builder: (yargs) =>
    yargs
      .command(SetKeyCommand)
      .command(StatusCommand)
      .command(ClearCommand)
      .demandCommand(),
  async handler() {},
})
