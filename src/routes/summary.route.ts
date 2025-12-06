import { Router } from 'express';
import { generateSummary } from '../controllers/summary.controller';

const router = Router();

/**
 * @swagger
 * /api/summary:
 *   post:
 *     summary: Generate document summary
 *     tags: [Summary]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ocrId:
 *                 type: string
 *                 description: valid UUID of OCR record
 *               prompt:
 *                 type: string
 *                 description: (Optional) Custom instruction for summarization. If omitted, uses auto-summary.
 *                 example: "Summarize this in 3 short bullet points"
 *     responses:
 *       200:
 *         description: Generated summary
 */
router.post('/', generateSummary);

export default router;
