import axios from 'axios';
import cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Masukkan link KrakenFiles: ', async (url) => {
  if (!/krakenfiles\.com\/view\/.+\/file\.html/.test(url)) {
    console.log('Link tidak valid!');
    return rl.close();
  }

  console.log('Memproses link...');

  try {
    const page = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(page.data);
    const jsonScript = $('#content script').html();
    const fileUrl = jsonScript.match(/"download_uri":"(.*?)"/)?.[1]?.replace(/\\/g, '');

    if (!fileUrl) {
      console.log('Gagal mendapatkan URL unduhan.');
      return rl.close();
    }

    const fullDownloadUrl = `https://krakenfiles.com${fileUrl}`;
    const filename = fullDownloadUrl.split('/').pop();
    const filePath = path.join(__dirname, filename);

    const writer = fs.createWriteStream(filePath);
    const response = await axios({ url: fullDownloadUrl, method: 'GET', responseType: 'stream' });

    response.data.pipe(writer);

    writer.on('finish', () => {
      console.log(`File berhasil diunduh: ${filePath}`);
      rl.close();
    });

    writer.on('error', () => {
      console.log('Gagal mengunduh file.');
      rl.close();
    });

  } catch (err) {
    console.error('Terjadi kesalahan:', err.message);
    rl.close();
  }
});
