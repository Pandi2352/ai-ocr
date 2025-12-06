import { Router } from 'express';
import { generateImageFromOCR } from '../controllers/image.controller';

const router = Router();

/**
 * @swagger
 * /api/image/generate:
 *   post:
 *     summary: Generate an image based on OCR content
 *     tags: [Image]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ocrId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Image generated (Base64)
 */
router.post('/generate', generateImageFromOCR);

export default router;
