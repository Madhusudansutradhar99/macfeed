import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedMovie() {
  const { data, error } = await supabase.from('videos').insert([
    {
      title: 'Big Buck Bunny (Test Movie)',
      youtube_id: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumbnail_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
      category: 'Movies'
    }
  ]);

  if (error) {
    console.error('Error inserting movie:', error.message);
  } else {
    console.log('Test movie inserted successfully!');
  }
}

seedMovie();
