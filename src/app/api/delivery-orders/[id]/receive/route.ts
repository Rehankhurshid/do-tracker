import { NextRequest } from 'next/server';
import { requireAuth, ok, fail } from '@/app/api/_helpers/handler';
import { receiveAtProjectOffice } from '@/services/deliveryOrders';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user, response } = await requireAuth();
    if (!user) return response!;

    const updated = await receiveAtProjectOffice(user, id);
    return ok(updated);
  } catch (error) {
    console.error('Error receiving delivery order:', error);
    return fail('Internal server error', 500);
  }
}