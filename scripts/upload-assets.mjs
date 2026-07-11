import * as dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import { readdir } from 'fs/promises';
import { join, extname, basename } from 'path';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'dtprb1afw',
  api_key: '374325573288935',
  api_secret: 'XDxTi4dbNwyzHGhq-vJRI_LDr2A',
  secure: true,
});

const ASSETS_DIR = join(process.cwd(), 'assest');
const FOLDER = 'ln-hostel/gallery';

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];
const VIDEO_EXTS = ['.mp4', '.mov', '.avi', '.webm'];

async function main() {
  console.log('🔌 Connecting to Cloudinary...');
  await cloudinary.api.ping();
  console.log('✅ Connected!\n');

  const files = await readdir(ASSETS_DIR);
  const results = [];

  for (const file of files) {
    const ext = extname(file).toLowerCase();
    const isImage = IMAGE_EXTS.includes(ext);
    const isVideo = VIDEO_EXTS.includes(ext);

    if (!isImage && !isVideo) {
      console.log(`⏭  Skipping: ${file}`);
      continue;
    }

    const filePath = join(ASSETS_DIR, file);
    const publicId = `${FOLDER}/${basename(file, ext).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
    const resourceType = isVideo ? 'video' : 'image';

    try {
      console.log(`⬆️  Uploading ${resourceType}: ${file}`);
      const result = await cloudinary.uploader.upload(filePath, {
        public_id: publicId,
        resource_type: resourceType,
        overwrite: true,
        folder: FOLDER,
      });
      console.log(`   ✓ URL: ${result.secure_url}`);
      results.push({
        file,
        url: result.secure_url,
        publicId: result.public_id,
        resourceType,
        width: result.width,
        height: result.height,
      });
    } catch (err) {
      console.error(`   ❌ Failed: ${err.message}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Upload complete:');
  for (const r of results) {
    console.log(`\n  File: ${r.file}`);
    console.log(`  URL:  ${r.url}`);
    console.log(`  ID:   ${r.publicId}`);
  }
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Output as JSON for copy-paste into branches.ts
  console.log('\n📋 JSON for branches.ts:');
  console.log(JSON.stringify(results, null, 2));
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
