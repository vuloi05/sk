const fs = require('fs');
const pdfParse = require('pdf-parse');

const pdfPath = 'c:/sk/pdf/The_Oxford_5000_by_CEFR_level.pdf';

async function parse() {
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdfParse(dataBuffer);

  const lines = data.text.split('\n');
  const vocabList = [];
  let currentLevel = 'Unknown';
  const levelRegex = /^(A1|A2|B1|B2|C1|C2)$/;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Check if line is a level header
    if (levelRegex.test(line)) {
      currentLevel = line;
      continue;
    }

    // Skip headers/footers
    if (line.includes('Oxford 5000') || line.includes('CEFR level') || line.includes('© Oxford University Press') || /^\d+\s*\/\s*\d+$/.test(line)) {
      continue;
    }

    // Typical format: "abandon v." or "absolutely adv."
    // We can extract the word and POS
    const match = line.match(/^([a-zA-Z\-\']+)\s+(.+)$/);
    if (match) {
      const word = match[1];
      const pos = match[2];
      vocabList.push({ word, pos, level: currentLevel });
    } else {
      // If no pos, just the word
      if (/^[a-zA-Z\-\']+$/.test(line)) {
        vocabList.push({ word: line, pos: '', level: currentLevel });
      }
    }
  }

  console.log(`Parsed ${vocabList.length} words.`);
  // write first 20 for preview
  console.log(vocabList.slice(0, 10));
  fs.writeFileSync('c:/sk/src/data/oxford_5000.json', JSON.stringify(vocabList, null, 2));
}

parse().catch(console.error);
