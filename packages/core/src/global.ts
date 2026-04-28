import path from "path"
import fs from "fs/promises"
import { xdgData, xdgCache, xdgConfig, xdgState } from "xdg-basedir"
import os from "os"
import { Context, Effect, Layer } from "effect"
import { Flock } from "./util/flock"

const app = "anvil"
const legacyApp = "opencode"
const data = path.join(xdgData!, app)
const cache = path.join(xdgCache!, app)
const config = path.join(xdgConfig!, app)
const state = path.join(xdgState!, app)
const legacy = {
  data: path.join(xdgData!, legacyApp),
  cache: path.join(xdgCache!, legacyApp),
  config: path.join(xdgConfig!, legacyApp),
  state: path.join(xdgState!, legacyApp),
}

const paths = {
  get home() {
    return process.env.OPENCODE_TEST_HOME ?? os.homedir()
  },
  data,
  bin: path.join(cache, "bin"),
  log: path.join(data, "log"),
  cache,
  config,
  state,
}

export const Path = paths

Flock.setGlobal({ state })

async function exists(target: string) {
  return fs.access(target).then(
    () => true,
    () => false,
  )
}

async function migrateDirectory(from: string, to: string) {
  if (!(await exists(from)) || (await exists(to))) return
  await fs.mkdir(path.dirname(to), { recursive: true })
  await fs.rename(from, to)
}

const isUninstall = process.argv.includes("uninstall")

if (!isUninstall) {
  await Promise.all([
    migrateDirectory(legacy.data, data),
    migrateDirectory(legacy.cache, cache),
    migrateDirectory(legacy.config, config),
    migrateDirectory(legacy.state, state),
  ])
}

await Promise.all([
  fs.mkdir(Path.data, { recursive: true }),
  fs.mkdir(Path.config, { recursive: true }),
  fs.mkdir(Path.state, { recursive: true }),
  fs.mkdir(Path.log, { recursive: true }),
  fs.mkdir(Path.bin, { recursive: true }),
])

export class Service extends Context.Service<Service, Interface>()("@opencode/Global") {}

export interface Interface {
  readonly home: string
  readonly data: string
  readonly cache: string
  readonly config: string
  readonly state: string
  readonly bin: string
  readonly log: string
}

export const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    return Service.of({
      home: Path.home,
      data: Path.data,
      cache: Path.cache,
      config: Path.config,
      state: Path.state,
      bin: Path.bin,
      log: Path.log,
    })
  }),
)

export * as Global from "./global"
