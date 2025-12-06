import { Router, Request, Response } from 'express';
import { sendSuccess } from '../utils/response';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health Check
 *     description: Returns server health status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     uptime:
 *                       type: number
 *                     timestamp:
 *                       type: string
 */
router.get('/', (req: Request, res: Response) => {
    sendSuccess(res, 'OCR Backend API is healthy', {
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

export default router;
