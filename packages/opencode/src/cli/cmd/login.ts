// Copyright (c) 2025 Saefurrohman. All Rights Reserved.
// Licensed under the Anvil Proprietary License. See LICENSE-PROPRIETARY for details.

import { intro, outro, password, spinner, isCancel } from "@clack/prompts"
import { cmd } from "./cmd"
import { UI } from "../ui"
import { setKey, validate, clearKey, ANVIL_BASE_URL } from "../../anvil/auth"

export const LoginCommand = cmd({
  command: "login",
  describe: "authenticate with your Anvil account",
  builder: (yargs) => yargs,
  async handler() {
    UI.empty()
    intro("Anvil Login")

    UI.println(UI.Style.TEXT_DIM + "Using server: " + ANVIL_BASE_URL + UI.Style.TEXT_NORMAL)

    const key = await password({
      message: "Paste your API key (from your Anvil dashboard):",
      mask: "*",
    })

    if (isCancel(key) || !key) {
      UI.println(UI.Style.TEXT_DIM + "Cancelled." + UI.Style.TEXT_NORMAL)
      return
    }

    const keyStr = String(key).trim()
    if (!keyStr.startsWith("anvil_sk_")) {
      UI.error("Invalid API key. Key must start with anvil_sk_")
      process.exitCode = 1
      return
    }

    await setKey(keyStr)

    const s = spinner()
    s.start("Verifying...")

    const result = await validate()

    if (!result) {
      s.stop("Verification failed", 1)
      await clearKey()
      UI.error("Could not verify API key. Check the key and try again.")
      process.exitCode = 1
      return
    }

    s.stop("Verified")
    outro(
      "Logged in as " +
      UI.Style.TEXT_HIGHLIGHT_BOLD + result.user.email + UI.Style.TEXT_NORMAL +
      UI.Style.TEXT_DIM + " (" + result.user.plan + " plan)" + UI.Style.TEXT_NORMAL,
    )
  },
})

export const LogoutCommand = cmd({
  command: "logout",
  describe: "remove your saved Anvil API key",
  builder: (yargs) => yargs,
  async handler() {
    UI.empty()
    await clearKey()
    outro("Logged out.")
  },
})
