import { NextResponse } from "next/server"
import { retrieveCustomer, updateCustomer } from "@/lib/data/customer"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Must stay in sync with TASKS in MyHybreedClient.tsx (client hides id 11,
// which auto-completes from profile data and is never claimable here).
const TASK_DEFS: Record<number, number> = {
  1: 50,
  2: 40,
  3: 25,
  4: 25,
  5: 15,
  6: 15,
  7: 10,
  8: 30,
  9: 20,
  10: 10,
}

type Loyalty = {
  xp: number
  points: number
  streakDay: number
  lastClaim: string
  claimedTasks?: number[]
}

const readLoyalty = (user: any): Loyalty => ({
  xp: 0,
  points: 0,
  streakDay: 0,
  lastClaim: "",
  claimedTasks: [],
  ...((user?.metadata?.loyalty as Partial<Loyalty>) || {}),
})

const stateOf = (l: Loyalty) => {
  const today = new Date().toISOString().slice(0, 10)
  const yest = new Date(Date.now() - 86400e3).toISOString().slice(0, 10)
  const claimedToday = l.lastClaim === today
  const streakDone = claimedToday
    ? l.streakDay
    : l.lastClaim === yest
      ? l.streakDay
      : 0
  return {
    xp: l.xp,
    points: l.points,
    streakDone,
    claimedToday,
    claimedTasks: l.claimedTasks ?? [],
  }
}

export async function POST(req: Request) {
  const user = await retrieveCustomer()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = (await req.json().catch(() => ({}))) as { id?: number }
  const xp = id != null ? TASK_DEFS[id] : undefined
  if (xp == null) {
    return NextResponse.json({ error: "Unknown task" }, { status: 400 })
  }

  const l = readLoyalty(user)
  const claimed = l.claimedTasks ?? []
  if (claimed.includes(id!)) return NextResponse.json(stateOf(l))

  const next: Loyalty = {
    ...l,
    claimedTasks: [...claimed, id!],
    xp: l.xp + xp,
    points: l.points + xp,
  }

  try {
    await updateCustomer({
      metadata: { ...(user.metadata || {}), loyalty: next },
    } as never)
    return NextResponse.json(stateOf(next))
  } catch {
    return NextResponse.json({ error: "Could not claim task" }, { status: 500 })
  }
}
