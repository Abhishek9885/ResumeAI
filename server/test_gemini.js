import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

async function testGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('No API key found in .env');
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = 'gemini-1.5-flash'; // Trying 1.5 flash as a fallback/test
    console.log(`Testing Gemini with model: ${modelName}...`);
    
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, are you working?");
        console.log('✅ Response received:');
        console.log(result.response.text());
    } catch (err) {
        console.error('❌ Gemini test failed:');
        console.error(err.message);
    }
}

testGemini();
