import { Router } from 'express';
import { compareDocuments, getComparisonHistory } from '../controllers/compare.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Comparison
 *   description: Compare two documents for changes
 */

/**
 * @swagger
 * /api/compare:
 *   post:
 *     summary: Compare two processed documents
 *     tags: [Comparison]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sourceId, targetId]
 *             properties:
 *               sourceId:
 *                 type: string
 *               targetId:
 *                 type: string
 *   get:
 *     summary: Get comparison history
 *     tags: [Comparison]
 */
router.post('/', compareDocuments);
router.get('/', getComparisonHistory);

export default router;
