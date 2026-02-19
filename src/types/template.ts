export type TemplateType = 'email' | 'whatsapp' | 'both';

export interface Template {
  readonly id: string;
  readonly title: string;
  readonly type: TemplateType;
  readonly subject: string | null;
  readonly content: string;
  readonly createdBy: string;
  readonly createdByName: string;
  readonly updatedBy: string;
  readonly updatedByName: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly approvedByEmail: string | null;
  readonly approvedAt: string | null;
}

export interface TemplateFormData {
  readonly title: string;
  readonly type: TemplateType;
  readonly subject: string;
  readonly content: string;
}

export interface TemplateVersion {
  readonly id: string;
  readonly versionNumber: number;
  readonly title: string;
  readonly type: TemplateType;
  readonly subject: string | null;
  readonly content: string;
  readonly changedByName: string;
  readonly createdAt: string;
}
