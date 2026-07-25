import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || 'YOUR_API_KEY';
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: 'gemini-3.1-flash-lite',
  generationConfig: {
    temperature: 0.2,
    responseMimeType: "application/json"
  }
});

const DATA_FILE = './public/oxford_5000_vi.json';
const CHUNK_SIZE = 50;
const DELAY_MS = 5000; // 5 seconds between chunks

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function generateExamples() {
  console.log(`Reading ${DATA_FILE}...`);
  let data = [];
  try {
    data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (err) {
    console.error("Error reading file:", err);
    process.exit(1);
  }

  // Find words that need examples
  const wordsToProcess = data.filter(w => !w.exampleEn);
  console.log(`Found ${wordsToProcess.length} words out of ${data.length} that need examples.`);

  if (wordsToProcess.length === 0) {
    console.log("All words have examples. Done!");
    return;
  }

  let processedCount = data.length - wordsToProcess.length;

  for (let i = 0; i < wordsToProcess.length; i += CHUNK_SIZE) {
    const chunk = wordsToProcess.slice(i, i + CHUNK_SIZE);
    const chunkWords = chunk.map(w => w.word);

    console.log(`\nProcessing chunk ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(wordsToProcess.length / CHUNK_SIZE)} (${chunkWords.length} words)...`);
    
    const prompt = `You are a helpful English teacher.
I will give you a list of English words.
For each word, write a very short, simple, and realistic example sentence (level A1-B1) that clearly demonstrates the meaning of the word. Then, translate that sentence into Vietnamese.

The output MUST be a JSON array of objects with the following keys:
- "word": The original word
- "exampleEn": The English example sentence
- "exampleVi": The Vietnamese translation of the example sentence

List of words to process:
${JSON.stringify(chunkWords)}`;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      let parsed = [];
      try {
        parsed = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse JSON response:", responseText);
        // Continue to next chunk
        continue;
      }

      // Merge back into original data
      for (const item of parsed) {
        const dataIndex = data.findIndex(d => d.word === item.word && !d.exampleEn);
        if (dataIndex !== -1) {
          data[dataIndex].exampleEn = item.exampleEn;
          data[dataIndex].exampleVi = item.exampleVi;
        }
      }

      processedCount += chunkWords.length;
      console.log(`Successfully generated examples for chunk. Total processed: ${processedCount}/${data.length}`);
      
      // Save periodically
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

    } catch (err) {
      console.error(`Error processing chunk starting at index ${i}:`, err.message);
    }

    if (i + CHUNK_SIZE < wordsToProcess.length) {
      console.log(`Waiting ${DELAY_MS / 1000}s before next chunk to respect rate limits...`);
      await delay(DELAY_MS);
    }
  }

  console.log("Done generating all examples!");
}

generateExamples();
