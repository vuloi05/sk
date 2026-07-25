import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || 'YOUR_API_KEY';
const genAI = new GoogleGenerativeAI(apiKey);

async function testModel(modelName) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('Translate "apple" to Vietnamese.');
    console.log(`[${modelName}] Success:`, result.response.text().trim());
  } catch (e) {
    console.log(`[${modelName}] Failed:`, e.message);
  }
}

async function run() {
  await testModel('gemini-3.1-flash-lite');
  await testModel('gemini-1.5-flash');
  await testModel('gemini-2.5-flash');
}
run();
