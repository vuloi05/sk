import fs from 'fs';
import translate from 'google-translate-api-x';

async function buildDict() {
  console.log('Reading oxford_5000.json...');
  const data = JSON.parse(fs.readFileSync('public/oxford_5000.json', 'utf8'));
  
  const CHUNK_SIZE = 100;
  let translatedData = [];

  console.log(`Starting translation of ${data.length} words in chunks of ${CHUNK_SIZE}...`);

  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    // Prepare an array of strings to translate. We can just translate the word itself.
    const wordsToTranslate = chunk.map(w => w.word);
    
    try {
      const results = await translate(wordsToTranslate, { from: 'en', to: 'vi' });
      
      // Merge results
      for (let j = 0; j < chunk.length; j++) {
        // google-translate-api-x returns an array if input was an array
        const translatedText = Array.isArray(results) ? results[j].text : results.text;
        
        translatedData.push({
          ...chunk[j],
          vi: translatedText.toLowerCase()
        });
      }
      
      console.log(`Translated ${Math.min(i + CHUNK_SIZE, data.length)} / ${data.length} words...`);
      
      // Small delay to prevent rate limits
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.error(`Error at chunk ${i}:`, err.message);
      // Fallback: just put the english word if it fails
      for (let j = 0; j < chunk.length; j++) {
        translatedData.push({
          ...chunk[j],
          vi: chunk[j].word // fallback
        });
      }
      // Wait longer on error
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  console.log('Writing to oxford_5000_vi.json...');
  fs.writeFileSync('public/oxford_5000_vi.json', JSON.stringify(translatedData, null, 2));
  console.log('Done!');
}

buildDict();
