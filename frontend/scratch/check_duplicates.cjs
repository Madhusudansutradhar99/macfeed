const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkData() {
  const { data, error } = await supabase.from('videos').select('id, title, video_url, youtube_id');
  if (error) console.error(error);
  
  const counts = {};
  data.forEach(v => {
    const key = v.youtube_id || v.video_url;
    counts[key] = (counts[key] || 0) + 1;
  });
  
  console.log('Duplicates found:');
  Object.entries(counts).filter(([k, v]) => v > 1).forEach(([k, v]) => {
    console.log(`${k}: ${v} times`);
    console.log('Instances:', data.filter(d => (d.youtube_id || d.video_url) === k).map(d => d.id));
  });
  
  if (Object.values(counts).every(v => v === 1)) {
    console.log('No duplicates found.');
  }
}

checkData();
