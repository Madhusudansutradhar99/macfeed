import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase.from('videos').select('*').limit(1);
  if (error) {
    console.error('Error fetching videos:', error.message);
  } else if (data && data.length > 0) {
    console.log('Video columns:', Object.keys(data[0]));
  } else {
    console.log('No videos found.');
  }
}

checkSchema();
