// routes/aiRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { GoogleGenerativeAI } = require("@google/generative-ai");

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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

    return res.json({ reply });
  } catch (err) {
    console.error("AI route error", err);
    return res.status(500).json({ error: "AI server error" });
  }
});

module.exports = router;
