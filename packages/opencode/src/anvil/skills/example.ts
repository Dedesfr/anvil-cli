// Copyright (c) 2025 Saefurrohman. All Rights Reserved.
// Licensed under the Anvil Proprietary License. See LICENSE-PROPRIETARY for details.

import { requireAnvilAuth } from "../auth-guard"
import { UI } from "../../cli/ui"

export async function runExampleSkill() {
  const { user } = await requireAnvilAuth()

  UI.println(
    UI.Style.TEXT_SUCCESS + "Running proprietary skill" + UI.Style.TEXT_NORMAL +
    UI.Style.TEXT_DIM + " (as " + user.email + ")" + UI.Style.TEXT_NORMAL,
  )

  // TODO: implement your proprietary skill logic here
}
