import type { Env, AuthenticatedData } from '../../types.ts';
import { assertAppAccess } from '../../types.ts';

type OutputStyle = 'email' | 'whatsapp' | 'document' | 'instagram' | 'facebook' | 'other';
type Mode = 'rewrite' | 'draft';
type MessageRole = 'user' | 'assistant';

const VALID_STYLES: ReadonlySet<string> = new Set(['email', 'whatsapp', 'document', 'instagram', 'facebook', 'other']);
const VALID_MODES: ReadonlySet<string> = new Set(['rewrite', 'draft']);

const MAX_TEXT_LENGTH = 10000;
const MAX_CUSTOM_STYLE_LENGTH = 500;
const MAX_TITLE_LENGTH = 180;

const STYLE_INSTRUCTIONS: Record<OutputStyle, string> = {
  email: 'Format the output for a professional email. Use appropriate greeting and sign-off structure. Keep paragraphs short and scannable.',
  whatsapp: 'Format the output for a WhatsApp message. Keep it concise and conversational. Use short paragraphs. No formal greetings or sign-offs.',
  document: 'Format the output for a formal document. Use complete sentences, proper paragraph structure, and a professional tone throughout.',
  instagram: `Format the output as an Instagram post with two clearly labeled sections:

**IMAGE TEXT:** Short, bold text for the image itself (1-2 lines max, punchy and attention-grabbing, suitable for overlay on a photo). Use sentence case.

**CAPTION:** An engaging Instagram caption. Lead with a strong hook in the first line (only ~125 characters show before "More"). Keep the full caption under 2,200 characters. Use line breaks for readability. Add 3-5 relevant hashtags at the end. Keep the tone warm, approachable, and on-brand. Include a clear call to action.`,
  facebook: 'Format the output as a Facebook post. Lead with a compelling hook in the first 1-2 lines (only ~125 characters show before "See More"). Keep the total post concise — ideally 40-80 words for maximum engagement. Use short paragraphs with line breaks for scannability. Include a clear call to action. Use 1-3 relevant hashtags at most — do not over-tag. Keep the tone warm, professional, and conversational.',
  other: 'Format the output as general-purpose text. Keep it clear and well-structured.',
};

interface RewriteBody {
  action?: string;
  threadId?: string;
  text?: string;
  message?: string;
  mode?: string;
  style?: string;
  customStyleDescription?: string;
  title?: string;
}

interface BrandSettingsRow {
  rules_markdown: string;
  services_markdown: string;
}

interface ThreadRow {
  id: string;
  title: string;
  mode: Mode;
  style: OutputStyle;
  custom_style_description: string | null;
  latest_draft: string;
  pinned_draft: string | null;
}

interface MessageRow {
  id: string;
  role: MessageRole;
  content: string;
  draft_text: string | null;
}

interface OpenAIChoice {
  message: {
    content: string;
  };
}

interface OpenAIResponse {
  choices: OpenAIChoice[];
}

interface DraftGeneration {
  assistantMessage: string;
  draft: string;
  threadTitle: string | null;
}

function normalizeSingleLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function sanitizeTitle(rawTitle: string): string {
  const cleaned = normalizeSingleLine(rawTitle);
  return cleaned.slice(0, MAX_TITLE_LENGTH);
}

