// ... (Existing Prompts)

export const ENRICHMENT_PROMPT = `
You are an expert content analyzer and information architect. Your task is to visualize the core structure and key concepts of the provided document using a **Mermaid.js Mindmap**.

**Objective**: Create a "Modern Mindmap" that maps out the central theme, main branches (key topics), and sub-branches (details/evidence).

**Instructions**:
1.  **Analyze**: Understand the central thesis and hierarchical structure of the content.
2.  **Generate Mermaid Code**: Output valid Mermaid \`mindmap\` syntax.
    *   Start with \`mindmap\` keyword.
    *   Use appropriate indentation for hierarchy.
    *   Root node should be the Document Title or Main Topic.
    *   Keep node labels concise (1-4 words preferred).
    *   Use icons if possible (e.g., \`(icon)\` syntax if supported/relevant, or just clean terminology).
    *   **Style**: Aim for a balanced, radial or hierarchical structure that is easy to read.

**Example Output**:
\`\`\`mermaid
mindmap
  root((Central Topic))
    Origin
      Long history
      Popularization
    Key Features
      Feature A
      Feature B
    Benefits
      Efficiency
      Clarity
\`\`\`

**Output Format**:
Return a JSON object strictly following this structure. Do NOT wrap it in markdown code blocks like \`\`\`json ... \`\`\`, just return the raw JSON object string.

{
  "mermaid": "mindmap\\n  root((...))"
}
`;

export const PDF_EXTRACTION_PROMPT = `**Objective:** Perform a comprehensive extraction and analysis of the provided document, including all textual content and detailed image interpretation.
**Instructions:**

1.  **Text Extraction:** Extract all textual content from the document. Preserve the logical flow and paragraph structure as much as possible.
2.  **Image Analysis (If any images are present):**
    *   **Identify & Locate:** Explicitly state if images are present and briefly describe their general location or context within the document flow (e.g., "Image found after paragraph 3," "Image depicting a bar chart in section 2").
    *   **Detailed Description:** Provide a thorough visual description of each image's content. What does it depict? Include objects, people, scenes, colors, and overall composition.
    *   **Text within Image (OCR):** Transcribe *any* text visible within the image accurately.
    *   **Data Extraction (If applicable):** If the image is a chart, graph, table, or diagram, extract the data it presents in a structured format (e.g., use markdown tables or lists). Clearly label the data.
    *   **Contextual Relevance:** Explain the purpose of the image and how it relates to the surrounding text or the document's overall message. What information does it add or illustrate?
3.  **Document Summary:** Provide a concise summary covering the main points, key findings, and overall purpose of the document, integrating insights from both text and images.

**Output Format:**
*   Present the extracted text first.
*   Follow with a clearly marked "Image Analysis" section, addressing each image systematically using the points above. If no images, state "No images found."
*   Conclude with the "Document Summary" section.
*   **Strict Constraint:** Do *not* include any introductory phrases (e.g., "Okay, here are...") or concluding remarks outside of the requested content. Start directly with the extracted text.`;

export const IMAGE_CONTEXT_PROMPT = `Analyze the uploaded image in detail. Provide a comprehensive description covering the following aspects:

1.  **Main Subject & Scene:** What is the primary focus? Describe the overall scene or environment.
2.  **Objects & Elements:** Identify and list all significant objects, items, and elements visible. Be specific about their characteristics (color, shape, condition).
3.  **People/Animals:** If present, describe their appearance (clothing, age estimation, species), expressions, actions, and potential interactions.
4.  **Setting & Background:** Describe the location (indoors/outdoors, type of place), time of day (if discernible), and background details.
5.  **Text:** Extract any visible text verbatim. Note its location and apparent purpose (e.g., sign, label, logo).
6.  **Composition & Style:** Describe the colors, lighting, camera angle/perspective, and overall visual style (e.g., photograph, illustration, realistic, abstract).
7.  **Atmosphere & Mood:** What is the overall feeling or mood conveyed by the image?
8.  **Inferences & Context:** Based on the visual evidence, what can be inferred about the situation, the purpose of the image, or the relationships between elements?

Provide as much detail as possible for each point.`;

