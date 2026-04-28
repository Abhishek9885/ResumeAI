import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    
    try {
        console.log("Listing models...");
        // The API might have changed, checking documentation/typical usage
        // Usually we don't have a direct listModels in the JS SDK that is easy to call without a specific client
        // But we can try to hit the endpoint directly if needed.
        // For now, let's just try the most common model names.
        
        const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 'gemini-2.0-flash-exp'];
        for (const m of models) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                await model.generateContent("test");
                console.log(`✅ ${m} is available`);
            } catch (e) {
                console.log(`❌ ${m} failed: ${e.message}`);
            }
        }
    } catch (err) {
        console.error(err);
    }
}

listModels();
