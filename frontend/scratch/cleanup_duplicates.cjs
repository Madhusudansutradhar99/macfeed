const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function cleanup() {
  const { data, error } = await supabase.from('videos').select('id, youtube_id, video_url');
  if (error) { console.error(error); return; }

  const seen = new Set();
  const toDelete = [];

  data.forEach(v => {
    const key = v.youtube_id || v.video_url;
    if (seen.has(key)) {
      toDelete.push(v.id);
    } else {
      seen.add(key);
    }
  });

  if (toDelete.length > 0) {
    console.log('Deleting duplicates:', toDelete);
    const { error: delErr } = await supabase.from('videos').delete().in('id', toDelete);
    if (delErr) console.error(delErr);
    else console.log('Cleanup successful.');
  } else {
    console.log('No duplicates found.');
  }
}

cleanup();
