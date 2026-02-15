export interface WikiPage {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly content: string;
  readonly isPublished: boolean;
  readonly showOnStart: boolean;
  readonly sortOrder: number;
}

export interface WikiPageSummary {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly isPublished: boolean;
  readonly showOnStart: boolean;
  readonly sortOrder: number;
}

export interface WikiFormData {
  readonly title: string;
  readonly slug: string;
  readonly content: string;
  readonly isPublished: boolean;
  readonly showOnStart: boolean;
  readonly sortOrder: number;
}
