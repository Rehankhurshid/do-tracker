import { NextRequest } from 'next/server';
import { requireAuth, ok, fail } from '@/app/api/_helpers/handler';
import { deleteDO } from '@/services/deliveryOrders';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user, response } = await requireAuth();
    if (!user) return response!;

    const result = await deleteDO(user, id);
    return ok({ message: 'Delivery order deleted successfully', deletedOrder: result });
  } catch (error) {
    console.error('Error deleting delivery order:', error);
    return fail('Failed to delete delivery order', 500);
  }
}