export const AUDIO_CONTEXT_PROMPT = `Analyze the uploaded audio file in detail. Provide a comprehensive description covering the following aspects:

1.  **Audio Type & Summary:** Briefly describe the overall type of audio (e.g., conversation, monologue, music, ambient sounds, mixed) and summarize its main content or purpose.
2.  **Speech Content (Transcription):** If speech is present, transcribe the spoken words as accurately as possible.
3.  **Speaker Details:** If speech is present, identify:
    *   The number of distinct speakers.
    *   Perceived characteristics for each speaker (if possible): gender, approximate age range, accent, emotional tone (e.g., happy, angry, sad, neutral).
    *   The language(s) being spoken.
4.  **Music Details:** If music is present:
    *   Describe the type or genre (e.g., classical, rock, electronic, background score).
    *   Identify prominent instruments (if discernible).
    *   Describe the tempo and mood (e.g., fast/slow, upbeat/somber).
    *   Is it background or foreground music?
5.  **Sound Effects & Ambience:** Identify:
    *   Specific non-speech, non-music sounds (e.g., car horn, door slam, typing, birdsong).
    *   The overall background ambience or soundscape (e.g., quiet room, busy street, nature, office).
6.  **Technical Aspects:** Comment on the perceived audio quality (e.g., clear, muffled, noisy, distorted) and recording environment (e.g., studio, outdoors, phone call).
7.  **Overall Mood & Atmosphere:** What is the overall feeling or mood conveyed by the audio?

Provide as much detail as possible for each applicable point.`;

export const VIDEO_CONTEXT_PROMPT = `Analyze the uploaded video file in detail. Provide a comprehensive description covering the following aspects from beginning to end:

1.  **Overall Summary & Type:** Briefly describe the type of video (e.g., movie clip, tutorial, vlog, news report, music video, animation, advertisement, home video) and provide a concise summary of its main content, subject, or narrative.
2.  **Visual Scene Description:**
    *   **Settings/Locations:** Describe the environment(s) shown. Note any scene changes.
    *   **Main Subjects:** Identify the primary people, animals, or objects of focus. Describe their appearance.
    *   **Key Actions & Events:** Describe the main actions performed by subjects and significant events that occur throughout the video.
    *   **Objects & Elements:** List notable objects present in the scenes.
    *   **Visible Text:** Extract any significant text visible (e.g., titles, captions, signs, on-screen graphics). Note when and where it appears.
3.  **Audio Content Analysis:**
    *   **Speech:** If speech is present, transcribe key dialogue or summarize spoken content.
    *   **Speakers:** Identify the number of distinct speakers (if possible) and any perceived characteristics (gender, tone, emotion, language).
    *   **Music:** Describe any background or foreground music (genre, tempo, mood, prominent instruments if discernible). Does it change?
    *   **Sound Effects & Ambience:** Identify significant sound effects and describe the background ambient sounds.
4.  **Cinematography & Style:**
    *   **Camera Work:** Describe camera angles, shots (close-up, wide shot), and movements (pan, tilt, zoom, static, handheld).
    *   **Editing:** Comment on the pacing, cuts, transitions (if noticeable).
    *   **Color & Lighting:** Describe the overall color palette and lighting style (e.g., bright, dark, natural, artificial).
    *   **Visual Style:** Is it realistic, animated, stylized, etc.?
5.  **Overall Mood & Atmosphere:** Describe the overall feeling or mood conveyed by the video, considering both visual and audio elements. Does the mood change?
6.  **Inferences & Potential Purpose:** Based on all elements, what can be inferred about the context, the message, the relationships between subjects, or the intended purpose/audience of the video?

Provide as much detail as possible, noting changes or developments as the video progresses.`;

export const META_JSON_PROMPT = `
*** FINAL OUTPUT REQUIREMENT ***

After performing the analysis requested above, you MUST append a valid JSON object strictly following this structure at the very end of your response:

\`\`\`json
{
  "title": "A short, descriptive title for the content",
  "description": "A concise summary (1-2 sentences) of the content",
  "thumbnail": "A visual description of what a perfect thumbnail for this content would look like"
}
\`\`\`

The main analysis should be free text as requested. The JSON should be at the end.
`;
