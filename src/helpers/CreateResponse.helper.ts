import { ServiceResponse } from '../interfaces/ServiceResponse.interface';

// Helper function to create standardized error responses
export const createErrorResponse = (statusCode: number, message: string): ServiceResponse => ({
  success: false,
  statusCode,
  message
});

// Helper function to create standardized success responses
export const createSuccessResponse = (
  statusCode: number,
  message: string,
  data?: any
): ServiceResponse => ({
  success: true,
  statusCode,
  message,
  ...(data && { data })
});
