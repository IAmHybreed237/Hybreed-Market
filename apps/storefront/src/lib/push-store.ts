import fs from "fs"
import path from "path"

const FILE = path.join(process.cwd(), ".push-subs.json")

export function readSubs(): any[] {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"))
  } catch {
    return []
  }
}

export function addSub(sub: any) {
  const subs = readSubs()
  if (!subs.find((s) => s.endpoint === sub.endpoint)) {
    subs.push(sub)
    fs.writeFileSync(FILE, JSON.stringify(subs, null, 2))
  }
}
