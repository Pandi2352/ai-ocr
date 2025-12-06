import { Request, Response, NextFunction } from 'express';
import { OCRResult } from '../models/ocr.model';
import { ImageResult } from '../models/image.model';
import { generateImage } from '../utils/llm';
import { sendSuccess } from '../utils/response';
import { HttpException } from '../exceptions/HttpException';
import fs from 'fs';
import path from 'path';
import { generateUUID } from '../utils/uuid';

export const generateImageFromOCR = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { ocrId } = req.body;
        if (!ocrId) throw new HttpException(400, 'ocrId is required');

        const ocrRecord = await OCRResult.findById(ocrId);
        if (!ocrRecord) throw new HttpException(404, 'OCR Record not found');
        if (!ocrRecord.analysis) throw new HttpException(400, 'No analysis text available to generate image');

        // Construct a highly detailed prompt
        let contentToVisualize = "";

        // 1. Prefer structured entity extraction results for accuracy
        if (ocrRecord.entityResult && Object.keys(ocrRecord.entityResult).length > 0) {
            const entities = Object.entries(ocrRecord.entityResult)
                .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`)
                .join(', ');
            contentToVisualize = `Structured Details: ${entities}.`;
        }
        // 2. Fallback or append analysis text (up to 1000 chars to avoid token limits)
        else {
            contentToVisualize = `Content: ${ocrRecord.analysis.substring(0, 1000)}`;
        }

        const prompt = `Generate a photorealistic, high-resolution document image.

CRITICAL REQUIREMENT:
All text provided below MUST appear clearly, exactly as written, on the document. 
The text must be perfectly readable, sharp, and formatted as if printed on a real document.  
No missing text, no distortion, no paraphrasing. Maintain exact spelling, spacing, and symbols.

CONTENT TO RENDER ON DOCUMENT:
${contentToVisualize}

VISUAL STYLE:
- Professional, clean, flat-lay document scan
- High-resolution (very sharp text)
- Neutral lighting, no shadows or glare
- White or lightly-tinted paper texture
- Realistic printing style (not handwritten, not stylized)
- Straight top-view angle (avoid skew)

ADDITIONAL REQUIREMENTS:
- Preserve exact structure (headings, lines, labels, paragraphs)
- Use proper alignment and spacing to mimic an official printed document
- Avoid adding extra text, logos, icons, or watermarks
- Do not crop or hide any part of the text

`;

        // 1. Generate Image (Base64)
        const base64Image = await generateImage(prompt);

        // 2. Convert to Buffer
        const buffer = Buffer.from(base64Image, 'base64');

        // 3. Ensure Directory Exists
        const generatedDir = path.join(process.cwd(), 'uploads', 'generated');
        if (!fs.existsSync(generatedDir)) {
            fs.mkdirSync(generatedDir, { recursive: true });
        }

        // 4. Write to File
        const filename = `${generateUUID()}.png`;
        const filePath = path.join(generatedDir, filename);
        fs.writeFileSync(filePath, buffer);

        // 5. Construct URL (Relative)
        const imageUrl = `/uploads/generated/${filename}`;

        // 6. Save to Database
        await ImageResult.create({
            ocrId: ocrRecord._id,
            imageUrl: imageUrl,
            prompt: prompt
        });

        sendSuccess(res, 'Image generated and saved successfully', {
            imageUrl: imageUrl,
            prompt: prompt
        });

    } catch (error) {
        next(error);
    }
};
