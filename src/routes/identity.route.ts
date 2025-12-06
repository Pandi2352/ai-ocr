import { Router } from 'express';
import { verifyIdentity, getIdentityHistory } from '../controllers/identity.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Identity
 *   description: Advanced Identity Verification and Fraud Detection
 */

/**
 * @swagger
 * /api/identity/verify:
 *   post:
 *     summary: Verify identity by comparing two documents
 *     tags: [Identity]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [docA_Id, docB_Id]
 *             properties:
 *               docA_Id:
 *                 type: string
 *               docB_Id:
 *                 type: string
 *   get:
 *     summary: Get verification history
 *     tags: [Identity]
 */
router.post('/verify', verifyIdentity);
router.get('/history', getIdentityHistory);

export default router;
