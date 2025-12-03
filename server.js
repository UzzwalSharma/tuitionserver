import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from "@google/generative-ai";

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Gemini Setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// AI Test Generation Route
app.post("/ai-test-generator", async (req, res) => {
  try {
    const { subject, chapter, duration } = req.body;

    if (!subject || !chapter) {
      return res.status(400).json({ error: "Subject and Chapter are required" });
    }

    const systemPrompt = `
You are an Expert Question Paper Generator for Class 6 CBSE students.

**CRITICAL FORMATTING RULES - FOLLOW EXACTLY:**

1. **Section Headers:** Use bold with clear numbering
   Format: **Section A: Multiple Choice Questions (1 mark each)**

2. **Question Numbers:** Use bold with "Question" prefix
   Format: **Question 1.** or **Question 2.**
   NOT: 1. or Q1 or just numbers

3. **MCQ Options:** Use letters in parentheses
   Format: 
   (a) option text
   (b) option text
   (c) option text
   (d) option text

4. **Marks Indication:** Show marks clearly in section headers
   Example: **(2 marks each)** or **(5 marks)**

5. **Spacing:** Add ONE blank line between questions
   Add TWO blank lines between sections

6. **Question Format Examples:**

**Section A: Multiple Choice Questions (1 mark each)**

**Question 1.** What is the capital of India?
(a) Mumbai
(b) Delhi
(c) Kolkata
(d) Chennai

**Question 2.** The sun rises in the:
(a) North
(b) South
(c) East
(d) West

**Section B: Short Answer Questions (2 marks each)**

**Question 3.** Define photosynthesis. Write its importance.

**Question 4.** What are the three states of matter? Give one example of each.

**Section C: Long Answer Questions (5 marks each)**

**Question 5.** Explain the water cycle with a diagram description. Name all the processes involved.

**Question 6.** A car travels 120 km in 2 hours. Calculate its speed. If it continues at the same speed, how far will it travel in 5 hours? Show all working.

**IMPORTANT GUIDELINES:**
- Use simple, clear language suitable for Class 6 students
- Make questions age-appropriate and not too difficult
- Include variety: definitions, examples, calculations, explanations
- For math questions, use round numbers and simple calculations
- Add "Show your working" or "Explain your answer" where needed
- Total marks should match typical exam patterns
- Use encouraging language in questions
`;

    const userPrompt = `
Generate a Class 6 predicted question paper.

Subject: ${subject}
Chapter: ${chapter}
Time Duration: ${duration || 60} minutes

Follow the latest exam pattern.
Use Google Search for chapter details & important questions.
Create balanced easy/medium/hard questions.
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      tools: { google_search: {} }
    });

     const result = await model.generateContent({
      contents: [
        {
          parts: [{ text: systemPrompt }]
        },
        {
          parts: [{ text: userPrompt }]
        }
      ]
    });

    const text = result.response.text();
    return res.json({ paper: text });

  } catch (error) {
    console.error("Gemini API Error:", error);

    if (error instanceof GoogleGenerativeAIFetchError) {
      return res.status(500).json({
        error: "Gemini API Fetch Error, check your API key or internet",
      });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
});

// Start Server
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
