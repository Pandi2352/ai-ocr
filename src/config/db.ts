import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ocr_db');
        logger.info(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
        logger.error(`Error: ${error.message}`);
        process.exit(1);
    }
};
