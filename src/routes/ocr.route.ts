import { Router } from 'express';
import { upload } from '../middlewares/upload.middleware';
import { analyzeFile, getFileStatus, getFiles } from '../controllers/ocr.controller';

const router = Router();

/**
 * @swagger
 * /api/ocr/analyze:
 *   post:
 *     summary: Analyze file (OCR/Multimodal)
 *     tags: [OCR]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Analysis result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         title:
 *                           type: string
 *                         description:
 *                           type: string
 *                         thumbnail:
 *                           type: string
 *                     analysis:
 *                       type: string
 */

/**
 * @swagger
 * /api/ocr/status/{id}:
 *   get:
 *     summary: Get OCR status by ID
 *     tags: [OCR]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: OCR Record ID
 *     responses:
 *       200:
 *         description: Status details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: object
 *                       properties:
 *                         upload:
 *                           type: string
 *                         visualProcessing:
 *                           type: string
 *                         rag:
 *                           type: string
 *                         overall:
 *                           type: string
 *                     timing:
 *                       type: object
 *                       properties:
 *                         startTime:
 *                           type: string
 *                           format: date-time
 *                         duration:
 *                           type: number
 *       404:
 *         description: Record not found
 */
router.post('/analyze', upload.single('file'), analyzeFile);
router.get('/status/:id', getFileStatus);

/**
 * @swagger
 * /api/ocr/list:
 *   get:
 *     summary: List analyzed files with pagination
 *     tags: [OCR]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of files
 */
router.get('/list', getFiles);

export default router;
