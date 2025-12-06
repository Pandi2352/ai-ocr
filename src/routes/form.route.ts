import { Router } from 'express';
import { fillForm } from '../controllers/form.controller';

const router = Router();

/**
 * @swagger
 * /api/forms/fill:
 *   post:
 *     summary: Auto-fill a form based on a valid schema
 *     tags: [Forms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ocrId:
 *                 type: string
 *               schema:
 *                 type: object
 *                 description: Target JSON structure for the form.
 *                 example: { "full_name": "String", "dob": "DD-MM-YYYY", "passport_no": "String" }
 *               formType:
 *                 type: string
 *                 description: Optional label for the form type (e.g. "kyc", "visa")
 *     responses:
 *       200:
 *         description: Form data populated with extracted values
 */
router.post('/fill', fillForm);

export default router;
