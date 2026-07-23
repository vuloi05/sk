/**
 * DictaFlow — KANJIDIC2 XML → JSON Parser
 * 
 * Run once: node scripts/parseKanji.js
 * Input:  kanjidic2.xml/kanjidic2.xml (15MB XML)
 * Output: public/kanji.json (~2MB optimized JSON)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_PATH = path.join(__dirname, '..', 'kanjidic2.xml', 'kanjidic2.xml');
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'kanji.json');

console.log('📖 Reading KANJIDIC2 XML...');
const xml = fs.readFileSync(INPUT_PATH, 'utf-8');

console.log('⚙️  Parsing characters...');

const kanjiMap = {};
let count = 0;

// Match each <character>...</character> block
const charRegex = /<character>([\s\S]*?)<\/character>/g;
let match;

while ((match = charRegex.exec(xml)) !== null) {
  const block = match[1];

  // Extract literal (the kanji character itself)
  const literalMatch = block.match(/<literal>(.+?)<\/literal>/);
  if (!literalMatch) continue;
  const literal = literalMatch[1];

  // Extract grade
  const gradeMatch = block.match(/<grade>(\d+)<\/grade>/);
  const grade = gradeMatch ? parseInt(gradeMatch[1]) : null;

  // Extract stroke count (first one is the accepted count)
  const strokeMatch = block.match(/<stroke_count>(\d+)<\/stroke_count>/);
  const strokeCount = strokeMatch ? parseInt(strokeMatch[1]) : null;

  // Extract frequency
  const freqMatch = block.match(/<freq>(\d+)<\/freq>/);
  const freq = freqMatch ? parseInt(freqMatch[1]) : null;

  // Extract JLPT level
  const jlptMatch = block.match(/<jlpt>(\d+)<\/jlpt>/);
  const jlpt = jlptMatch ? parseInt(jlptMatch[1]) : null;

  // Extract readings (On, Kun, Vietnamese)
  const onReadings = [];
  const kunReadings = [];
  const vietReadings = [];

  const readingRegex = /<reading r_type="(\w+)">(.+?)<\/reading>/g;
  let rMatch;
  while ((rMatch = readingRegex.exec(block)) !== null) {
    const [, type, value] = rMatch;
    if (type === 'ja_on') onReadings.push(value);
    else if (type === 'ja_kun') kunReadings.push(value);
    else if (type === 'vietnam') vietReadings.push(value);
  }

  // Extract English meanings (only default lang, no m_lang attribute)
  const meanings = [];
  const meaningRegex = /<meaning>(.+?)<\/meaning>/g;
  let mMatch;
  while ((mMatch = meaningRegex.exec(block)) !== null) {
    meanings.push(mMatch[1]);
  }

  // Build entry — only include non-null fields to save space
  const entry = {};
  if (grade !== null) entry.g = grade;
  if (strokeCount !== null) entry.s = strokeCount;
  if (freq !== null) entry.f = freq;
  if (jlpt !== null) entry.j = jlpt;
  if (onReadings.length) entry.on = onReadings;
  if (kunReadings.length) entry.kun = kunReadings;
  if (vietReadings.length) entry.v = vietReadings;
  if (meanings.length) entry.m = meanings;

  kanjiMap[literal] = entry;
  count++;
}

console.log(`✅ Parsed ${count} kanji characters.`);

// Ensure output directory exists
const outputDir = path.dirname(OUTPUT_PATH);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write JSON (no pretty-print to minimize size)
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(kanjiMap));

const stats = fs.statSync(OUTPUT_PATH);
const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
console.log(`💾 Written to: ${OUTPUT_PATH}`);
console.log(`📦 File size: ${sizeMB} MB`);

// Quick verification
const sample = kanjiMap['亜'];
if (sample) {
  console.log('\n🔍 Sample verification (亜):');
  console.log(`   JLPT: N${sample.j || '?'}`);
  console.log(`   On: ${(sample.on || []).join(', ')}`);
  console.log(`   Kun: ${(sample.kun || []).join(', ')}`);
  console.log(`   Viet: ${(sample.v || []).join(', ')}`);
  console.log(`   Meaning: ${(sample.m || []).join(', ')}`);
  console.log(`   Strokes: ${sample.s || '?'}`);
}

console.log('\n🎉 Done! kanji.json is ready.');
