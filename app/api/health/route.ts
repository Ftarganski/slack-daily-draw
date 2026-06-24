export const runtime = 'edge';

export function GET(): Response {
  return Response.json({ status: 'ok', ts: Date.now() });
}
