import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const rows = await prisma.$queryRawUnsafe<{ now: string }[]>("select now() as now")
    return NextResponse.json({ ok: true, db: rows?.[0]?.now ?? null })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
