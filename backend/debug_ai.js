const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
require("dotenv").config();

async function testGemini() {
    const key = process.env.GEMINI_API_KEY;

    if (!key) {
        fs.writeFileSync('error.txt', "GEMINI_API_KEY is missing");
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(key);
        
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent("Hello");
        const response = await result.response;
        const text = response.text();
        fs.writeFileSync('error.txt', "SUCCESS with gemini-2.5-flash: " + text);
    } catch (error) {
        fs.writeFileSync('error.txt', "ERROR with gemini-2.5-flash: " + error.message);
    }
}

testGemini();
