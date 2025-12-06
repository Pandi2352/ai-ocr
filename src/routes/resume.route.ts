import { Router } from 'express';
import { analyzeResume, getResumeHistory } from '../controllers/resume.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Resume
 *   description: Resume Parsing and JD Matching
 */

/**
 * @swagger
 * /api/resume/analyze:
 *   post:
 *     summary: Parse Resume and Match with JD
 *     tags: [Resume]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ocrId, job_description]
 *             properties:
 *               ocrId:
 *                 type: string
 *               job_description:
 *                 type: string
 *   get:
 *     summary: Get analysis history
 *     tags: [Resume]
 */
router.post('/analyze', analyzeResume);
router.get('/history', getResumeHistory);

export default router;