function formatThreadTitle(baseTitle: string | null, userName: string): string {
  const fallbackTitle = 'Brand Voice Thread';
  const safeBase = sanitizeTitle(baseTitle ?? '') || fallbackTitle;
  const safeUser = sanitizeTitle(userName) || 'User';
  return sanitizeTitle(`${safeBase} (${safeUser})`);
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (parsed !== null && typeof parsed === 'object') {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Continue into fenced-json fallback.
  }

  const fencedPattern = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const fencedMatch = fencedPattern.exec(trimmed);
  if (!fencedMatch) return null;

  const rawFencedJson = String(fencedMatch.at(1));

  try {
    const parsed = JSON.parse(rawFencedJson) as unknown;
    if (parsed !== null && typeof parsed === 'object') {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }

  return null;
}

function parseAiDraft(content: string): DraftGeneration {
  const parsed = extractJsonObject(content);
  if (!parsed) {
    return {
      assistantMessage: 'I updated the draft based on your latest request.',
      draft: content.trim(),
      threadTitle: null,
    };
  }

  const assistantMessageRaw = parsed['assistantMessage'];
  const draftRaw = parsed['draft'];
  const threadTitleRaw = parsed['threadTitle'];

  const assistantMessage = typeof assistantMessageRaw === 'string'
    ? assistantMessageRaw.trim()
    : '';
  const draft = typeof draftRaw === 'string'
    ? draftRaw.trim()
    : '';
  const threadTitle = typeof threadTitleRaw === 'string'
    ? threadTitleRaw.trim()
    : null;

  return {
    assistantMessage: assistantMessage || 'I updated the draft based on your latest request.',
    draft: draft || content.trim(),
    threadTitle,
  };
}

function buildStyleInstruction(style: OutputStyle, customStyleDescription: string | null): string {
  if (style === 'other' && customStyleDescription) {
    return `Format the output according to these instructions: ${customStyleDescription}`;
  }

  switch (style) {
    case 'email':
      return STYLE_INSTRUCTIONS.email;
    case 'whatsapp':
      return STYLE_INSTRUCTIONS.whatsapp;
    case 'document':
      return STYLE_INSTRUCTIONS.document;
    case 'instagram':
      return STYLE_INSTRUCTIONS.instagram;
    case 'facebook':
      return STYLE_INSTRUCTIONS.facebook;
    case 'other':
    default:
      return STYLE_INSTRUCTIONS.other;
  }
}

function buildSystemPrompt(
  mode: Mode,
  styleInstruction: string,
  rules: string,
  services: string,
  includeThreadTitle: boolean,
): string {
  const modeInstruction = mode === 'draft'
    ? 'The user is asking for new content. Draft from scratch.'
    : 'The user is refining or rewriting copy. Keep the intent while improving quality.';

  const serviceBlock = services.trim()
    ? `\n\nService Offerings (factual reference):\n${services}`
    : '';

  const threadTitleRequirement = includeThreadTitle
    ? 'Also include a concise `threadTitle` (3-7 words) describing the workstream, without the user name.'
    : 'Set `threadTitle` to null.';

  return `You are a brand voice colleague for Pet Air Valet. Follow the brand voice rules and service references as hard constraints on every turn.

${modeInstruction}
${styleInstruction}

Return valid JSON only with this shape:
{
  "assistantMessage": "A short acknowledgement of the latest user intent and what you changed",
  "draft": "The full updated draft content only",
  "threadTitle": "Optional title for first turn"
}

${threadTitleRequirement}
Do not include markdown code fences.\n\nBrand Voice Guidelines:\n${rules}${serviceBlock}`;
}

async function fetchBrandSettings(env: Env): Promise<BrandSettingsRow> {
  const row = await env.DB.prepare(
    'SELECT rules_markdown, services_markdown FROM brand_settings WHERE id = 1',
  ).first<BrandSettingsRow>();

  return {
    rules_markdown: row?.rules_markdown ?? '',
    services_markdown: row?.services_markdown ?? '',
  };
}

async function fetchThreadById(env: Env, threadId: string): Promise<ThreadRow | null> {
  return await env.DB.prepare(
    `SELECT id, title, mode, style, custom_style_description, latest_draft, pinned_draft
     FROM brand_voice_threads
     WHERE id = ?`,
  )
    .bind(threadId)
    .first<ThreadRow>();
}

async function fetchMessagesForThread(env: Env, threadId: string): Promise<MessageRow[]> {
  const { results } = await env.DB.prepare(
    `SELECT id, role, content, draft_text
     FROM brand_voice_messages
     WHERE thread_id = ?
     ORDER BY created_at ASC`,
  )
    .bind(threadId)
    .all<MessageRow>();

  return results;
}

function toThreadResponse(thread: ThreadRow, messages: MessageRow[]): {
  id: string;
  title: string;
  mode: Mode;
  style: OutputStyle;
  customStyleDescription: string | null;
  latestDraft: string;
  pinnedDraft: string | null;
  messages: { id: string; role: MessageRole; content: string }[];
} {
  return {
    id: thread.id,
    title: thread.title,
    mode: thread.mode,
    style: thread.style,
    customStyleDescription: thread.custom_style_description,
    latestDraft: thread.latest_draft,
    pinnedDraft: thread.pinned_draft,
    messages: messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
    })),
  };
}

function parseMode(value: string | undefined, fallback: Mode): Mode {
  if (value && VALID_MODES.has(value)) {
    return value as Mode;
  }
  return fallback;
}

function parseStyle(value: string | undefined, fallback: OutputStyle): OutputStyle {
  if (value && VALID_STYLES.has(value)) {
    return value as OutputStyle;
  }
  return fallback;
}

function validateCustomStyle(customStyleDescription: unknown): string | null {
  if (typeof customStyleDescription !== 'string') return null;

  if (customStyleDescription.length > MAX_CUSTOM_STYLE_LENGTH) {
    throw new Error('Custom style description must be under 500 characters');
  }

  const trimmed = customStyleDescription.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function validateText(value: unknown, errorMessage: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(errorMessage);
  }
  if (value.length > MAX_TEXT_LENGTH) {
    throw new Error('Text must be under 10,000 characters');
  }
  return value;
}

