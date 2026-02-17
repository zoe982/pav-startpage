export interface BrandRules {
  readonly rulesMarkdown: string;
  readonly servicesMarkdown: string;
  readonly updatedAt: string | null;
}

export type OutputStyle = 'email' | 'whatsapp' | 'document' | 'instagram' | 'facebook' | 'other';

export type BrandMode = 'rewrite' | 'draft';

export interface RewriteResult {
  readonly original: string;
  readonly rewritten: string;
}

export interface RefineRequest {
  readonly original: string;
  readonly currentRewritten: string;
  readonly feedback: string;
  readonly style: OutputStyle;
  readonly mode: BrandMode;
  readonly customStyleDescription?: string;
}

export interface BrandVoiceThreadSummary {
  readonly id: string;
  readonly title: string;
}

export type BrandVoiceMessageRole = 'user' | 'assistant';

export interface BrandVoiceMessage {
  readonly id: string;
  readonly role: BrandVoiceMessageRole;
  readonly content: string;
}

export type BrandVoiceDraftVersionSource = 'assistant' | 'manual' | 'restore';

export interface BrandVoiceDraftVersion {
  readonly id: string;
  readonly versionNumber: number;
  readonly draftText: string;
  readonly source: BrandVoiceDraftVersionSource;
  readonly createdAt: string;
  readonly createdByName: string;
}

export interface BrandVoiceThread {
  readonly id: string;
  readonly title: string;
  readonly mode: BrandMode;
  readonly style: OutputStyle;
  readonly customStyleDescription: string | null;
  readonly latestDraft: string;
  readonly pinnedDraft: string | null;
  readonly draftVersions: readonly BrandVoiceDraftVersion[];
  readonly messages: readonly BrandVoiceMessage[];
}

export interface ThreadListResponse {
  readonly threads: readonly BrandVoiceThreadSummary[];
}

export interface ThreadDetailResponse {
  readonly thread: BrandVoiceThread;
}

export interface StartThreadRequest {
  readonly goal: string;
  readonly roughDraft?: string;
  readonly noDraftProvided: boolean;
  readonly text?: string;
  readonly style: OutputStyle;
  readonly mode: BrandMode;
  readonly customStyleDescription?: string;
}

export interface ReplyThreadRequest {
  readonly threadId: string;
  readonly message: string;
  readonly style?: OutputStyle;
  readonly mode?: BrandMode;
  readonly customStyleDescription?: string;
}
