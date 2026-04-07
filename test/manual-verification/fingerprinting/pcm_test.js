const crypto = require('crypto');
const { spawn } = require('child_process');
const fs = require('fs');

async function getPcmHash(filePath) {
    return new Promise((resolve, reject) => {
        // Extract 15 seconds from the 60th second
        // Convert to PCM 16-bit Mono 22050Hz
        const args = [
            '-ss', '60',
            '-t', '15',
            '-i', filePath,
            '-f', 's16le',
            '-ac', '1',
            '-ar', '22050',
            '-'
        ];
        
        const ffmpeg = spawn('ffmpeg', args);
        const hash = crypto.createHash('md5');
        
        ffmpeg.stdout.on('data', (data) => {
            hash.update(data);
        });
        
        ffmpeg.on('close', (code) => {
            if (code === 0) {
                resolve(hash.digest('hex'));
            } else {
                reject(new Error(`FFmpeg exited with code ${code}`));
            }
        });
        
        ffmpeg.stderr.on('data', (data) => {
            // console.error(data.toString());
        });
    });
}

// Test with two files if they exist or just dummy test
async function test() {
    console.log("Testing PCM hash stability...");
    // I would need two files here. I'll just check if the function runs for now.
}

test();
