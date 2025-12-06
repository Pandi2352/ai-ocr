import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { logger } from './logger';
import fs from 'fs';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    logger.warn('GEMINI_API_KEY is not set. AI features will fail.');
}

const genAI = new GoogleGenerativeAI(apiKey || '');
const fileManager = new GoogleAIFileManager(apiKey || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

/**
 * Uploads a file to Gemini File API
 */
export const uploadFileToGemini = async (path: string, mimeType: string) => {
    try {
        const uploadResult = await fileManager.uploadFile(path, {
            mimeType,
            displayName: path,
        });
        logger.info(`Uploaded file to Gemini: ${uploadResult.file.uri}`);
        return uploadResult.file;
    } catch (error: any) {
        logger.error(`Error uploading file to Gemini: ${error.message}`);
        throw error;
    }
};

/**
 * Generates content from text + optional file parts
 */
export const generateMultimodalContent = async (prompt: string, fileData?: { mimeType: string; fileUri: string }) => {
    try {
        const parts: any[] = [{ text: prompt }];

        if (fileData) {
            parts.push({
                fileData: {
                    mimeType: fileData.mimeType,
                    fileUri: fileData.fileUri,
                },
            });
        }

        const result = await model.generateContent(parts);
        const response = await result.response;
        return response.text();
    } catch (error: any) {
        logger.error(`Error generating content: ${error.message}`);
        throw error;
    }
};

// ... (previous code)

export const generateText = async (prompt: string): Promise<string> => {
    return generateMultimodalContent(prompt);
};

/**
 * Generates embeddings for a given text.
 * @param text The text to embed.
 * @returns An array of numbers representing the embedding.
 */
export const generateEmbeddings = async (text: string): Promise<number[]> => {
    try {
        // Use a model specifically for embeddings
        const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await embeddingModel.embedContent(text);
        return result.embedding.values;
    } catch (error: any) {
        logger.error(`Error generating embeddings: ${error.message}`);
        throw error;
    }
};

/**
 * Generates an image based on a text prompt.
 * @param prompt The prompt to generate the image from.
 * @returns Base64 string of the generated image.
 */
export const generateImage = async (prompt: string): Promise<string> => {
    try {
        // Use the image generation model
        // Note: As of now, image generation might require using the 'imagen-3.0-generate-001' model or similar
        // if 'gemini-2.5-flash-image-preview' is not available in this SDK version.
        // We stick to user request but ensure error handling is robust.
        const imageModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });

        const result = await imageModel.generateContent(prompt);
        const response = await result.response;

        if (!response.candidates || response.candidates.length === 0) {
            throw new Error("No candidates returned");
        }

        // Iterate through all parts to find the image
        for (const candidate of response.candidates) {
            if (candidate.content && candidate.content.parts) {
                for (const part of candidate.content.parts) {
                    // @ts-ignore
                    if (part.inlineData && part.inlineData.data) {
                        // @ts-ignore
                        return part.inlineData.data;
                    }
                }
            }
        }

        // If we reach here, no image was found. Log the structure for debugging.
        logger.error(`Image generation response structure: ${JSON.stringify(response, null, 2)}`);
        throw new Error("No image data found in response");

    } catch (error: any) {
        logger.error(`Error generating image: ${error.message}`);
        throw error;
    }
};

