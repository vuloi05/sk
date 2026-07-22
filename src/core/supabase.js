/**
 * DictaFlow — Supabase Client & CRUD Operations
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../utils/constants.js';

/** @type {import('@supabase/supabase-js').SupabaseClient} */
let supabase = null;

/**
 * Initialize or return the Supabase client singleton.
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function getSupabase() {
  if (!supabase) {
    if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
      console.warn('[Supabase] Not configured. Using demo mode with local data.');
      return null;
    }
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
}

/**
 * Check if Supabase is configured.
 * @returns {boolean}
 */
export function isSupabaseConfigured() {
  return SUPABASE_URL && SUPABASE_URL !== 'YOUR_SUPABASE_URL';
}

/**
 * Fetch all lessons from the community library.
 * @param {Object} filters
 * @param {string} [filters.language] - 'ja' or 'en'
 * @param {string} [filters.level] - 'beginner', 'intermediate', 'advanced'
 * @param {string} [filters.search] - Search query
 * @returns {Promise<Array>}
 */
export async function fetchLessons(filters = {}) {
  const client = getSupabase();
  if (!client) return getDemoLessons();

  let query = client
    .from('lessons')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.language) {
    query = query.eq('language', filters.language);
  }
  if (filters.level) {
    query = query.eq('level', filters.level);
  }
  if (filters.search) {
    query = query.ilike('title', `%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[Supabase] fetchLessons error:', error);
    throw new Error('Không thể tải danh sách bài luyện.');
  }
  return data || [];
}

/**
 * Fetch a single lesson with all its sentences.
 * @param {string} lessonId
 * @returns {Promise<{lesson: Object, sentences: Array}>}
 */
export async function fetchLesson(lessonId) {
  const client = getSupabase();
  if (!client) return getDemoLesson(lessonId);

  const [lessonRes, sentencesRes] = await Promise.all([
    client.from('lessons').select('*').eq('id', lessonId).single(),
    client.from('sentences').select('*').eq('lesson_id', lessonId).order('order_index'),
  ]);

  if (lessonRes.error) {
    throw new Error('Không tìm thấy bài luyện.');
  }

  return {
    lesson: lessonRes.data,
    sentences: sentencesRes.data || [],
  };
}

/**
 * Create a new lesson and upload its audio + sentences.
 * @param {Object} lessonData - Lesson metadata
 * @param {Array} sentences - Array of sentence objects
 * @param {File} audioFile - Audio file to upload
 * @returns {Promise<Object>} Created lesson
 */
export async function createLesson(lessonData, sentences, audioFile) {
  const client = getSupabase();
  if (!client) {
    throw new Error('Supabase chưa được cấu hình. Vui lòng liên hệ admin.');
  }

  // 1. Upload audio to Supabase Storage
  const audioPath = `lessons/${Date.now()}_${audioFile.name}`;
  const { error: uploadError } = await client.storage
    .from('audio')
    .upload(audioPath, audioFile, {
      contentType: audioFile.type,
      upsert: false,
    });

  if (uploadError) {
    console.error('[Supabase] Audio upload error:', uploadError);
    throw new Error('Không thể upload file audio.');
  }

  // 2. Create lesson record
  const { data: lesson, error: lessonError } = await client
    .from('lessons')
    .insert({
      title: lessonData.title,
      language: lessonData.language,
      level: lessonData.level,
      description: lessonData.description || '',
      audio_path: audioPath,
      duration_seconds: lessonData.duration || 0,
      sentence_count: sentences.length,
      tags: lessonData.tags || '',
    })
    .select()
    .single();

  if (lessonError) {
    console.error('[Supabase] Lesson insert error:', lessonError);
    throw new Error('Không thể tạo bài luyện.');
  }

  // 3. Insert sentences
  const sentenceRows = sentences.map((s, i) => ({
    lesson_id: lesson.id,
    order_index: i,
    content: s.text,
    start_time: s.startTime,
    end_time: s.endTime,
    gap_fill_data: s.gapFillData ? JSON.stringify(s.gapFillData) : null,
    mcq_data: s.mcqData ? JSON.stringify(s.mcqData) : null,
  }));

  const { error: sentenceError } = await client
    .from('sentences')
    .insert(sentenceRows);

  if (sentenceError) {
    console.error('[Supabase] Sentences insert error:', sentenceError);
    // Lesson was created but sentences failed — still return lesson
  }

  return lesson;
}

/**
 * Get the public URL for an audio file in Supabase Storage.
 * @param {string} audioPath
 * @returns {string}
 */
export function getAudioUrl(audioPath) {
  const client = getSupabase();
  if (!client) return '';
  const { data } = client.storage.from('audio').getPublicUrl(audioPath);
  return data.publicUrl;
}


/* ============================================
   Demo Data (used when Supabase is not configured)
   ============================================ */

function getDemoLessons() {
  return [
    {
      id: 'demo-ja-1',
      title: 'みんなの日本語 第1課',
      language: 'ja',
      level: 'beginner',
      description: 'Bài 1 - Giới thiệu bản thân',
      duration_seconds: 120,
      sentence_count: 5,
      tags: 'minna,lesson1,beginner',
      created_at: '2025-01-15T10:00:00Z',
    },
    {
      id: 'demo-ja-2',
      title: 'JLPT N3 聴解 練習',
      language: 'ja',
      level: 'intermediate',
      description: 'Luyện nghe JLPT N3',
      duration_seconds: 300,
      sentence_count: 12,
      tags: 'jlpt,n3,listening',
      created_at: '2025-02-20T10:00:00Z',
    },
    {
      id: 'demo-en-1',
      title: 'IELTS Listening Section 1',
      language: 'en',
      level: 'intermediate',
      description: 'Practice for IELTS Listening',
      duration_seconds: 240,
      sentence_count: 8,
      tags: 'ielts,listening,section1',
      created_at: '2025-03-10T10:00:00Z',
    },
    {
      id: 'demo-en-2',
      title: 'Daily English Conversation',
      language: 'en',
      level: 'beginner',
      description: 'Everyday English phrases',
      duration_seconds: 180,
      sentence_count: 10,
      tags: 'daily,conversation,beginner',
      created_at: '2025-04-05T10:00:00Z',
    },
  ];
}

function getDemoLesson(lessonId) {
  const lessons = getDemoLessons();
  const lesson = lessons.find(l => l.id === lessonId);

  const demoPhrases = {
    'demo-ja-1': [
      { text: 'はじめまして、田中です。', startTime: 0, endTime: 3 },
      { text: 'わたしは エンジニア です。', startTime: 3, endTime: 6 },
      { text: 'どうぞ よろしく おねがいします。', startTime: 6, endTime: 10 },
      { text: '日本語を 勉強 しています。', startTime: 10, endTime: 14 },
      { text: 'まいにち 練習 します。', startTime: 14, endTime: 17 },
    ],
    'demo-ja-2': [
      { text: '今日は天気がいいですね。', startTime: 0, endTime: 3 },
      { text: '週末に映画を見に行きませんか。', startTime: 3, endTime: 7 },
      { text: 'この電車は東京行きです。', startTime: 7, endTime: 10 },
      { text: '申し訳ありませんが、もう一度言ってください。', startTime: 10, endTime: 15 },
      { text: '来月から新しい仕事が始まります。', startTime: 15, endTime: 19 },
      { text: '日本の文化にとても興味があります。', startTime: 19, endTime: 23 },
      { text: '毎朝六時に起きて散歩をします。', startTime: 23, endTime: 27 },
      { text: '最近は読書が趣味になりました。', startTime: 27, endTime: 31 },
      { text: '友達と一緒にレストランで食事をしました。', startTime: 31, endTime: 36 },
      { text: 'この問題はちょっと難しいですね。', startTime: 36, endTime: 40 },
      { text: '来年の春に日本へ旅行したいと思います。', startTime: 40, endTime: 45 },
      { text: 'もっと日本語が上手になりたいです。', startTime: 45, endTime: 49 },
    ],
    'demo-en-1': [
      { text: 'Good morning, I would like to book a table for two.', startTime: 0, endTime: 4 },
      { text: 'The restaurant is located on the second floor.', startTime: 4, endTime: 8 },
      { text: 'Could you please spell your name?', startTime: 8, endTime: 11 },
      { text: 'The meeting has been rescheduled to Friday.', startTime: 11, endTime: 15 },
      { text: 'Please take the elevator to the third floor.', startTime: 15, endTime: 19 },
      { text: 'I am sorry, but the museum is closed on Mondays.', startTime: 19, endTime: 24 },
      { text: 'The train departs from platform number five.', startTime: 24, endTime: 28 },
      { text: 'Would you like to pay by cash or credit card?', startTime: 28, endTime: 32 },
    ],
    'demo-en-2': [
      { text: 'How are you doing today?', startTime: 0, endTime: 2 },
      { text: 'I usually wake up at seven o\'clock.', startTime: 2, endTime: 5 },
      { text: 'What do you do for a living?', startTime: 5, endTime: 8 },
      { text: 'The weather is really nice today.', startTime: 8, endTime: 11 },
      { text: 'Could you help me with this problem?', startTime: 11, endTime: 14 },
      { text: 'I have been studying English for three years.', startTime: 14, endTime: 18 },
      { text: 'Let us go to the park this afternoon.', startTime: 18, endTime: 21 },
      { text: 'Where is the nearest bus stop?', startTime: 21, endTime: 24 },
      { text: 'I enjoy reading books in my free time.', startTime: 24, endTime: 28 },
      { text: 'Thank you very much for your help.', startTime: 28, endTime: 31 },
    ],
  };

  const rawSentences = demoPhrases[lessonId] || demoPhrases['demo-en-2'];
  const sentences = rawSentences.map((s, i) => ({
    id: `${lessonId}-s${i}`,
    lesson_id: lessonId,
    order_index: i,
    content: s.text,
    start_time: s.startTime,
    end_time: s.endTime,
    gap_fill_data: null,
    mcq_data: null,
  }));

  return { lesson, sentences };
}
