const cp = require('child_process');
const fs = require('fs');
const path = require('path');

// Mocking the similarity logic from LibraryService
function calculateSimilarity(h1, h2) {
    if (h1.length !== h2.length) return 0;
    let matches = 0;
    for (let i = 0; i < h1.length; i++) {
        if (h1[i] === h2[i]) matches++;
    }
    return matches / h1.length;
}

// Extracting the fingerprint logic (simplified for node environment)
async function getFingerprint(filePath) {
    return new Promise((resolve) => {
        const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
        const ffmpeg = cp.spawn(ffmpegPath, [
            '-ss', '30', '-t', '30', '-i', filePath, '-f', 's16le', '-ac', '1', '-ar', '8000', '-loglevel', 'error', '-'
        ]);

        let pcmData = Buffer.alloc(0);
        ffmpeg.stdout.on('data', (chunk) => { pcmData = Buffer.concat([pcmData, chunk]); });
        ffmpeg.on('close', (code) => {
            if (code !== 0 || pcmData.length === 0) return resolve(null);
            const numWindows = 64;
            const bytesPerSample = 2;
            const windowSize = Math.floor(pcmData.length / bytesPerSample / numWindows);
            const envelope = [];
            for (let i = 0; i < numWindows; i++) {
                let sumSquare = 0;
                let actualSamples = 0;
                for (let j = 0; j < windowSize; j++) {
                    const idx = (i * windowSize + j) * bytesPerSample;
                    if (idx + 1 >= pcmData.length) break;
                    const sample = pcmData.readInt16LE(idx);
                    sumSquare += (sample / 32768) ** 2;
                    actualSamples++;
                }
                const rms = actualSamples > 0 ? Math.sqrt(sumSquare / actualSamples) : 0;
                const charCode = Math.min(35, Math.floor(rms * 100)); 
                envelope.push(charCode.toString(36));
            }
            resolve(envelope.join(''));
        });
    });
}

async function runTest() {
    console.log('Verifying v2 Similarity Matching...');
    const f1 = await getFingerprint('high.mp3');
    const f2 = await getFingerprint('low.mp3');

    if (!f1 || !f2) {
        console.error('Failed to generate fingerprints.');
        return;
    }

    const similarity = calculateSimilarity(f1, f2);
    console.log('F1 (High):', f1);
    console.log('F2 (Low): ', f2);
    console.log('Similarity:', (similarity * 100).toFixed(2) + '%');
    
    const passed = similarity >= 0.95;
    console.log('Result:', passed ? 'PASSED (Duplicate caught)' : 'FAILED (Algorithm too sensitive)');
    
    fs.writeFileSync('v2_final_verification.txt', `Passed: ${passed}\nSimilarity: ${similarity}\nF1: ${f1}\nF2: ${f2}`);
}

runTest().catch(console.error);
