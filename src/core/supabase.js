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
    
    // Listen for auth changes and update store
    supabase.auth.onAuthStateChange((event, session) => {
      import('./store.js').then(({ store }) => {
        store.set('currentUser', session?.user || null);
      });
    });
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
 * Supports both 'upload' (audio file) and 'youtube' (video URL) source types.
 * @param {Object} lessonData - Lesson metadata
 * @param {Array} sentences - Array of sentence objects
 * @param {File|null} audioFile - Audio file to upload (null for YouTube lessons)
 * @returns {Promise<Object>} Created lesson
 */
export async function createLesson(lessonData, sentences, audioFile) {
  const client = getSupabase();
  if (!client) {
    throw new Error('Supabase chưa được cấu hình. Vui lòng liên hệ admin.');
  }

  const isYouTube = lessonData.sourceType === 'youtube';
  let audioPath = null;

  // 1. Upload audio to Supabase Storage (only for 'upload' source type)
  if (!isYouTube && audioFile) {
    audioPath = `lessons/${Date.now()}_${audioFile.name}`;
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
  }

  // 2. Create lesson record
  const lessonRow = {
    title: lessonData.title,
    language: lessonData.language,
    level: lessonData.level,
    description: lessonData.description || '',
    audio_path: audioPath,
    duration_seconds: Math.round(lessonData.duration || 0),
    sentence_count: sentences.length,
    tags: lessonData.tags || '',
    author_id: (await client.auth.getUser()).data?.user?.id || null,
    source_type: isYouTube ? 'youtube' : 'upload',
    youtube_url: isYouTube ? lessonData.youtubeUrl : null,
  };

  const { data: lesson, error: lessonError } = await client
    .from('lessons')
    .insert(lessonRow)
    .select()
    .single();

  if (lessonError) {
    console.error('[Supabase] Lesson insert error:', lessonError);
    throw new Error('Không thể tạo bài luyện: ' + lessonError.message);
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
   Auth Operations (Phase 2)
   ============================================ */

export async function signUpUser(email, password, fullName) {
  const client = getSupabase();
  if (!client) throw new Error('Supabase chưa được cấu hình.');
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function signInUser(email, password) {
  const client = getSupabase();
  if (!client) throw new Error('Supabase chưa được cấu hình.');
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function signInWithGoogle() {
  const client = getSupabase();
  if (!client) throw new Error('Supabase chưa được cấu hình.');
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function signOutUser() {
  const client = getSupabase();
  if (!client) return;
  const { error } = await client.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function getCurrentUser() {
  const client = getSupabase();
  if (!client) return null;
  const { data: { user } } = await client.auth.getUser();
  return user;
}


/* ============================================
   Kanji SRS Cloud Sync (Phase 3)
   ============================================ */

/**
 * Fetch all kanji SRS progress for the current user from Supabase.
 * @returns {Promise<Object|null>} Map of kanji literal -> SRS card data
 */
export async function fetchKanjiProgress() {
  const client = getSupabase();
  if (!client) return null;

  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;

  const { data, error } = await client
    .from('user_kanji_progress')
    .select('kanji, state, ease, interval, reps, step, lapses, next_review')
    .eq('user_id', user.id);

  if (error) {
    console.error('[Supabase] fetchKanjiProgress error:', error);
    return null;
  }

  // Convert array to map
  const progressMap = {};
  for (const row of data) {
    progressMap[row.kanji] = {
      state: row.state || 'review',
      ease: parseFloat(row.ease),
      interval: row.interval,
      reps: row.reps,
      step: row.step || 0,
      lapses: row.lapses || 0,
      nextReview: row.next_review,
    };
  }
  return progressMap;
}

/**
 * Save a single kanji SRS update to Supabase (upsert).
 * Called in background after each flashcard answer — fire-and-forget.
 * @param {string} kanji - The kanji literal
 * @param {Object} srs - Full card state object
 */
export async function saveKanjiProgress(kanji, srs) {
  const client = getSupabase();
  if (!client) return;

  const { data: { user } } = await client.auth.getUser();
  if (!user) return;

  const { error } = await client
    .from('user_kanji_progress')
    .upsert({
      user_id: user.id,
      kanji,
      state: srs.state || 'review',
      ease: srs.ease,
      interval: srs.interval,
      reps: srs.reps,
      step: srs.step || 0,
      lapses: srs.lapses || 0,
      next_review: srs.nextReview,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,kanji',
    });

  if (error) {
    console.error('[Supabase] saveKanjiProgress error:', error);
  }
}

/**
 * Bulk sync all local SRS data to Supabase. Used on initial load to
 * merge localStorage data with cloud data (cloud wins on conflicts).
 * @param {Object} localSrsData - Map of kanji -> card state
 * @returns {Promise<Object>} Merged SRS data map
 */
export async function syncKanjiProgress(localSrsData) {
  const client = getSupabase();
  if (!client) return localSrsData;

  const { data: { user } } = await client.auth.getUser();
  if (!user) return localSrsData;

  // 1. Fetch cloud data
  const cloudData = await fetchKanjiProgress();
  if (!cloudData) return localSrsData;

  // 2. Merge: cloud wins if both exist
  const merged = { ...localSrsData };
  for (const [kanji, cloudSrs] of Object.entries(cloudData)) {
    const localSrs = merged[kanji];
    if (!localSrs || cloudSrs.nextReview >= (localSrs.nextReview || 0)) {
      merged[kanji] = cloudSrs;
    }
  }

  // 3. Upload any local-only entries to cloud
  const localOnlyEntries = [];
  for (const [kanji, srs] of Object.entries(merged)) {
    if (!cloudData[kanji]) {
      localOnlyEntries.push({
        user_id: user.id,
        kanji,
        state: srs.state || 'review',
        ease: srs.ease,
        interval: srs.interval,
        reps: srs.reps,
        step: srs.step || 0,
        lapses: srs.lapses || 0,
        next_review: srs.nextReview,
        updated_at: new Date().toISOString(),
      });
    }
  }

  if (localOnlyEntries.length > 0) {
    const { error } = await client
      .from('user_kanji_progress')
      .upsert(localOnlyEntries, { onConflict: 'user_id,kanji' });
    if (error) {
      console.error('[Supabase] bulk sync error:', error);
    }
  }

  return merged;
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
