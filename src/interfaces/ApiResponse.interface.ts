export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
}

export interface ErrorResponse {
  statusCode: number;
  message: string;
  errors?: any;
}

export interface ApiResponseWithMeta<T> extends ApiResponse<T> {
  meta: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
}

export interface ApiResponseWithStatus<T> extends ApiResponse<T> {
  status: string;
}

export interface ApiResponseWithStatusAndMeta<T> extends ApiResponseWithMeta<T> {
  status: string;
}

export interface ApiResponseWithStatusAndErrors<T> extends ApiResponse<T> {
  status: string;
  errors: any;
}