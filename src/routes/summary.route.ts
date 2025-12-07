import { Router } from 'express';
import { generateSummary, getSummaryHistory } from '../controllers/summary.controller';
import { getSummaries } from '../controllers/ocr.controller';

const router = Router();

/**
 * @swagger
 * /api/summary:
 *   get:
 *     summary: List generated summaries
 *     tags: [Summary]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of summaries
 */
router.get('/', getSummaries);

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

/**
 * @swagger
 * /api/summary/history/{ocrId}:
 *   get:
 *     summary: Get summary generation history for a specific file
 *     tags: [Summary]
 *     parameters:
 *       - in: path
 *         name: ocrId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Summary history list
 */
router.get('/history/:ocrId', getSummaryHistory);

export default router;
