// /api/upload.js
// Receives a file upload from the client and uploads it to Supabase Storage (Node.js server-side)

import { createClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const busboy = require('busboy');
  const bb = busboy({ headers: req.headers });

  let uploadFile = null;
  let userId = 'anon';
  let fileName = '';
  let fileBuffer = Buffer.alloc(0);
  let fileType = 'audio/mpeg';

  bb.on('file', (fieldname, file, info) => {
    fileName = info.filename;
    fileType = info.mimeType || 'audio/mpeg';
    file.on('data', (data) => {
      fileBuffer = Buffer.concat([fileBuffer, data]);
    });
  });

  bb.on('field', (fieldname, val) => {
    if (fieldname === 'userId') userId = val;
  });

  bb.on('finish', async () => {
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const audioFileName = `${userId}/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const { error } = await supabase.storage.from('music').upload(audioFileName, fileBuffer, { upsert: true, contentType: fileType });
      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
      const { data } = supabase.storage.from('music').getPublicUrl(audioFileName);
      res.status(200).json({ success: true, publicUrl: data?.publicUrl });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  req.pipe(bb);
}
