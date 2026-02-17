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
