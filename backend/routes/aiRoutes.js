// routes/aiRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Message = require("../models/Message");

/**
 * POST /api/ai/chat
 * Body: { message: string, history?: [{ role: "user"|"assistant", content: string }] }
 */
router.post("/chat", auth, async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Convert history to Gemini format
    // Gemini expects: { role: "user" | "model", parts: [{ text: "..." }] }
    const chatHistory = history.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: chatHistory,
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const reply = response.text();

    // Save User Message
    if (req.body.conversationId) {
      await Message.create({
        conversationId: req.body.conversationId,
        sender: req.user._id,
        text: message,
      });

      // Save AI Message
      // Use a fixed ObjectId for Gemini AI to satisfy Mongoose schema
      const GEMINI_ID = "507f1f77bcf86cd799439011";
      await Message.create({
        conversationId: req.body.conversationId,
        sender: GEMINI_ID,
        text: reply,
      });
    }

    return res.json({ reply });
  } catch (err) {
    console.error("AI route error", err);
    return res.status(500).json({ error: "AI server error" });
  }
});

/**
 * POST /api/ai/clone
 * Body: { message: string, history?: [] }
 * Mimics the user's style based on their recent sent messages.
 */
router.post("/clone", auth, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    const userId = req.user._id; // from auth middleware

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    // 1. Fetch user's recent style examples
    // We want messages SENT by this user, to anyone, recently.
    let styleExamples = "";

    // Privacy Check: Only fetch messages if enabled
    if (req.user.isCloneEnabled) {
      const recentMessages = await Message.find({ sender: userId })
        .sort({ createdAt: -1 })
        .limit(20)
        .select("text");

      styleExamples = recentMessages
        .map((m) => `- ${m.text}`)
        .reverse()
        .join("\n");
    }

    // 2. Construct System Prompt
    const systemInstruction = `
You are an AI Clone of the user. Your goal is to mimic their communication style, personality, and tone exactly.

## Core Instructions
1. **Analyze the Examples**: Look closely at the "User Style Examples" provided below. Pay attention to:
   - **Length**: Do they write short, punchy lines or long paragraphs?
   - **Capitalization**: Do they use proper caps, all lowercase, or mixed?
   - **Punctuation**: Do they use periods? Exclamations? Ellipses?
   - **Slang/Vocab**: What specific words or abbreviations do they use?
   - **Tone**: Are they casual, formal, sarcastic, enthusiastic, or dry?

2. **Mimic, Don't Caricature**: Adopt the style naturally.

3. **Context**: You are the user.

## User Style Examples (Dynamic Context)
${styleExamples || "(No previous messages found or privacy mode enabled. Be casual and brief.)"}

## Your Response
Reply to the last message in the conversation, strictly adhering to the persona defined above.
`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction,
    });

    // 3. Convert history to Gemini format
    const chatHistory = history.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: chatHistory,
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const reply = response.text();

    // Save User Message
    if (req.body.conversationId) {
      await Message.create({
        conversationId: req.body.conversationId,
        sender: userId,
        text: message,
      });

      // Save AI Clone Message
      // Use a fixed ObjectId for AI Clone
      const CLONE_ID = "507f1f77bcf86cd799439012";
      await Message.create({
        conversationId: req.body.conversationId,
        sender: CLONE_ID,
        text: reply,
      });
    }

    return res.json({ reply });
  } catch (err) {
    console.error("AI Clone route error", err);
    return res.status(500).json({ error: "AI Clone server error" });
  }
});

module.exports = router;
