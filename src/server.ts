import 'dotenv/config';
import app from './app';
import { connectDB } from './config/db';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
            logger.info(`Swagger docs available at http://localhost:${PORT}/api/docs`);
        });
    } catch (error: any) {
        logger.error(`Error starting server: ${error.message}`);
        process.exit(1);
    }
};

startServer();
