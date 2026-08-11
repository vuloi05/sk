const youtubedl = require('youtube-dl-exec');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const parseVttToTranscript = (vttData) => {
  const lines = vttData.split('\n');
  const transcript = [];
  let currentSentence = null;

  // VTT Timestamp: 00:00:01.000 --> 00:00:03.000 or 00:01.000 --> 00:03.000
  const timeRegex = /(?:(\d{2}):)?(\d{2}):(\d{2})\.(\d{3})\s+-->\s+(?:(\d{2}):)?(\d{2}):(\d{2})\.(\d{3})/;

  const timeToSeconds = (h, m, s, ms) => {
    return (parseInt(h || 0) * 3600) + (parseInt(m) * 60) + parseInt(s) + (parseInt(ms) / 1000);
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('-->')) {
      const match = line.match(timeRegex);
      if (match) {
        currentSentence = {
          id: 's_' + uuidv4().substring(0, 8),
          start: timeToSeconds(match[1], match[2], match[3], match[4]),
          end: timeToSeconds(match[5], match[6], match[7], match[8]),
          en: '',
          vi: ''
        };
      }
    } else if (line !== '' && !line.startsWith('WEBVTT') && !line.startsWith('Kind:') && !line.startsWith('Language:')) {
      // Subtitle text
      if (currentSentence) {
        // Xóa các thẻ HTML ẩn (ví dụ: <c>, <i>, <font>)
        const cleanText = line.replace(/<\/?[^>]+(>|$)/g, "");
        if (cleanText && !cleanText.match(/^\d+$/)) { // Bỏ qua dòng chỉ chứa số thứ tự
            currentSentence.en += (currentSentence.en ? ' ' : '') + cleanText;
        }
        
        // Nếu dòng tiếp theo là trống thì chốt câu
        if (i === lines.length - 1 || lines[i+1].trim() === '') {
           if (currentSentence.en !== '') {
             transcript.push(currentSentence);
           }
           currentSentence = null;
        }

      }
    }
  }
  return transcript;
};

exports.fetchYoutubeMetadataAndTranscript = async (url) => {
  const output = await youtubedl(url, {
    dumpSingleJson: true,
    noWarnings: true,
    preferFreeFormats: true,
    writeSub: true,
    writeAutoSub: true
  });

  let transcript = [];
  let targetSubs = null;

  if (output.subtitles) {
    const keys = Object.keys(output.subtitles);
    const validKey = keys.find(k => k.startsWith('ja') || k.startsWith('en'));
    if (validKey) targetSubs = output.subtitles[validKey];
  }

  if (!targetSubs && output.automatic_captions) {
    const keys = Object.keys(output.automatic_captions);
    const validKey = keys.find(k => k.startsWith('ja') || k.startsWith('en'));
    if (validKey) targetSubs = output.automatic_captions[validKey];
  }

  if (targetSubs) {
    const vttSub = targetSubs.find(sub => sub.ext === 'vtt');
    if (vttSub) {
      try {
        const response = await axios.get(vttSub.url);
        transcript = parseVttToTranscript(response.data);
      } catch (err) {
        console.error("Lỗi khi tải VTT:", err);
      }
    }
  }

  // Phát hiện ngôn ngữ
  let detectedLang = 'jp';
  if (output.subtitles) {
    const keys = Object.keys(output.subtitles);
    if (keys.some(k => k.startsWith('en'))) detectedLang = 'en';
  }
  if (detectedLang === 'jp' && output.automatic_captions) {
    const keys = Object.keys(output.automatic_captions);
    if (keys.some(k => k.startsWith('en'))) detectedLang = 'en';
  }

  return {
    title: output.title,
    youtube_id: output.id,
    thumbnail: output.thumbnail,
    language: detectedLang,
    transcript
  };
};
