import fs from 'fs';
import pdf from 'pdf-parse';

async function parse() {
  const dataBuffer = fs.readFileSync('pdf/The_Oxford_5000.pdf');
  const data = await pdf(dataBuffer);
  console.log(data.text.substring(0, 1000));
}
parse();
