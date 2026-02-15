export interface ApiError {
  readonly error: string;
  readonly status: number;
}

export interface ApiSuccess<T> {
  readonly data: T;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
