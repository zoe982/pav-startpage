import type { Env, AuthenticatedData } from '../../types.ts';
import { assertAppAccess } from '../../types.ts';

type OutputStyle = 'email' | 'whatsapp' | 'document' | 'instagram' | 'facebook' | 'other';
type Mode = 'rewrite' | 'draft';
type MessageRole = 'user' | 'assistant';
type DraftVersionSource = 'assistant' | 'manual' | 'restore';

const VALID_STYLES: ReadonlySet<string> = new Set(['email', 'whatsapp', 'document', 'instagram', 'facebook', 'other']);
const VALID_MODES: ReadonlySet<string> = new Set(['rewrite', 'draft']);

const MAX_TEXT_LENGTH = 10000;
const MAX_CUSTOM_STYLE_LENGTH = 500;
const MAX_TITLE_LENGTH = 180;

const STYLE_INSTRUCTIONS: Record<OutputStyle, string> = {
  email: 'Format the output for a professional email. Use appropriate greeting and sign-off structure. Keep paragraphs short and scannable. Best practices: clear subject-ready opening, one request per paragraph, and explicit next step.',
  whatsapp: 'Format the output for a WhatsApp message. Keep it concise and conversational. Use short paragraphs. No formal greetings or sign-offs. Best practices: lead with the ask, keep to 2-4 short blocks, and include one clear CTA.',
  document: 'Format the output for a formal document. Use complete sentences, proper paragraph structure, and a professional tone throughout. Best practices: logical heading flow, concise factual statements, and a decisive closing summary.',
  instagram: `Format the output as an Instagram post with two clearly labeled sections:

**IMAGE TEXT:** Short, bold text for the image itself (1-2 lines max, punchy and attention-grabbing, suitable for overlay on a photo). Use sentence case.

**CAPTION:** An engaging Instagram caption. Lead with a strong hook in the first line (only ~125 characters show before "More"). Keep the full caption under 2,200 characters. Use line breaks for readability. Add 3-5 relevant hashtags at the end. Keep the tone warm, approachable, and on-brand. Include a clear call to action.`,
  facebook: 'Format the output as a Facebook post. Lead with a compelling hook in the first 1-2 lines (only ~125 characters show before "See More"). Keep the total post concise — ideally 40-80 words for maximum engagement. Use short paragraphs with line breaks for scannability. Include a clear call to action. Use 1-3 relevant hashtags at most — do not over-tag. Keep the tone warm, professional, and conversational. Best practices: hook first, action near end, hashtags last.',
  other: 'Format the output as general-purpose text. Keep it clear and well-structured. Best practices: strong opening line, clean paragraph cadence, and explicit outcome statement.',
};

