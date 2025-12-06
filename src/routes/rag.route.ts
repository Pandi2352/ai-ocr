import { Router } from 'express';
import { ingestDocument, chatWithDocument, searchDocument } from '../controllers/rag.controller';

const router = Router();

/**
 * @swagger
 * /api/rag/ingest:
 *   post:
 *     summary: Ingest OCR document into Vector DB
 *     tags: [RAG]
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
 *         description: Ingestion successful
 */
router.post('/ingest', ingestDocument);

/**
 * @swagger
 * /api/rag/search:
 *   post:
 *     summary: Search for relevant document chunks (Vector Search)
 *     tags: [RAG]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ocrId:
 *                 type: string
 *                 description: Optional. Filter by doc ID.
 *               query:
 *                 type: string
 *               limit:
 *                 type: number
 *     responses:
 *       200:
 *         description: Search results
 */
router.post('/search', searchDocument);

/**
 * @swagger
 * /api/rag/chat:
 *   post:
 *     summary: Chat with a document (RAG)
 *     tags: [RAG]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ocrId:
 *                 type: string
 *                 description: Optional. Filter context to specific doc ID.
 *               question:
 *                 type: string
 *     responses:
 *       200:
 *         description: Answer generated
 */
router.post('/chat', chatWithDocument);

export default router;
