export const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'OCR Backend API',
            version: '1.0.0',
            description: 'A sample Express.js API built with TypeScript and Swagger',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Local server',
            },
        ],
    },
    // Path to the API docs
    apis: ['./src/routes/*.ts', './src/routes/**/*.ts'],
};
