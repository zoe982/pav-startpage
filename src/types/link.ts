export interface Link {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly description: string | null;
  readonly iconUrl: string | null;
  readonly sortOrder: number;
  readonly isVisible: boolean;
}

export interface LinkFormData {
  readonly title: string;
  readonly url: string;
  readonly description: string;
  readonly iconUrl: string;
  readonly sortOrder: number;
  readonly isVisible: boolean;
}
