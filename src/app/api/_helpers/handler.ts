import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { UserRole } from '@/types'

export interface AuthUser { userId: string; username: string; role: UserRole }

export async function requireAuth(): Promise<{ user?: AuthUser; response?: NextResponse }>{
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const payload = verifyToken(token)
  if (!payload) return { response: NextResponse.json({ error: 'Invalid token' }, { status: 401 }) }
  return { user: payload as AuthUser }
}

export async function parseJson<T>(request: Request): Promise<{ body?: T; response?: NextResponse }>{
  try {
    const body = await request.json()
    return { body }
  } catch {
    return { response: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }
  }
}

export function ok<T>(data: T, status = 200) { return NextResponse.json(data as unknown as Record<string, unknown>, { status }) }
export function fail(message = 'Internal server error', status = 500, details?: unknown) { return NextResponse.json({ error: message, details } as Record<string, unknown>, { status }) }
