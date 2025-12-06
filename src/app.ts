import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { requestLogger } from './middlewares/requestLogger';
import { errorMiddleware } from './middlewares/exception.middleware';
import healthRoute from './routes/health.route';
import aiRoute from './routes/ai.route';
import ocrRoute from './routes/ocr.route';
import entityRoute from './routes/entity.route';
import summaryRoute from './routes/summary.route';
import formRoute from './routes/form.route';
import { swaggerOptions } from './config/swagger';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// Routes
app.use('/health', healthRoute);
app.use('/api/ai', aiRoute);
app.use('/api/ocr', ocrRoute);
app.use('/api/entities', entityRoute);
app.use('/api/summary', summaryRoute);
app.use('/api/forms', formRoute);

// Swagger
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Error Handling
app.use(errorMiddleware);

export default app;
