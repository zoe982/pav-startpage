import type { Env } from '../../types.ts';

function getSessionId(request: Request): string | null {
  const cookie = request.headers.get('Cookie');
  if (!cookie) return null;
  const match = /__session=([^;]+)/.exec(cookie);
  return match?.[1] ?? null;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const sessionId = getSessionId(request);

  if (sessionId) {
    await env.DB.prepare('DELETE FROM sessions WHERE id = ?')
      .bind(sessionId)
      .run();
  }

  return new Response(null, {
    status: 204,
    headers: {
      'Set-Cookie': '__session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0',
    },
  });
};
