// Copyright (c) 2025 Saefurrohman. All Rights Reserved.
// Licensed under the Anvil Proprietary License. See LICENSE-PROPRIETARY for details.

import { validate, getConfig, type AnvilUser } from "./auth"
import { UI } from "../cli/ui"

export interface AuthContext {
  user: AnvilUser
  plan: string
}

export async function requireAnvilAuth(): Promise<AuthContext> {
  const config = await getConfig()

  if (!config) {
    UI.error(
      "This feature requires an Anvil account.\n" +
      "  Run: anvil login",
    )
    process.exit(1)
  }

  const result = await validate()

  if (!result) {
    UI.error(
      "Authentication failed. Your API key may be invalid or expired.\n" +
      "  Run: anvil login",
    )
    process.exit(1)
  }

  return { user: result.user, plan: result.user.plan }
}
