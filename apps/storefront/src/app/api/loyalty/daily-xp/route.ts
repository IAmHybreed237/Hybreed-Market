import { NextResponse } from "next/server"
import { retrieveCustomer, updateCustomer } from "@/lib/data/customer"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const STREAK_DAYS = [5, 8, 10, 15, 20, 25, 50]

const todayStr = () => new Date().toISOString().slice(0, 10)
const yestStr = () =>
  new Date(Date.now() - 86400e3).toISOString().slice(0, 10)

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
  ...((user?.metadata?.loyalty as Partial<Loyalty>) || {}),
})

const stateOf = (l: Loyalty) => {
  const today = todayStr()
  const yest = yestStr()
  const claimedToday = l.lastClaim === today
  // days already claimed in the current streak (includes today if claimed)
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

export async function GET() {
  const user = await retrieveCustomer()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json(stateOf(readLoyalty(user)))
}

export async function POST() {
  const user = await retrieveCustomer()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const l = readLoyalty(user)
  const s = stateOf(l)
  if (s.claimedToday) return NextResponse.json(s)

  const streakDay = s.streakDone + 1 > STREAK_DAYS.length ? 1 : s.streakDone + 1
  const earned = STREAK_DAYS[streakDay - 1]
  const next: Loyalty = {
    ...l,
    streakDay,
    lastClaim: todayStr(),
    xp: l.xp + earned,
    points: l.points + earned,
  }

  try {
    await updateCustomer({
      metadata: { ...(user.metadata || {}), loyalty: next },
    } as never)
    return NextResponse.json(stateOf(next))
  } catch {
    return NextResponse.json(
      { error: "Could not save daily XP" },
      { status: 500 }
    )
  }
}
