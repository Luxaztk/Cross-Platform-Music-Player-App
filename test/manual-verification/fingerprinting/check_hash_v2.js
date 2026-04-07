const cp = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

async function getEnergyFingerprint(filePath) {
    return new Promise((resolve, reject) => {
        // 16kHz, Mono, 16-bit PCM
        const args = ['-ss', '30', '-t', '30', '-i', filePath, '-f', 's16le', '-ac', '1', '-ar', '8000', '-'];
        const ffmpeg = cp.spawn(ffmpegPath, args);
        
        let pcmData = Buffer.alloc(0);
        ffmpeg.stdout.on('data', (data) => {
            pcmData = Buffer.concat([pcmData, data]);
        });
        
        ffmpeg.on('close', (code) => {
            if (code !== 0) return resolve(`error:${code}`);
            
            // Perceptual Fingerprinting logic:
            // 1. Divide the 30s audio (240,000 samples @ 8kHz) into 64 windows
            const windowSize = Math.floor(pcmData.length / 2 / 64); // 2 bytes per sample
            const envelope = [];
            
            for (let i = 0; i < 64; i++) {
                let sumSquare = 0;
                for (let j = 0; j < windowSize; j++) {
                    const idx = (i * windowSize + j) * 2;
                    if (idx + 1 >= pcmData.length) break;
                    const sample = pcmData.readInt16LE(idx);
                    sumSquare += (sample / 32768) ** 2; // Normalize to 0-1
                }
                const rms = Math.sqrt(sumSquare / windowSize);
                // Convert to a base-36 character (0-z) for the fingerprint
                const charCode = Math.floor(rms * 35);
                envelope.push(charCode.toString(36));
            }
            
            const fingerprint = envelope.join('');
            resolve(`p2:${fingerprint}`); // p2 = Perceptual v2 (Energy Envelope)
        });
    });
}

async function runTest() {
    console.log('Testing Energy Envelope stability across qualities...');
    const h1 = await getEnergyFingerprint('high.mp3');
    const h2 = await getEnergyFingerprint('low.mp3');

    console.log('High (320k) Fingerprint:', h1);
    console.log('Low (64k) Fingerprint: ', h2);
    
    // Similarity check (levenshtein or just matching characters)
    let matches = 0;
    for (let i = 0; i < h1.length; i++) {
        if (h1[i] === h2[i]) matches++;
    }
    const similarity = (matches / h1.length) * 100;
    console.log(`Similarity: ${similarity.toFixed(2)}%`);
    
    fs.writeFileSync('fingerprint_v2_results.txt', `H1: ${h1}\nH2: ${h2}\nSimilarity: ${similarity}%`);
}

runTest().catch(console.error);
