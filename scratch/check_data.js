import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error, count } = await supabase
    .from('videos')
    .select('*', { count: 'exact' })
    .limit(5);

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Total Count:", count);
    console.log("Sample Data:", data);
  }
}

check();
