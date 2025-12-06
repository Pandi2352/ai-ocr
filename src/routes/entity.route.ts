import { Router } from 'express';
import { extractEntities } from '../controllers/entity.controller';

const router = Router();

/**
 * @swagger
 * /api/entities:
 *   post:
 *     summary: Extract named entities from OCR result
 *     tags: [Entities]
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

export default router;
