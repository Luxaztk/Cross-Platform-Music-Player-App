const crypto = require('crypto');
const { spawn } = require('child_process');
const fs = require('fs');

async function getPerceptualHash(filePath) {
    return new Promise((resolve) => {
        const args = ['-ss', '30', '-t', '30', '-i', filePath, '-f', 's16le', '-ac', '1', '-ar', '16000', '-loglevel', 'error', '-'];
        const ffmpeg = spawn('ffmpeg', args);
        const hash = crypto.createHash('md5');
        ffmpeg.stdout.on('data', (data) => hash.update(data));
        ffmpeg.on('close', (code) => resolve(code === 0 ? `p1:${hash.digest('hex')}` : `error:${code}`));
    });
}

async function runTest() {
    console.log("Starting final verification...");
    
    // We already have low.mp3 and high.mp3 from previous attempt if they finished
    // but just in case, let's check or download short 60s clips
    
    const h1 = await getPerceptualHash('low.mp3');
    const h2 = await getPerceptualHash('high.mp3');

    console.log("Hash 1 (Low Quality):", h1);
    console.log("Hash 2 (High Quality):", h2);
    
    const success = h1 === h2 && h1.startsWith('p1:');
    console.log("Verification Success:", success);
    
    fs.writeFileSync('final_test_results.txt', `Success: ${success}\nH1: ${h1}\nH2: ${h2}`);
}

runTest().catch(console.error);
