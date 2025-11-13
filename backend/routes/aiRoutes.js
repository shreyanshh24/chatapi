const express = require('express');
const router = express.Router();

router.post('/reply', async (req, res) => {
  const { prompt } = req.body;
  // very simple stub response
  const reply = `Stub reply to: "${prompt}". (Replace with Gemini API later)`;
  res.json({ text: reply });
});

module.exports = router;