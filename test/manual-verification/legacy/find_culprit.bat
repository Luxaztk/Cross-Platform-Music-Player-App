@echo off
node -e "const fs = require('fs'); const path = require('path'); const libPath = path.join(process.env.APPDATA, 'melovista', 'library.json'); if (!fs.existsSync(libPath)) { console.log('Lib not found'); } else { const data = JSON.parse(fs.readFileSync(libPath, 'utf8')); Object.values(data.songs).forEach(s => { if (!s.hash.startsWith('p2:')) console.log('Culprit: ' + s.title + ' | Duration: ' + s.duration + 's | Hash: ' + s.hash); }); }"
pause
