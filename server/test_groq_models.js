import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const modelsToTest = [
    'mixtral-8x7b-32768',
    'mixtral-8x7b',
    'llama-3.1-70b-versatile',
    'llama-3.1-8b-instant',
    'llama2-70b-4096',
    'gemma-7b-it',
];

async function testModel(model) {
    try {
        console.log(`\n🔍 Testing: ${model}`);
        const response = await groq.chat.completions.create({
            model: model,
            messages: [{ role: 'user', content: 'Say hello' }],
            max_tokens: 100,
        });
        console.log(`✅ ${model} works!`);
        return true;
    } catch (err) {
        const msg = err.message || '';
        console.log(`❌ ${model} failed: ${msg.substring(0, 100)}`);
        return false;
    }
}

async function main() {
    console.log('Testing Groq models with your API key...\n');
    const results = {};
    
    for (const model of modelsToTest) {
        results[model] = await testModel(model);
    }
    
    console.log('\n\n📊 RESULTS:');
    const working = Object.entries(results).filter(([_, works]) => works).map(([model, _]) => model);
    const failed = Object.entries(results).filter(([_, works]) => !works).map(([model, _]) => model);
    
    console.log('\n✅ Working models:');
    working.forEach(m => console.log(`  - ${m}`));
    
    console.log('\n❌ Failed models:');
    failed.forEach(m => console.log(`  - ${m}`));
    
    if (working.length > 0) {
        console.log(`\n💡 Recommendation: Use "${working[0]}" in your .env`);
    }
}

main().catch(console.error);
