import { NextRequest } from 'next/server';
import { requireAuth, ok, fail, parseJson } from '@/app/api/_helpers/handler';
import * as Issues from '@/services/issues';

export async function GET(request: NextRequest) {
  try {
  const { user, response } = await requireAuth();
  if (!user) return response!;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const deliveryOrderId = searchParams.get('deliveryOrderId');
    const status = searchParams.get('status');

  const issues = await Issues.listForUser(user, { deliveryOrderId, status });
  return ok(issues);
  } catch (error) {
    console.error('Error fetching issues:', error);
  return fail('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requireAuth();
    if (!user) return response!;

    const { body, response: parseErr } = await parseJson<{ deliveryOrderId: string; issueType?: string; description: string }>(request);
    if (!body) return parseErr!;
    const { deliveryOrderId, issueType, description } = body;

    if (!deliveryOrderId || !description) {
      return fail('Missing required fields: deliveryOrderId and description are required', 400);
    }

    const issue = await Issues.createIssue(user, { deliveryOrderId, issueType, description });
    return ok(issue, 201);
  } catch (error: unknown) {
    console.error('Error creating issue:', error);
    const message = error instanceof Error ? error.message : String(error);
    return fail('Internal server error', 500, process.env.NODE_ENV === 'development' ? message : undefined);
  }
}