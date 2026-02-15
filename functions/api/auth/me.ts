import type { Env, AuthenticatedData } from '../../types.ts';

export const onRequestGet: PagesFunction<Env, string, AuthenticatedData> = (context) => {
  const { user } = context.data;
  return Response.json(user);
};
