const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data } = await supabase.from('videos').select('*').ilike('title', '%Bacche%');
  console.log(JSON.stringify(data, null, 2));
}
check();
