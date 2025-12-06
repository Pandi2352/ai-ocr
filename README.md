# Intelligent Multimodal OCR & Content Analysis Service

A powerful backend service built with Node.js, Express, and Google Gemini AI that goes beyond traditional OCR. It analyzes text, documents (PDF, DOCX), images, audio, and video files to extract content, generate structured metadata, and create visual mindmaps.

## 🚀 Key Features

*   **Multimodal Analysis**: extracts text and insights from:
    *   **Documents**: PDF, DOCX, TXT, CSV
    *   **Images**: JPG, PNG, WEBP (includes scene description & text extraction)
    *   **Audio**: MP3, WAV (transcription & summary)
    *   **Video**: MP4 (scene breakdown, speech analysis, summary)
*   **Background Enrichment**:
    *   **Mermaid.js Mindmaps**: Automatically generates structured mindmaps representing the core content of the document.
*   **Asynchronous Processing**: Immediate API response with background polling for heavy tasks.
*   **Robust Tracking**: Detailed status tracking (upload, visual processing, enrichment) and timing metrics.
*   **Swagger Documentation**: Built-in API docs for easy testing.

## 🛠️ Tech Stack

*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Database**: MongoDB (Mongoose) - Stores analysis results & metadata.
*   **AI Engine**: Google Gemini 1.5 Flash (via `@google/generative-ai`)
*   **Tools**:
    *   `mammoth` (DOCX parsing)
    *   `multer` (File uploads)
    *   `swagger-jsdoc` / `swagger-ui-express` (Documentation)

## ⚙️ prerequisites

*   Node.js (v18+)
*   MongoDB (Local or Atlas connection string)
*   Google Gemini API Key

## 📦 Installation & Setup

1.  **Clone the repository** (if applicable) and navigate to the directory:
    ```bash
    cd ocr
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Configuration**:
    Create a `.env` file in the root directory (copy from `.env.example`):
    ```bash
    cp .env.example .env
    ```
    
    Update the `.env` file with your credentials:
    ```env
    PORT=3000
    MONGODB_URI=mongodb://localhost:27017/ai-ocr-db
    GEMINI_API_KEY=your_google_gemini_api_key_here
    ```

4.  **Run the application**:
    *   **Development** (with hot-reload):
        ```bash
        npm run dev
        ```
    *   **Production**:
        ```bash
        npm run build
        npm start
        ```

## 📖 API Documentation

Once the server is running, visit the Swagger UI for interactive documentation:

👉 **http://localhost:3000/api-docs**

### Core Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/api/ocr/analyze` | Upload a file for analysis. Returns an ID immediately. |
| **GET** | `/api/ocr/status/:id` | Check analysis status and retrieve results (Extraction + Mindmap). |
| **GET** | `/api/ocr/list` | List all processed files with pagination. |
| **POST** | `/api/ai/generate` | (Test) Simple text generation with Gemini. |
| **GET** | `/health` | Server health check. |

## 🧩 How It Works

1.  **Upload**: User uploads a file to `/api/ocr/analyze`.
2.  **Visual Processing (Sync)**:
    *   Server identifies file type.
    *   **Docs**: Text is extracted natively.
    *   **Media**: File is uploaded to Gemini for multimodal understanding.
    *   **LLM Pass 1**: Extracts structured content, metadata (Title, Description, Thumbnail prompt), and raw analysis.
3.  **Response**: Server returns `200 OK` with the Record ID and initial analysis.
4.  **Enrichment (Async Background)**:
    *   Server stays alive in background.
    *   **Mindmap Generation**: LLM analyzes the extracted content to generate a valid Mermaid.js mindmap syntax.
    *   Updates the database record with the mindmap string.
5.  **Polling**: Client polls `/api/ocr/status/:id` until `status.enrichment` is `SUCCESS` to get the full result.

## 📂 Project Structure

```
src/
├── config/         # DB and Swagger config
├── controllers/    # Request handlers (OCR logic)
├── exceptions/     # Custom error classes
├── middlewares/    # Upload, validation, error handling
├── models/         # Mongoose schemas (OCRResult)
├── routes/         # API Route definitions
├── utils/          # Helpers (LLM, Logger, Response, Prompts)
├── app.ts          # Express App setup
└── server.ts       # Entry point
```

## 📜 License

ISC
