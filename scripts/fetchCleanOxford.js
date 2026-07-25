import fs from 'fs';

async function fetchCleanData() {
  console.log('Fetching Oxford 5000 clean data from github...');
  const res = await fetch('https://raw.githubusercontent.com/winterdl/oxford-5000-vocabulary-audio-definition/main/data/oxford_5000.json');
  const rawData = await res.json();
  
  const vocabList = [];
  
  // rawData is an object like {"0": {word: "a", type: "article", cefr: "a1", ...}, "1": ...}
  for (const key of Object.keys(rawData)) {
    const item = rawData[key];
    
    // Some items might be empty or missing word
    if (!item || !item.word) continue;
    
    // Normalize word
    let word = item.word.trim();
    // Some words might have a number at the end, but this dataset looks clean
    
    // Map to our expected format
    vocabList.push({
      word: word,
      pos: item.type ? item.type.trim() : '',
      level: item.cefr ? item.cefr.toUpperCase().trim() : 'Unknown'
    });
  }
  
  console.log(`Successfully mapped ${vocabList.length} items.`);
  
  // Write to public folder
  fs.writeFileSync('public/oxford_5000.json', JSON.stringify(vocabList, null, 2));
  console.log('Saved to public/oxford_5000.json');
}

fetchCleanData().catch(console.error);