interface RewriteBody {
  action?: string;
  threadId?: string;
  text?: string;
  goal?: string;
  roughDraft?: string;
  noDraftProvided?: boolean;
  draftText?: string;
  versionId?: string;
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

interface DraftVersionRow {
  id: string;
  version_number: number;
  draft_text: string;
  source: DraftVersionSource;
  created_at: string;
  created_by_name: string;
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

function formatThreadTitle(baseTitle: string | null): string {
  const fallbackTitle = 'Brand Voice Thread';
  return sanitizeTitle(baseTitle ?? '') || fallbackTitle;
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

async function fetchDraftVersionsForThread(env: Env, threadId: string): Promise<DraftVersionRow[]> {
  const { results } = await env.DB.prepare(
    `SELECT id, version_number, draft_text, source, created_at, created_by_name
     FROM brand_voice_draft_versions
     WHERE thread_id = ?
     ORDER BY version_number DESC, created_at DESC`,
  )
    .bind(threadId)
    .all<DraftVersionRow>();

  return results;
}

function toThreadResponse(
  thread: ThreadRow,
  messages: MessageRow[],
  draftVersions: DraftVersionRow[],
): {
  id: string;
  title: string;
  mode: Mode;
  style: OutputStyle;
  customStyleDescription: string | null;
  latestDraft: string;
  pinnedDraft: string | null;
  draftVersions: {
    id: string;
    versionNumber: number;
    draftText: string;
    source: DraftVersionSource;
    createdAt: string;
    createdByName: string;
  }[];
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
    draftVersions: draftVersions.map((version) => ({
      id: version.id,
      versionNumber: version.version_number,
      draftText: version.draft_text,
      source: version.source,
      createdAt: version.created_at,
      createdByName: version.created_by_name,
    })),
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

interface StartPromptInput {
  goal: string;
  roughDraft: string | null;
  noDraftProvided: boolean;
}

function parseStartPromptInput(body: RewriteBody): StartPromptInput {
  const goalValue = typeof body.goal === 'string' && body.goal.trim()
    ? body.goal
    : body.text;

  const goal = validateText(goalValue, 'goal is required');

  const roughDraft = typeof body.roughDraft === 'string'
    ? body.roughDraft.trim()
    : '';
  if (roughDraft.length > MAX_TEXT_LENGTH) {
    throw new Error('roughDraft must be under 10,000 characters');
  }

  const hasRoughDraft = roughDraft.length > 0;
  const noDraftProvided = body.noDraftProvided === true;
  if (!hasRoughDraft && !noDraftProvided && typeof body.text !== 'string') {
    throw new Error('roughDraft or noDraftProvided is required');
  }

  return {
    goal,
    roughDraft: hasRoughDraft ? roughDraft : null,
    noDraftProvided: noDraftProvided || !hasRoughDraft,
  };
}

function buildFirstTurnMessage(input: StartPromptInput, style: OutputStyle, mode: Mode): string {
  const roughDraftSection = input.noDraftProvided
    ? 'No draft available'
    : input.roughDraft;

  return [
    'First-turn setup payload:',
    `Mode: ${mode}`,
    `Requested style: ${style}`,
    'Goal:',
    '---',
    input.goal,
    '---',
    'Rough draft:',
    '---',
    roughDraftSection,
    '---',
  ].join('\n');
}

async function nextDraftVersionNumber(env: Env, threadId: string): Promise<number> {
  const row = await env.DB.prepare(
    'SELECT MAX(version_number) AS max_version FROM brand_voice_draft_versions WHERE thread_id = ?',
  )
    .bind(threadId)
    .first<{ max_version: number | null }>();

  return (row?.max_version ?? 0) + 1;
}

async function insertDraftVersion(
  env: Env,
  threadId: string,
  draftText: string,
  source: DraftVersionSource,
  createdBy: string | null,
  createdByName: string,
): Promise<void> {
  const versionNumber = await nextDraftVersionNumber(env, threadId);

  await env.DB.prepare(
    `INSERT INTO brand_voice_draft_versions
      (id, thread_id, version_number, draft_text, source, created_by, created_by_name)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      crypto.randomUUID(),
      threadId,
      versionNumber,
      draftText,
      source,
      createdBy,
      createdByName,
    )
    .run();
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
  const draftVersions = await fetchDraftVersionsForThread(env, threadId);
  return Response.json({ thread: toThreadResponse(thread, messages, draftVersions) });
}

export const onRequestGet: PagesFunction<Env, string, AuthenticatedData> = async (context) => {
  const { env, request, data } = context;
  const denied = assertAppAccess(data.user, 'brand-voice');
  if (denied) return denied;

  try {
    const url = new URL(request.url);
    const threadId = url.searchParams.get('threadId');

    if (threadId) {
      return await buildThreadPayload(env, threadId);
    }

    const { results } = await env.DB.prepare(
      `SELECT t.id, t.title, t.created_at, u.email AS created_by_email
       FROM brand_voice_threads t
       LEFT JOIN users u ON t.created_by = u.id
       ORDER BY t.created_at DESC`,
    ).all<{ id: string; title: string; created_at: string; created_by_email: string | null }>();

    return Response.json({
      threads: results.map((row) => ({
        id: row.id,
        title: row.title,
        createdByEmail: row.created_by_email ?? null,
        createdAt: row.created_at,
      })),
    });
  } catch (err) {
    console.error('Brand voice GET error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return Response.json({ error: message }, { status: 500 });
  }
};

export const onRequestDelete: PagesFunction<Env, string, AuthenticatedData> = async (context) => {
  const { env, request, data } = context;
  const denied = assertAppAccess(data.user, 'brand-voice');
  if (denied) return denied;

  try {
    const url = new URL(request.url);
    const threadId = url.searchParams.get('threadId');

    if (!threadId) {
      return Response.json({ error: 'threadId is required' }, { status: 400 });
    }

    const existing = await env.DB.prepare('SELECT id FROM brand_voice_threads WHERE id = ?')
      .bind(threadId)
      .first();

    if (!existing) {
      return Response.json({ error: 'Thread not found' }, { status: 404 });
    }

    await env.DB.prepare('DELETE FROM brand_voice_draft_versions WHERE thread_id = ?')
      .bind(threadId)
      .run();

    await env.DB.prepare('DELETE FROM brand_voice_messages WHERE thread_id = ?')
      .bind(threadId)
      .run();

    await env.DB.prepare('DELETE FROM brand_voice_threads WHERE id = ?')
      .bind(threadId)
      .run();

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('Brand voice DELETE error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return Response.json({ error: message }, { status: 500 });
  }
};

export const onRequestPost: PagesFunction<Env, string, AuthenticatedData> = async (context) => {
  const { request, env, data } = context;
  const denied = assertAppAccess(data.user, 'brand-voice');
  if (denied) return denied;

  try {
  const body: RewriteBody = await request.json();
  const action = typeof body.action === 'string' ? body.action : '';

  if (action === 'start') {
    let customStyleDescription: string | null;
    let startPromptInput: StartPromptInput;

    try {
      startPromptInput = parseStartPromptInput(body);
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
      buildFirstTurnMessage(startPromptInput, style, mode),
      true,
    );

    if (aiResult instanceof Response) return aiResult;

    const threadId = crypto.randomUUID();
    const userMessageId = crypto.randomUUID();
    const assistantMessageId = crypto.randomUUID();
    const threadTitle = formatThreadTitle(aiResult.threadTitle);

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
        startPromptInput.goal,
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

    await insertDraftVersion(
      env,
      threadId,
      aiResult.draft,
      'assistant',
      null,
      'Brand Voice Colleague',
    );

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

    await insertDraftVersion(
      env,
      threadId,
      aiResult.draft,
      'assistant',
      null,
      'Brand Voice Colleague',
    );

    return await buildThreadPayload(env, threadId);
  }

  if (action === 'saveDraft') {
    const threadId = typeof body.threadId === 'string' ? body.threadId : '';
    if (!threadId) {
      return Response.json({ error: 'threadId is required' }, { status: 400 });
    }

    let draftText: string;
    try {
      draftText = validateText(body.draftText, 'draftText is required');
    } catch {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    const existing = await env.DB.prepare('SELECT id FROM brand_voice_threads WHERE id = ?')
      .bind(threadId)
      .first();

    if (!existing) {
      return Response.json({ error: 'Thread not found' }, { status: 404 });
    }

    await env.DB.prepare(
      `UPDATE brand_voice_threads
       SET latest_draft = ?, updated_at = datetime('now'), last_message_at = datetime('now')
       WHERE id = ?`,
    )
      .bind(draftText, threadId)
      .run();

    await insertDraftVersion(
      env,
      threadId,
      draftText,
      'manual',
      data.user.id,
      data.user.name,
    );

    return await buildThreadPayload(env, threadId);
  }

  if (action === 'restoreVersion') {
    const threadId = typeof body.threadId === 'string' ? body.threadId : '';
    const versionId = typeof body.versionId === 'string' ? body.versionId : '';
    if (!threadId) {
      return Response.json({ error: 'threadId is required' }, { status: 400 });
    }
    if (!versionId) {
      return Response.json({ error: 'versionId is required' }, { status: 400 });
    }

    const existing = await env.DB.prepare('SELECT id FROM brand_voice_threads WHERE id = ?')
      .bind(threadId)
      .first();

    if (!existing) {
      return Response.json({ error: 'Thread not found' }, { status: 404 });
    }

    const version = await env.DB.prepare(
      `SELECT id, version_number, draft_text, source, created_at, created_by_name
       FROM brand_voice_draft_versions
       WHERE id = ? AND thread_id = ?`,
    )
      .bind(versionId, threadId)
      .first<DraftVersionRow>();

    if (!version) {
      return Response.json({ error: 'Version not found' }, { status: 404 });
    }

    await env.DB.prepare(
      `UPDATE brand_voice_threads
       SET latest_draft = ?, updated_at = datetime('now'), last_message_at = datetime('now')
       WHERE id = ?`,
    )
      .bind(version.draft_text, threadId)
      .run();

    await insertDraftVersion(
      env,
      threadId,
      version.draft_text,
      'restore',
      data.user.id,
      data.user.name,
    );

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
  } catch (err) {
    console.error('Brand voice POST error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return Response.json({ error: message }, { status: 500 });
  }
};
