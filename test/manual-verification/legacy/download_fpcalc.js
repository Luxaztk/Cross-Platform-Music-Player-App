const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const url = 'https://github.com/acoustid/chromaprint/releases/download/v1.6.0/chromaprint-fpcalc-1.6.0-windows-x86_64.zip';
const zipPath = path.join(__dirname, 'fpcalc.zip');
const tempDir = path.join(__dirname, 'fpcalc_temp');
const binDir = path.join(__dirname, 'apps/desktop/electron/bin');

if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
}

console.log('Downloading fpcalc from:', url);
https.get(url, (response) => {
    if (response.statusCode === 302) {
        https.get(response.headers.location, handleResponse);
    } else {
        handleResponse(response);
    }
}).on('error', (err) => {
    console.error('Download error:', err);
});

function handleResponse(response) {
    const file = fs.createWriteStream(zipPath);
    response.pipe(file);
    file.on('finish', () => {
        file.close();
        console.log('Download complete.');
        try {
            console.log('Extracting archive...');
            // Using powershell because it's built-in on Windows for unzipping
            execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${tempDir}' -Force"`);
            
            const exePath = path.join(tempDir, 'chromaprint-fpcalc-1.6.0-windows-x86_64', 'fpcalc.exe');
            const destPath = path.join(binDir, 'fpcalc.exe');
            
            console.log('Moving executable to:', destPath);
            fs.copyFileSync(exePath, destPath);
            
            console.log('Cleaning up...');
            fs.unlinkSync(zipPath);
            // Removing a directory in Node recursively is slightly verbose without a lib, so powershell again
            execSync(`powershell -Command "Remove-Item -Path '${tempDir}' -Recurse -Force"`);
            
            console.log('SUCCESS: fpcalc.exe is ready.');
        } catch (err) {
            console.error('Processing error:', err);
        }
    });
}
