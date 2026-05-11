
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './frontend/.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkMusic() {
  const { data, error } = await supabase
    .from('videos')
    .select('id, title, youtube_id, category')
    .eq('category', 'Music')
    .limit(10);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Music Songs:', data);
  }
}

checkMusic();
