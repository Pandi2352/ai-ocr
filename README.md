# Intelligent Multimodal OCR & Content Analysis Service

A powerful backend service built with Node.js, Express, and Google Gemini AI that goes beyond traditional OCR. It analyzes text, documents (PDF, DOCX), images, audio, and video files to extract content, generate structured metadata, and create visual mindmaps.

## 🚀 Key Features

- **Multimodal Analysis**: extracts text and insights from:
  - **Documents**: PDF, DOCX, TXT, CSV
  - **Images**: JPG, PNG, WEBP (includes scene description & text extraction)
  - **Audio**: MP3, WAV (transcription & summary)
  - **Video**: MP4 (scene breakdown, speech analysis, summary)
- **Background Enrichment**:
  - **Mermaid.js Mindmaps**: Automatically generates structured mindmaps representing the core content of the document.
  - **Named Entity Extraction**: Extracts specific data (like Names, Dates, IDs) into structured JSON with **snake_case** keys. Support for both automatic detection and user-specified fields.
  - **Document Summarization**: Generates comprehensive summaries via API. Supports both automatic default summaries and user-guided summaries via custom prompts.
  - **Auto-filling Forms**: "Smart Mapper" that takes a target JSON schema (e.g., from a KYC form) and intelligently maps extracted content to it, transforming formats as needed.
  - **RAG Chatbot**: Chat with your documents. Supports "Single Turn Search" (Direct Q&A) and "Multi-Turn Chat" (Conversational with history). Includes **Lazy Ingestion** (auto-indexing).
  - **Image Generation**: Generates a high-quality photorealistic image of the document based on the extracted content (e.g., recreating an ID card or Invoice view). Uses advanced prompting to ensure text accuracy and legibility.
- **Asynchronous Processing**: Immediate API response with background polling for heavy tasks.
- **Robust Tracking**: Detailed status tracking (upload, visual processing, enrichment) and timing metrics.
- **Swagger Documentation**: Built-in API docs for easy testing.

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose) - Stores analysis results & metadata.
- **AI Engine**: Google Gemini 1.5 Flash (via `@google/generative-ai`)
- **Tools**:
  - `mammoth` (DOCX parsing)
  - `multer` (File uploads)
  - `swagger-jsdoc` / `swagger-ui-express` (Documentation)

## ⚙️ prerequisites

- Node.js (v18+)
- MongoDB (Local or Atlas connection string)
- Google Gemini API Key

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
    - **Development** (with hot-reload):
      ```bash
      npm run dev
      ```
    - **Production**:
      ```bash
      npm run build
      npm start
      ```

## 📖 API Documentation

Once the server is running, visit the Swagger UI for interactive documentation:

👉 **http://localhost:3000/api-docs**

### Core Endpoints

| Method   | Endpoint              | Description                                                                                    |
| :------- | :-------------------- | :--------------------------------------------------------------------------------------------- |
| **POST** | `/api/ocr/analyze`    | Upload a file for analysis. Returns an ID immediately.                                         |
| **GET**  | `/api/ocr/status/:id` | Check analysis status and retrieve results (Extraction + Mindmap + Entities).                  |
| **POST** | `/api/entities`       | Extract named entities from an existing OCR result. Supports Auto/Manual modes.                |
| **POST** | `/api/summary`        | Generate a summary. Supports Auto (comprehensive) or Manual (custom instruction) modes.        |
| **POST** | `/api/forms/fill`     | Smart Form Filling. Maps OCR content to a specific target JSON schema provided in the payload. |
| **POST** | `/api/rag/search`     | **Single-Turn Q&A**. Ask a question, get a direct answer. (Auto-indexes document).             |
| **POST** | `/api/rag/chat`       | **Multi-Turn Chat**. Conversational interface supporting history.                              |
| **POST** | `/api/image/generate` | **Generate Image**. Creates a visual representation of the document based on OCR data.         |
| **GET**  | `/api/ocr/list`       | List all processed files with pagination.                                                      |
| **POST** | `/api/ai/generate`    | (Test) Simple text generation with Gemini.                                                     |
| **GET**  | `/health`             | Server health check.                                                                           |

## 🧩 How It Works

1.  **Upload**: User uploads a file to `/api/ocr/analyze`.
2.  **Visual Processing (Sync)**:
    - Server identifies file type.
    - **Docs**: Text is extracted natively.
    - **Media**: File is uploaded to Gemini for multimodal understanding.
    - **LLM Pass 1**: Extracts structured content, metadata (Title, Description, Thumbnail prompt), and raw analysis.
3.  **Response**: Server returns `200 OK` with the Record ID and initial analysis.
4.  **Enrichment (Async Background)**:
    - Server stays alive in background.
    - **Mindmap Generation**: LLM analyzes the extracted content to generate a valid Mermaid.js mindmap syntax.
    - Updates the database record with the mindmap string.
5.  **Polling**: Client polls `/api/ocr/status/:id` until `status.enrichment` is `SUCCESS` to get the full result.
6.  **Entity Extraction (On-Demand)**:
    - Call `/api/entities` with `ocrId`.
    - **Auto Mode**: Send just `ocrId` -> AI detects keys (e.g., `candidate_name`, `invoice_date`).
    - **Manual Mode**: Send `ocrId` + `fields: ["Father Name", "DOB"]` -> AI extracts specific values into snake_case keys (`father_name`, `dob`).
    - Results are saved to both the `EntityResult` collection and the `OCRResult` document.
7.  **Document Summarization (On-Demand)**:
    - Call `/api/summary` with `ocrId`.
    - **Auto Mode**: Send just `ocrId` -> AI generates a detailed standard summary.
    - **Manual Mode**: Send `ocrId` + `prompt: "Summarize as a tweet"` -> AI follows your specific instruction.
    - Results are saved to both the `SummaryResult` collection and the `OCRResult` document.
8.  **Auto-filling Forms (On-Demand)**:
    - Call `/api/forms/fill` with `ocrId` and a strict `schema` object (e.g., `{ "full_name": "String", "dob": "DD-MM-YYYY" }`).
    - AI extracts the data, transforms values to match your specific formats (e.g., standardizing dates), and reports any missing fields.
    - Results are saved to the `FormResult` collection _only_ (keeping your form data separate).
9.  **RAG Chatbot (Conversational Search)**:
    - **Smart Search**: Call `/api/rag/search` with `{ "question": "..." }`.
    - **Conversational**: Call `/api/rag/chat` with `{ "question": "...", "history": [...] }`.
    - **Lazy Ingestion**: If the document hasn't been indexed in the Vector DB yet, the system automatically chunks and indexes it before answering. No manual setup required.
10. **Image Generation (Visual Reconstruction)**:
    - Call `/api/image/generate` with `{ "ocrId": "..." }`.
    - AI analyzes the document content (and any extracted entities) to construct a highly specific prompt.
    - Generates a photorealistic image mirroring the document's data.
    - Saves the image to the server (`uploads/generated/`) and returns the public URL.

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

PANDI SELVAM
