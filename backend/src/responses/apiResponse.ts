import { Response } from 'express';

export interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
  meta?: any;
  timestamp: string;
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  data?: T,
  errors?: any,
  meta?: any
) => {
  const response: IApiResponse<T> = {
    success,
    message,
    data,
    errors,
    meta,
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
};

export const sendSuccess = <T>(res: Response, message: string, data?: T, meta?: any, statusCode = 200) => {
  return sendResponse(res, statusCode, true, message, data, undefined, meta);
};

export const sendError = (res: Response, message: string, errors?: any, statusCode = 400) => {
  return sendResponse(res, statusCode, false, message, undefined, errors);
};
