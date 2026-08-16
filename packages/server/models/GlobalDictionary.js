const mongoose = require('mongoose');

const GlobalDictionarySchema = new mongoose.Schema({
  word: { type: String, required: true, unique: true }, // lowercase word
  pos: { type: String, default: '' }, // Part of speech (e.g. noun, verb)
  meaning_vi: { type: String, required: true },
  phonetic: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('GlobalDictionary', GlobalDictionarySchema);
