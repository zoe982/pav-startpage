import type { Env, AuthenticatedData } from '../../types.ts';

type OutputStyle = 'email' | 'whatsapp' | 'document' | 'other';
type Mode = 'rewrite' | 'draft';

const VALID_STYLES: ReadonlySet<string> = new Set(['email', 'whatsapp', 'document', 'other']);
const VALID_MODES: ReadonlySet<string> = new Set(['rewrite', 'draft']);

const STYLE_INSTRUCTIONS: Record<OutputStyle, string> = {
  email: 'Format the output for a professional email. Use appropriate greeting and sign-off structure. Keep paragraphs short and scannable.',
  whatsapp: 'Format the output for a WhatsApp message. Keep it concise and conversational. Use short paragraphs. No formal greetings or sign-offs.',
  document: 'Format the output for a formal document. Use complete sentences, proper paragraph structure, and a professional tone throughout.',
  other: 'Format the output as general-purpose text. Keep it clear and well-structured.',
};

interface RewriteBody {
  text: string;
  style?: string;
  mode?: string;
  customStyleDescription?: string;
  currentRewritten?: string;
  feedback?: string;
}

interface BrandSettingsRow {
  rules_markdown: string;
  services_markdown: string;
}

interface OpenAIChoice {
  message: {
    content: string;
  };
}

interface OpenAIResponse {
  choices: OpenAIChoice[];
}

function buildSystemPrompt(mode: Mode, styleInstruction: string, rules: string, services: string): string {
  const serviceBlock = services.trim()
    ? `\n\nService Offerings (use as factual reference):\n${services}`
    : '';

  if (mode === 'draft') {
    return `You are the communications concierge for Pet Air Valet. The user will give you a request describing what they need drafted (e.g., "write a WhatsApp bio", "create a welcome email"). Draft the requested content from scratch, following the brand voice guidelines and using the service offerings as factual reference material.

Return ONLY the drafted content — no explanations, no preamble.

${styleInstruction}

Brand Voice Guidelines:
${rules}${serviceBlock}`;
  }

  return `You are a brand voice editor for Pet Air Valet. Your job is to rewrite the user's text so it matches the company's brand voice guidelines below. Use the service offerings as factual reference to ensure accuracy. Return ONLY the rewritten text — no explanations, no preamble, no markdown formatting unless the original text uses it.

${styleInstruction}

Brand Voice Guidelines:
${rules}${serviceBlock}`;
}

export const onRequestPost: PagesFunction<Env, string, AuthenticatedData> = async (context) => {
  const { request, env } = context;
  const body: RewriteBody = await request.json();

  if (!body.text || typeof body.text !== 'string') {
    return Response.json(
      { error: 'text is required' },
      { status: 400 },
    );
  }

  if (body.text.length > 10000) {
    return Response.json(
      { error: 'Text must be under 10,000 characters' },
      { status: 400 },
    );
  }

  const style: OutputStyle = body.style && VALID_STYLES.has(body.style)
    ? body.style as OutputStyle
    : 'other';

  const mode: Mode = body.mode && VALID_MODES.has(body.mode)
    ? body.mode as Mode
    : 'rewrite';

  if (body.customStyleDescription && body.customStyleDescription.length > 500) {
    return Response.json(
      { error: 'Custom style description must be under 500 characters' },
      { status: 400 },
    );
  }

  const isRefinement = typeof body.currentRewritten === 'string'
    && typeof body.feedback === 'string'
    && body.feedback.trim().length > 0;

  if (isRefinement && body.feedback!.length > 2000) {
    return Response.json(
      { error: 'Feedback must be under 2,000 characters' },
      { status: 400 },
    );
  }

  const row = await env.DB.prepare(
    'SELECT rules_markdown, services_markdown FROM brand_settings WHERE id = 1',
  ).first<BrandSettingsRow>();

  const rules = row?.rules_markdown ?? '';
  const services = row?.services_markdown ?? '';

  if (!rules.trim()) {
    return Response.json(
      { error: 'No brand rules configured. Ask an admin to set them up.' },
      { status: 422 },
    );
  }

  const styleInstruction = style === 'other' && body.customStyleDescription?.trim()
    ? `Format the output according to these instructions: ${body.customStyleDescription}`
    : STYLE_INSTRUCTIONS[style];

  const systemPrompt = buildSystemPrompt(mode, styleInstruction, rules, services);

  const messages: { role: string; content: string }[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: body.text },
  ];

  if (isRefinement) {
    messages.push(
      { role: 'assistant', content: body.currentRewritten! },
      { role: 'user', content: `Please refine based on: ${body.feedback!}` },
    );
  }

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
  const rewritten = result.choices[0]?.message.content ?? '';

  return Response.json({
    original: body.text,
    rewritten,
  });
};
