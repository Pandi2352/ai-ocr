import { Response } from 'express';

export const sendSuccess = (res: Response, message: string, data: any = {}) => {
    res.status(200).json({
        success: true,
        message,
        data,
    });
};

export const sendError = (res: Response, message: string, error: any = {}, status: number = 500) => {
    res.status(status).json({
        success: false,
        message,
        error,
    });
};
