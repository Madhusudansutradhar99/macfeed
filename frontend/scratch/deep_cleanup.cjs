const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function extractId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
  return match ? match[1] : null;
}

async function deepCleanup() {
  const { data, error } = await supabase.from('videos').select('id, youtube_id, video_url');
  if (error) { console.error(error); return; }

  const seenIds = new Set();
  const toDelete = [];

  // Order matters: prioritize records that ALREADY HAVE youtube_id or duration (if we had it)
  // But here we just want to remove duplicates.
  data.forEach(v => {
    const idFromUrl = extractId(v.video_url);
    const effectiveId = v.youtube_id || idFromUrl;

    if (effectiveId && seenIds.has(effectiveId)) {
      toDelete.push(v.id);
    } else if (effectiveId) {
      seenIds.add(effectiveId);
    }
  });

  if (toDelete.length > 0) {
    console.log('Deep deleting duplicates:', toDelete);
    const { error: delErr } = await supabase.from('videos').delete().in('id', toDelete);
    if (delErr) console.error(delErr);
    else console.log('Deep cleanup successful.');
  } else {
    console.log('No duplicates found in deep search.');
  }
}

deepCleanup();
