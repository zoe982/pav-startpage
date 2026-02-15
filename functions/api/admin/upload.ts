import type { Env } from '../../types.ts';

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]);

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

interface UploadedFile {
  readonly name: string;
  readonly type: string;
  readonly size: number;
  stream(): ReadableStream;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const contentType = request.headers.get('Content-Type') ?? '';
  if (!contentType.includes('multipart/form-data')) {
    return Response.json(
      { error: 'Expected multipart/form-data' },
      { status: 400 },
    );
  }

  const formData = await request.formData();
  const raw = formData.get('file');

  if (!raw || typeof raw === 'string') {
    return Response.json({ error: 'No file provided' }, { status: 400 });
  }

  const file = raw as unknown as UploadedFile;

  if (!ALLOWED_TYPES.has(file.type)) {
    return Response.json(
      { error: 'File type not allowed. Use JPEG, PNG, GIF, WebP, or SVG.' },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE) {
    return Response.json(
      { error: 'File too large. Max 5 MB.' },
      { status: 400 },
    );
  }

  const ext = file.name.split('.').pop() ?? 'bin';
  const key = `uploads/${crypto.randomUUID()}.${ext}`;

  await env.ASSETS_BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  return Response.json({ url: `/assets/${key}` }, { status: 201 });
};
