import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'apps', 'desktop', 'src');
const extensions = ['.css', '.scss', '.tsx', '.jsx'];

const declaredRegex = /(--[a-zA-Z0-9-_]+)\s*:/g;
const usedRegex = /var\(\s*(--[a-zA-Z0-9-_]+)/g;

function walk(dir, callback) {
    fs.readdirSync(dir).forEach( f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
};

const declaredVariables = new Set();
const usedVariables = new Set();

walk(srcDir, (filePath) => {
    if (!extensions.includes(path.extname(filePath))) return;
    
    const content = fs.readFileSync(filePath, 'utf8');
    let match;

    // Extract declared variables (mostly from style files)
    while ((match = declaredRegex.exec(content)) !== null) {
        declaredVariables.add(match[1]);
    }

    // Extract used variables
    while ((match = usedRegex.exec(content)) !== null) {
        usedVariables.add(match[1]);
    }
});

const ghostVariables = [...usedVariables].filter(v => !declaredVariables.has(v));

console.log('====================================');
console.log('   GHOST CSS VARIABLES DETECTOR     ');
console.log('====================================');
console.log(`Total declared: ${declaredVariables.size}`);
console.log(`Total used:     ${usedVariables.size}`);
console.log('------------------------------------');
console.log('Detected Ghost Variables:');

if (ghostVariables.length === 0) {
    console.log('  None! Your CSS is clean.');
} else {
    ghostVariables.sort().forEach(v => console.log(`  [!] ${v}`));
}
console.log('====================================');
