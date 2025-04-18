// Service response interface
export interface ServiceResponse {
  success: boolean; // Indicates if the operation was successful
  statusCode: number; // Optional HTTP status code
  message?: string; // Optional message for success or error
  data?: any; // Optional data returned from the service
  errors?: any; // Optional errors returned from the service
}
