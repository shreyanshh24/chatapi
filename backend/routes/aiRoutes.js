// routes/aiRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

/**
 * POST /api/ai/chat
 * Body: { message: string, history?: [{ role: "user"|"assistant", content: string }] }
 *
 * Right now this is a dummy "AI". You can plug real Gemini/OpenAI here.
 */
router.post("/chat", auth, async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    // 👉 PLACEHOLDER: here is where you'd call real AI
    // Example "fake intelligence":
    const lastUserLine = message.slice(0, 200);

    const reply = `You said: "${lastUserLine}". I'm a demo AI — wire me up to real Gemini/OpenAI in /routes/aiRoutes.js.`;

    return res.json({ reply });
  } catch (err) {
    console.error("AI route error", err);
    return res.status(500).json({ error: "AI server error" });
  }
});

module.exports = router;
