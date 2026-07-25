import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

async function parseAll() {
  const files = [
    'c:/sk/pdf/The_Oxford_3000_by_CEFR_level.pdf',
    'c:/sk/pdf/The_Oxford_5000_by_CEFR_level.pdf'
  ];

  const vocabMap = new Map();
  let currentLevel = 'Unknown';
  const levelRegex = /^(A1|A2|B1|B2|C1|C2)$/;

  for (const file of files) {
    console.log(`Parsing ${file}...`);
    const dataBuffer = fs.readFileSync(file);
    const data = await pdfParse(dataBuffer);
    const lines = data.text.split('\n');

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      if (levelRegex.test(line)) {
        currentLevel = line;
        continue;
      }

      if (line.includes('Oxford 3000') || line.includes('Oxford 5000') || 
          line.includes('CEFR level') || line.includes('© Oxford University Press') || 
          /^\d+\s*\/\s*\d+$/.test(line) || line.includes('The Oxford')) {
        continue;
      }

      // Format: "abandon v." or "ability n."
      const match = line.match(/^([a-zA-Z\-\']+)\s+(.+)$/);
      if (match) {
        let word = match[1];
        const pos = match[2];
        vocabMap.set(word, { word, pos, level: currentLevel });
      } else {
        // Just the word
        if (/^[a-zA-Z\-\']+$/.test(line)) {
          vocabMap.set(line, { word: line, pos: '', level: currentLevel });
        }
      }
    }
  }

  const vocabList = Array.from(vocabMap.values());
  console.log(`Extracted ${vocabList.length} unique words.`);
  
  if (!fs.existsSync('c:/sk/src/data')) {
    fs.mkdirSync('c:/sk/src/data', { recursive: true });
  }
  
  fs.writeFileSync('c:/sk/src/data/oxford_5000.json', JSON.stringify(vocabList, null, 2));
  console.log('Saved to src/data/oxford_5000.json');
}

parseAll().catch(console.error);
