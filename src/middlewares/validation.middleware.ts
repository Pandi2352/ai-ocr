import { Request, Response, NextFunction } from 'express';
import { HttpException } from '../exceptions/HttpException';

export const validationMiddleware = (schema: any) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Basic validation logic assuming schema is a simple object validator function or similar
        // Since "no Zod" was requested, we can adapt this to consume a custom validator function
        // For now, let's assume schema is a function that returns { error: string | null }

        // Example usage: validationMiddleware((body) => { if (!body.name) return { error: 'Name required' }; return { error: null }; })

        if (typeof schema === 'function') {
            const validationResult = schema(req.body);
            if (validationResult && validationResult.error) {
                next(new HttpException(400, 'Validation Error', validationResult.error));
            } else {
                next();
            }
        } else {
            // Placeholder for other validation strategies if needed
            next();
        }
    };
};
