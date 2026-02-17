import type {
  BrandMode,
  BrandRules,
  OutputStyle,
  RefineRequest,
  ReplyThreadRequest,
  RewriteResult,
  StartThreadRequest,
  ThreadDetailResponse,
  ThreadListResponse,
} from '../types/brandVoice.ts';
import { apiFetch } from './client.ts';

export async function fetchBrandRules(): Promise<BrandRules> {
  return await apiFetch<BrandRules>('/api/brand-rules');
}

export async function updateBrandRules(data: {
  rulesMarkdown?: string;
  servicesMarkdown?: string;
}): Promise<BrandRules> {
  return await apiFetch<BrandRules>('/api/admin/brand-rules', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function rewriteText(
  text: string,
  style: OutputStyle,
  mode: BrandMode,
  signal?: AbortSignal,
  customStyleDescription?: string,
): Promise<RewriteResult> {
  const payload: { text: string; style: OutputStyle; mode: BrandMode; customStyleDescription?: string } = {
    text,
    style,
    mode,
  };
  if (customStyleDescription) {
    payload.customStyleDescription = customStyleDescription;
  }

  const options: RequestInit = {
    method: 'POST',
    body: JSON.stringify(payload),
  };
  if (signal) {
    options.signal = signal;
  }
  return await apiFetch<RewriteResult>('/api/brand-voice/rewrite', {
    ...options,
  });
}

export async function refineText(
  request: RefineRequest,
  signal?: AbortSignal,
): Promise<RewriteResult> {
  const payload: {
    text: string;
    style: OutputStyle;
    mode: BrandMode;
    customStyleDescription?: string;
    currentRewritten: string;
    feedback: string;
  } = {
    text: request.original,
    style: request.style,
    mode: request.mode,
    currentRewritten: request.currentRewritten,
    feedback: request.feedback,
  };
  if (request.customStyleDescription) {
    payload.customStyleDescription = request.customStyleDescription;
  }

  const options: RequestInit = {
    method: 'POST',
    body: JSON.stringify(payload),
  };
  if (signal) {
    options.signal = signal;
  }
  return await apiFetch<RewriteResult>('/api/brand-voice/rewrite', {
    ...options,
  });
}

export async function listThreads(): Promise<ThreadListResponse> {
  return await apiFetch<ThreadListResponse>('/api/brand-voice/rewrite');
}

export async function getThread(threadId: string): Promise<ThreadDetailResponse> {
  const params = new URLSearchParams({ threadId });
  return await apiFetch<ThreadDetailResponse>(`/api/brand-voice/rewrite?${params.toString()}`);
}

export async function startThread(request: StartThreadRequest): Promise<ThreadDetailResponse> {
  const payload: {
    action: 'start';
    goal: string;
    roughDraft?: string;
    noDraftProvided: boolean;
    text?: string;
    style: OutputStyle;
    mode: BrandMode;
    customStyleDescription?: string;
  } = {
    action: 'start',
    goal: request.goal,
    noDraftProvided: request.noDraftProvided,
    style: request.style,
    mode: request.mode,
  };

  if (request.roughDraft) {
    payload.roughDraft = request.roughDraft;
  }
  if (request.text) {
    payload.text = request.text;
  }
  if (request.customStyleDescription) {
    payload.customStyleDescription = request.customStyleDescription;
  }

  return await apiFetch<ThreadDetailResponse>('/api/brand-voice/rewrite', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function replyInThread(request: ReplyThreadRequest): Promise<ThreadDetailResponse> {
  return await apiFetch<ThreadDetailResponse>('/api/brand-voice/rewrite', {
    method: 'POST',
    body: JSON.stringify({
      action: 'reply',
      threadId: request.threadId,
      message: request.message,
      ...(request.style ? { style: request.style } : {}),
      ...(request.mode ? { mode: request.mode } : {}),
      ...(request.customStyleDescription
        ? { customStyleDescription: request.customStyleDescription }
        : {}),
    }),
  });
}

export async function renameThread(threadId: string, title: string): Promise<ThreadDetailResponse> {
  return await apiFetch<ThreadDetailResponse>('/api/brand-voice/rewrite', {
    method: 'POST',
    body: JSON.stringify({
      action: 'rename',
      threadId,
      title,
    }),
  });
}

export async function pinThreadDraft(threadId: string): Promise<ThreadDetailResponse> {
  return await apiFetch<ThreadDetailResponse>('/api/brand-voice/rewrite', {
    method: 'POST',
    body: JSON.stringify({
      action: 'pin',
      threadId,
    }),
  });
}

export async function saveThreadDraft(
  threadId: string,
  draftText: string,
): Promise<ThreadDetailResponse> {
  return await apiFetch<ThreadDetailResponse>('/api/brand-voice/rewrite', {
    method: 'POST',
    body: JSON.stringify({
      action: 'saveDraft',
      threadId,
      draftText,
    }),
  });
}

export async function restoreThreadDraftVersion(
  threadId: string,
  versionId: string,
): Promise<ThreadDetailResponse> {
  return await apiFetch<ThreadDetailResponse>('/api/brand-voice/rewrite', {
    method: 'POST',
    body: JSON.stringify({
      action: 'restoreVersion',
      threadId,
      versionId,
    }),
  });
}
