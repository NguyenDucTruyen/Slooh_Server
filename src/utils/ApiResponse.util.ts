import { ApiResponse } from '../interfaces/ApiResponse.interface';
/**
 * Utility function to send standardized API responses
 * @param res - Express response object
 * @param statusCode - HTTP status code
 * @param success - Whether the operation was successful
 * @param message - Optional message to include
 * @param data - Optional data to include in the response
 * @param errors - Optional errors to include in the response
 */
const sendResponse = <T>(
  res: any,
  statusCode: number,
  success: boolean,
  message?: string,
  data?: T,
  errors?: any
) => {
  const responseBody: ApiResponse<T> = {
    success,
    ...(message && { message }),
    ...(data && { data }),
    ...(errors && { errors })
  };

  return res.status(statusCode).json(responseBody);
};

export default sendResponse;
