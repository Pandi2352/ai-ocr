import { NextFunction, Request, Response } from 'express';
import { HttpException } from '../exceptions/HttpException';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response';

export const errorMiddleware = (error: HttpException, req: Request, res: Response, next: NextFunction) => {
    const status = error.status || 500;
    const message = error.message || 'Something went wrong';

    logger.error(`[${req.method}] ${req.path} >> StatusCode:: ${status}, Message:: ${message}, Error:: ${JSON.stringify(error.error || {})}`);

    sendError(res, message, error.error, status);
};
