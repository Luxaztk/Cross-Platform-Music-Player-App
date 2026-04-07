const crypto = require('crypto');
const fs = require('fs');

function calculateAudioHash(filePath) {
      const stats = fs.statSync(filePath);
      const hash = crypto.createHash('md5');
      
      const fileHandle = fs.openSync(filePath, 'r');

      let audioStartOffset = 0;
      const headerBuffer = Buffer.alloc(10);
      const bytesRead = fs.readSync(fileHandle, headerBuffer, 0, 10, 0);

      if (bytesRead === 10 && headerBuffer.toString('ascii', 0, 3) === 'ID3') {
        const id3Size =
          ((headerBuffer[6] & 0x7f) << 21) |
          ((headerBuffer[7] & 0x7f) << 14) |
          ((headerBuffer[8] & 0x7f) << 7) |
          (headerBuffer[9] & 0x7f);
        audioStartOffset = 10 + id3Size; // 10 bytes for the header itself
      }

      const available = stats.size - audioStartOffset;
      const bufferSize = Math.min(available, 1024 * 1024);

      if (bufferSize <= 0) {
        return 'error-fallback-toosmall';
      }

      const buffer = Buffer.alloc(bufferSize);
      fs.readSync(fileHandle, buffer, 0, bufferSize, audioStartOffset);
      
      hash.update(buffer);
      fs.closeSync(fileHandle);
      return hash.digest('hex');
}

const p = 'C:/Users/Admin/Music/Melovista Downloads/';
if (fs.existsSync(p)) {
  const files = fs.readdirSync(p);
  for(const f of files) {
    if (f.endsWith('.mp3')) {
      console.log(f, calculateAudioHash(p + f));
    }
  }
} else {
  console.log("Directory not found:", p);
}
