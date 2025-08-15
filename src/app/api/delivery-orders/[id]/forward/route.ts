import { NextRequest } from 'next/server';
import { requireAuth, ok, fail, parseJson } from '@/app/api/_helpers/handler';
import { forward as forwardService } from '@/services/deliveryOrders';
import { DOStatus } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const { id } = await params;
  const { user, response } = await requireAuth();
  if (!user) return response!;

  const { body, response: parseErr } = await parseJson<{ toStatus: DOStatus }>(request);
  if (!body) return parseErr!;

  const updatedOrder = await forwardService(user, id, body.toStatus);
  return ok(updatedOrder);
  } catch (error) {
  console.error('Error forwarding delivery order:', error);
  return fail('Internal server error', 500);
  }
}