async function callAiGateway(
  env: Env,
  mode: Mode,
  style: OutputStyle,
  customStyleDescription: string | null,
  rules: string,
  services: string,
  history: { role: MessageRole; content: string; draftText?: string | null }[],
  latestUserMessage: string,
  includeThreadTitle: boolean,
): Promise<DraftGeneration | Response> {
  const styleInstruction = buildStyleInstruction(style, customStyleDescription);
  const systemPrompt = buildSystemPrompt(mode, styleInstruction, rules, services, includeThreadTitle);

  const messages: { role: string; content: string }[] = [{ role: 'system', content: systemPrompt }];

  for (const message of history) {
    if (message.role === 'assistant') {
      const assistantContent = message.draftText
        ? `${message.content}\n\nCurrent draft:\n${message.draftText}`
        : message.content;
      messages.push({ role: 'assistant', content: assistantContent });
    } else {
      messages.push({ role: 'user', content: message.content });
    }
  }

  messages.push({ role: 'user', content: latestUserMessage });

  const response = await fetch(`${env.AI_GATEWAY_ENDPOINT}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.CF_AI_GATEWAY_TOKEN}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-5.2',
      messages,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('OpenAI API error:', response.status, errorBody);
    return Response.json(
      { error: 'AI service unavailable. Please try again.' },
      { status: 502 },
    );
  }

  const result: OpenAIResponse = await response.json();
  const content = result.choices[0]?.message.content ?? '';

  return parseAiDraft(content);
}

async function buildThreadPayload(env: Env, threadId: string): Promise<Response> {
  const thread = await fetchThreadById(env, threadId);
  if (!thread) {
    return Response.json({ error: 'Thread not found' }, { status: 404 });
  }

  const messages = await fetchMessagesForThread(env, threadId);
  return Response.json({ thread: toThreadResponse(thread, messages) });
}

export const onRequestGet: PagesFunction<Env, string, AuthenticatedData> = async (context) => {
  const { env, request, data } = context;
  const denied = assertAppAccess(data.user, 'brand-voice');
  if (denied) return denied;

  const url = new URL(request.url);
  const threadId = url.searchParams.get('threadId');

  if (threadId) {
    return await buildThreadPayload(env, threadId);
  }

  const { results } = await env.DB.prepare(
    `SELECT id, title
     FROM brand_voice_threads
     ORDER BY last_message_at DESC, updated_at DESC`,
  ).all<{ id: string; title: string }>();

  return Response.json({
    threads: results.map((row) => ({
      id: row.id,
      title: row.title,
    })),
  });
};

export const onRequestPost: PagesFunction<Env, string, AuthenticatedData> = async (context) => {
  const { request, env, data } = context;
  const denied = assertAppAccess(data.user, 'brand-voice');
  if (denied) return denied;

  const body: RewriteBody = await request.json();
  const action = typeof body.action === 'string' ? body.action : '';

  if (action === 'start') {
    let customStyleDescription: string | null;
    let text: string;

    try {
      text = validateText(body.text, 'text is required');
      customStyleDescription = validateCustomStyle(body.customStyleDescription);
    } catch {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    const mode = parseMode(body.mode, 'rewrite');
    const style = parseStyle(body.style, 'other');

    const settings = await fetchBrandSettings(env);
    if (!settings.rules_markdown.trim()) {
      return Response.json(
        { error: 'No brand rules configured. Ask an admin to set them up.' },
        { status: 422 },
      );
    }

    const aiResult = await callAiGateway(
      env,
      mode,
      style,
      customStyleDescription,
      settings.rules_markdown,
      settings.services_markdown,
      [],
      text,
      true,
    );

    if (aiResult instanceof Response) return aiResult;

    const threadId = crypto.randomUUID();
    const userMessageId = crypto.randomUUID();
    const assistantMessageId = crypto.randomUUID();
    const threadTitle = formatThreadTitle(aiResult.threadTitle, data.user.name);

    await env.DB.prepare(
      `INSERT INTO brand_voice_threads
        (id, title, mode, style, custom_style_description, latest_draft, pinned_draft, created_by, created_by_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        threadId,
        threadTitle,
        mode,
        style,
        customStyleDescription,
        aiResult.draft,
        null,
        data.user.id,
        data.user.name,
      )
      .run();

    await env.DB.prepare(
      `INSERT INTO brand_voice_messages
        (id, thread_id, role, content, draft_text, created_by, created_by_name)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        userMessageId,
        threadId,
        'user',
        text,
        null,
        data.user.id,
        data.user.name,
      )
      .run();

    await env.DB.prepare(
      `INSERT INTO brand_voice_messages
        (id, thread_id, role, content, draft_text, created_by, created_by_name)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        assistantMessageId,
        threadId,
        'assistant',
        aiResult.assistantMessage,
        aiResult.draft,
        null,
        'Brand Voice Colleague',
      )
      .run();

    const payload = await buildThreadPayload(env, threadId);
    const responseBody = await payload.json();
    return Response.json(responseBody, { status: 201 });
  }

  if (action === 'reply') {
    const threadId = typeof body.threadId === 'string' ? body.threadId : '';
    if (!threadId) {
      return Response.json({ error: 'threadId is required' }, { status: 400 });
    }

    let latestUserMessage: string;
    let customStyleDescription: string | null;

    try {
      latestUserMessage = validateText(body.message, 'message is required');
      customStyleDescription = validateCustomStyle(body.customStyleDescription);
    } catch {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    const thread = await fetchThreadById(env, threadId);
    if (!thread) {
      return Response.json({ error: 'Thread not found' }, { status: 404 });
    }

    const mode = parseMode(body.mode, thread.mode);
    const style = parseStyle(body.style, thread.style);
    const effectiveCustomStyleDescription = customStyleDescription ?? thread.custom_style_description;

    const settings = await fetchBrandSettings(env);
    if (!settings.rules_markdown.trim()) {
      return Response.json(
        { error: 'No brand rules configured. Ask an admin to set them up.' },
        { status: 422 },
      );
    }

    const previousMessages = await fetchMessagesForThread(env, threadId);
    const aiResult = await callAiGateway(
      env,
      mode,
      style,
      effectiveCustomStyleDescription,
      settings.rules_markdown,
      settings.services_markdown,
      previousMessages.map((message) => ({
        role: message.role,
        content: message.content,
        draftText: message.draft_text,
      })),
      latestUserMessage,
      false,
    );

    if (aiResult instanceof Response) return aiResult;

    const userMessageId = crypto.randomUUID();
    const assistantMessageId = crypto.randomUUID();

    await env.DB.prepare(
      `INSERT INTO brand_voice_messages
        (id, thread_id, role, content, draft_text, created_by, created_by_name)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        userMessageId,
        threadId,
        'user',
        latestUserMessage,
        null,
        data.user.id,
        data.user.name,
      )
      .run();

    await env.DB.prepare(
      `INSERT INTO brand_voice_messages
        (id, thread_id, role, content, draft_text, created_by, created_by_name)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        assistantMessageId,
        threadId,
        'assistant',
        aiResult.assistantMessage,
        aiResult.draft,
        null,
        'Brand Voice Colleague',
      )
      .run();

    await env.DB.prepare(
      `UPDATE brand_voice_threads
       SET mode = ?, style = ?, custom_style_description = ?, latest_draft = ?, updated_at = datetime('now'), last_message_at = datetime('now')
       WHERE id = ?`,
    )
      .bind(
        mode,
        style,
        effectiveCustomStyleDescription,
        aiResult.draft,
        threadId,
      )
      .run();

    return await buildThreadPayload(env, threadId);
  }

  if (action === 'rename') {
    const threadId = typeof body.threadId === 'string' ? body.threadId : '';
    const title = typeof body.title === 'string' ? sanitizeTitle(body.title) : '';

    if (!threadId) {
      return Response.json({ error: 'threadId is required' }, { status: 400 });
    }
    if (!title) {
      return Response.json({ error: 'title is required' }, { status: 400 });
    }

    const existing = await env.DB.prepare('SELECT id FROM brand_voice_threads WHERE id = ?')
      .bind(threadId)
      .first();

    if (!existing) {
      return Response.json({ error: 'Thread not found' }, { status: 404 });
    }

    await env.DB.prepare(
      `UPDATE brand_voice_threads SET title = ?, updated_at = datetime('now') WHERE id = ?`,
    )
      .bind(title, threadId)
      .run();

    return await buildThreadPayload(env, threadId);
  }

  if (action === 'pin') {
    const threadId = typeof body.threadId === 'string' ? body.threadId : '';
    if (!threadId) {
      return Response.json({ error: 'threadId is required' }, { status: 400 });
    }

    const existing = await env.DB.prepare('SELECT id FROM brand_voice_threads WHERE id = ?')
      .bind(threadId)
      .first();

    if (!existing) {
      return Response.json({ error: 'Thread not found' }, { status: 404 });
    }

    await env.DB.prepare(
      `UPDATE brand_voice_threads
       SET pinned_draft = latest_draft, updated_at = datetime('now')
       WHERE id = ?`,
    )
      .bind(threadId)
      .run();

    return await buildThreadPayload(env, threadId);
  }

  return Response.json({ error: 'Unsupported action' }, { status: 400 });
};
