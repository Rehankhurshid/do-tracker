import { NextRequest } from 'next/server';
import { requireAuth, ok, fail, parseJson } from '@/app/api/_helpers/handler';
import { forwardToRoadSale } from '@/services/deliveryOrders';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user, response } = await requireAuth();
    if (!user) return response!;

    const { body, response: parseErr } = await parseJson<{ notes?: string | null }>(request);
    if (!body) return parseErr!;

    const updated = await forwardToRoadSale(user, id, body.notes);
    return ok({ message: 'Delivery order forwarded to Road Sale successfully', deliveryOrder: updated });
  } catch (error) {
    console.error('Error forwarding to Road Sale:', error);
    return fail('Failed to forward to Road Sale', 500);
  }
}