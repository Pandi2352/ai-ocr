# AI-Powered OCR & Document Intelligence Platform

A state-of-the-art document analysis system that leverages Generative AI (Google Gemini) to transform static documents into structured data, actionable insights, and visual knowledge graphs.

![Application Preview](https://via.placeholder.com/800x400?text=AI+OCR+Platform+Dashboard+Preview)

## 🚀 Key Features

### 1. Intelligent OCR & Analysis
*   **Beyond Text**: Goes far beyond traditional OCR by understanding context, layout, and semantics.
*   **Multi-Format Support**: Handles PDFs, Images (JPG, PNG), Word Docs, and more.
*   **Executive Summaries**: Automatically generates concise, human-readable summaries of complex documents.
*   **Deep Analysis**: Provides detailed, section-by-section breakdown and analysis of document content.

### 2. Advanced Entity Extraction
*   **Flexible Extraction**: Define *exactly* what you want to extract (e.g., "Invoice Number", "Date", "Line Items").
*   **JSON Schema Support**: Use advanced JSON schemas to extract complex, nested data structures (e.g., arrays of objects) with strict typing.
*   **Structured Output**: Returns clean, machine-readable JSON ready for API integration.

### 3. Visual Knowledge Graph (Mindmap)
*   **Instant Visualization**: Automatically converts document concepts into a Mermaid.js mindmap.
*   **Interactive View**: Explore relationships and hierarchies visually.
*   **Expansion Mode**: Full-screen modal view for navigating large, complex diagrams.

### 4. Intelligent Document Comparison
*   **Diff Analysis**: Compare two versions of a document to highlight additions, deletions, and semantic changes.
*   **Detailed Reports**: View a line-by-line breakdown of changes with severity scoring (Critical, High, Medium, Low).
*   **Visual Diff**: Color-coded side-by-side view (Coming Soon) and detailed table modal.

### 5. Smart Form Filling
*   **Auto-Fill**: Automatically extracts data from documents to populate complex forms.
*   **Split-View UI**: Verified extraction values against the source document in a convenient split-pane interface.
*   **Editable JSON**: Support for complex array editing (e.g., Education History, Work Experience) directly in the UI.

### 6. RAG (Retrieval-Augmented Generation)
*   **Contextual Intelligence**: Enrich extraction results with broader context using RAG pipelines.
*   **Status Tracking**: Real-time monitoring of RAG processing steps (Upload -> Visual -> Enrich -> RAG).

### 5. Modern User Interface
*   **Dark Mode Aesthetic**: sleek, professional UI designed for data density and readability.
*   **Real-time Updates**: Live status badges and progress monitoring.
*   **Responsive**: Fully responsive layout optimized for desktop and tablet data review.

## 🛠️ Technology Stack

### Frontend
*   **Framework**: React 18 (Vite)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS (with `tailwindcss-animate`)
*   **Visualization**: Mermaid.js (for diagrams), Lucide React (icons)
*   **State/API**: Axios, Custom Hooks

### Backend
*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Database**: MongoDB (Mongoose)
*   **AI Model**: Google Gemini 1.5 Flash (via Google AI Studio)
*   **File Processing**: Multer, Mammoth (Docx), PDF-Parse

## ⚡ Quick Start

### Prerequisites
*   Node.js (v18+)
*   MongoDB (Local or Atlas)
*   Google Gemini API Key

### 1. Backend Setup

```bash
# Clone the repository
git clone <repo-url>
cd ocr

# Install dependencies
npm install

# Configure Environment
# Create a .env file based on .env.example
cp .env.example .env

# Start the server (Development)
npm run dev
```

**Required `.env` Variables:**
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ai-ocr
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Frontend Setup

```bash
# Navigate to UI directory
cd ui

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

## 📖 Usage Guide

### Upload & Analyze
1.  Navigate to the **OCR** tab.
2.  Click **"Upload Document"** and select a file.
3.  Watch as the system processes the file in real-time (Upload -> Visual -> Enrich).

### Extract Data (Entity View)
1.  Go to the **Entities** tab.
2.  Select a processed document.
3.  **Simple Mode**: Enter fields like `Invoice No, Date, Total`.
4.  **JSON Mode**: Paste a JSON schema for complex extraction:
    ```json
    {
      "items": [
        { "name": "string", "price": "number" }
        ]
    }
    ```
5.  Click **"Extract"** to get structured data.

### Compare Documents
1.  Go to the **Comparison** tab.
2.  Select a "Source" (Original) and "Target" (New) document from your processed files.
3.  Click **"Run Comparison"**.
4.  View the high-level summary cards (Similarity Score, Additions, Deletions).
5.  Click **"View Detailed Difference Report"** to see a full table of changes.

### Smart Forms
1.  Go to the **Smart Forms** tab.
2.  Select a document to auto-fill data from.
3.  Define your Target Schema (or use the default example).
4.  Click **"Auto-Fill Form"**.
5.  Review the generated form on the right. Edit fields as needed—even complex lists like "Education" have dedicated, editable cards!

## 🤝 Contributing
Contributions are welcome! Please fork the repository and submit a pull request.
