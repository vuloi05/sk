import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.VITE_SUPABASE_ANON_KEY); // Wait, the Gemini key is not in .env. It's stored in localStorage in the browser!

// I need the user's Gemini key to test. But wait, I can't access localStorage from Node.
// The user has the Gemini key. I can just write a script and ask the user to run it? No, I don't have the user's Gemini key.
