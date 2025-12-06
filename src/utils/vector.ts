import { Index } from "@upstash/vector";
import dotenv from 'dotenv';
import { logger } from './logger';

dotenv.config();

const url = process.env.UPSTASH_VECTOR_REST_URL;
const token = process.env.UPSTASH_VECTOR_REST_TOKEN;

if (!url || !token) {
    logger.warn("Upstash Vector credentials missing. RAG features will fail.");
}

export const vectorIndex = new Index({
    url: url || "",
    token: token || "",
});
