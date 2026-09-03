export interface ApiMessage {
  message: string;
}

export interface ApiResponse<T> extends ApiMessage {
  data: T;
}
