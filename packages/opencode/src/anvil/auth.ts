// Copyright (c) 2025 Saefurrohman. All Rights Reserved.
// Licensed under the Anvil Proprietary License. See LICENSE-PROPRIETARY for details.

import fs from "fs/promises"
import path from "path"
import { Global } from "../global"

const AUTH_FILE = path.join(Global.Path.config, "anvil-auth.json")

export const ANVIL_BASE_URL = (process.env.ANVIL_API_URL ?? "http://localhost:3000").replace(/\/$/, "")

export interface AnvilAuthConfig {
  apiKey: string
}

export interface AnvilUser {
  email: string
  displayName: string
  plan: string
}

export interface ValidateResult {
  valid: true
  user: AnvilUser
}

async function readConfig(): Promise<AnvilAuthConfig | null> {
  try {
    const raw = await fs.readFile(AUTH_FILE, "utf-8")
    return JSON.parse(raw) as AnvilAuthConfig
  } catch {
    return null
  }
}

async function writeConfig(config: AnvilAuthConfig): Promise<void> {
  await fs.mkdir(path.dirname(AUTH_FILE), { recursive: true })
  await fs.writeFile(AUTH_FILE, JSON.stringify(config, null, 2), "utf-8")
}

export async function setKey(apiKey: string): Promise<void> {
  await writeConfig({ apiKey })
}

export async function getConfig(): Promise<AnvilAuthConfig | null> {
  return readConfig()
}

export async function clearKey(): Promise<void> {
  try {
    await fs.unlink(AUTH_FILE)
  } catch {}
}

export async function validate(): Promise<ValidateResult | null> {
  const config = await readConfig()
  if (!config) return null

  try {
    const res = await fetch(`${ANVIL_BASE_URL}/api/anvil/validate`, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
    })
    if (!res.ok) return null
    return (await res.json()) as ValidateResult
  } catch {
    return null
  }
}
