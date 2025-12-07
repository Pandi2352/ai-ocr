import { Router } from 'express';
import { extractEntities, getEntityHistory } from '../controllers/entity.controller';
import { getEntities } from '../controllers/ocr.controller';

const router = Router();

/**
 * @swagger
 * /api/entities:
 *   get:
 *     summary: List extracted entities
 *     tags: [Entity]
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
 *         description: List of entities
 */
router.get('/', getEntities);

/**
 * @swagger
 * /api/entities:
 *   post:
 *     summary: Extract named entities from OCR result
 *     tags: [Entity]
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
 *               fields:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: (Optional) List of entities to extract. If omitted, AI automatically extracts key entities.
 *                 example: ["Name", "DOB", "Address"]
 *     responses:
 *       200:
 *         description: Extracted entities
 */
router.post('/', extractEntities);

/**
 * @swagger
 * /api/entities/history/{ocrId}:
 *   get:
 *     summary: Get entity extraction history for a specific file
 *     tags: [Entity]
 *     parameters:
 *       - in: path
 *         name: ocrId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Entity history list
 */
router.get('/history/:ocrId', getEntityHistory);

export default router;
