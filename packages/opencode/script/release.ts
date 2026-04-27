#!/usr/bin/env bun
// Copyright (c) 2025 Saefurrohman. All Rights Reserved.
// Licensed under the Anvil Proprietary License. See LICENSE-PROPRIETARY for details.
//
// Builds all platform binaries and publishes a GitHub release.
//
// Usage:
//   ANVIL_VERSION=1.0.0 bun run release
//
// Prerequisites:
//   - gh CLI installed and authenticated (gh auth login)
//   - All changes committed and pushed

import { $ } from "bun"
import path from "path"

const REPO = "Dedesfr/anvil-cli"
const dir = path.resolve(import.meta.dirname, "..")
process.chdir(dir)

const version = process.env.ANVIL_VERSION
if (!version) {
  console.error("Error: ANVIL_VERSION is required. Example: ANVIL_VERSION=1.0.0 bun run release")
  process.exit(1)
}

const tag = `v${version}`

console.log(`Releasing Anvil ${tag} → github.com/${REPO}`)

// Build all platform binaries
console.log("\nBuilding all platform binaries...")
await $`bun run script/build.ts --skip-embed-web-ui --skip-smoke-test`.env({
  ...process.env,
  OPENCODE_VERSION: version,
  OPENCODE_CHANNEL: "latest",
})

// Package archives
console.log("\nPackaging archives...")
const fs = await import("fs/promises")
const distEntries = await fs.readdir(path.join(dir, "dist"))
const binaryDirs = distEntries.filter((e) => e.startsWith("anvil-"))

for (const name of binaryDirs) {
  const binDir = path.join(dir, "dist", name, "bin")
  if (name.includes("linux")) {
    await $`tar -czf ../../${name}.tar.gz *`.cwd(binDir)
    console.log(`  packaged ${name}.tar.gz`)
  } else {
    await $`zip -r ../../${name}.zip *`.cwd(binDir)
    console.log(`  packaged ${name}.zip`)
  }
}

// Create GitHub release
console.log(`\nCreating GitHub release ${tag}...`)
await $`gh release create ${tag} \
  --repo ${REPO} \
  --title "Anvil ${tag}" \
  --notes "Release ${tag}" \
  --latest`

// Upload binaries
console.log("\nUploading binaries...")
await $`gh release upload ${tag} dist/*.zip dist/*.tar.gz --clobber --repo ${REPO}`

console.log(`\nDone! https://github.com/${REPO}/releases/tag/${tag}`)
