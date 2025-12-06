import { Router, Request, Response, NextFunction } from 'express';
import { generateText } from '../utils/llm';
import { sendSuccess } from '../utils/response';
import { HttpException } from '../exceptions/HttpException';

const router = Router();

/**
 * @swagger
 * /api/ai/generate:
 *   post:
 *     summary: Generate text using Gemini
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *     responses:
 *       200:
 *         description: Generated text
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
 *                     text:
 *                       type: string
 */
router.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            throw new HttpException(400, 'Prompt is required');
        }

        const text = await generateText(prompt);
        sendSuccess(res, 'Text generated successfully', { text });
    } catch (error) {
        next(error);
    }
});

export default router;
