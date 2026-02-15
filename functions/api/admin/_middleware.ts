import type { Env, AuthenticatedData } from '../../types.ts';

export const onRequest: PagesFunction<Env, string, AuthenticatedData> = async (context) => {
  const { user } = context.data;

  if (!user.isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  return context.next();
};
