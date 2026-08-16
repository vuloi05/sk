const youtubedl = require('youtube-dl-exec');

async function test() {
  try {
    const url = 'https://youtu.be/zXz72SmVg2E';
    console.log(`Fetching info for ${url}...`);
    
    const output = await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      preferFreeFormats: true
    });
    
    console.log('Title:', output.title);
    
    const manualSubs = output.subtitles ? Object.keys(output.subtitles) : [];
    const autoSubs = output.automatic_captions ? Object.keys(output.automatic_captions) : [];
    
    console.log('Manual Sub Languages:', manualSubs);
    console.log('Auto Sub Languages:', autoSubs);

    if (output.automatic_captions && output.automatic_captions['en']) {
      const vtt = output.automatic_captions['en'].find(sub => sub.ext === 'vtt');
      console.log('Auto-sub VTT URL:', vtt ? vtt.url : 'None');
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}
test();
