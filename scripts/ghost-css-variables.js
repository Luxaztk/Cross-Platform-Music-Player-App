import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'apps', 'desktop', 'src');
const extensions = ['.css', '.scss', '.tsx', '.jsx'];

const declaredRegex = /(--[a-zA-Z0-9-_]+)\s*:/g;
const usedRegex = /var\(\s*(--[a-zA-Z0-9-_]+)/g;

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walk(dirPath, callback);
        } else {
            callback(dirPath);
        }
    });
}

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
const unusedVariables = [...declaredVariables].filter(v => !usedVariables.has(v));

// === REPORT ===
const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    bright: "\x1b[1m",
};

console.log(`\n${colors.bright}${colors.cyan}🎨 CSS VARIABLES AUDIT REPORT${colors.reset}`);
console.log(`==========================================`);
console.log(`${colors.green}✅ Total Declared: ${declaredVariables.size}${colors.reset}`);
console.log(`${colors.cyan}📝 Total Used:     ${usedVariables.size}${colors.reset}`);
console.log(`==========================================\n`);

if (ghostVariables.length > 0) {
    console.log(`${colors.red}${colors.bright}👻 GHOST VARIABLES FOUND (${ghostVariables.length})${colors.reset}`);
    console.log(`${colors.red}These variables are used but NOT declared anywhere:${colors.reset}`);
    ghostVariables.sort().forEach(v => console.log(`  - ${v}`));
    console.log('');
} else {
    console.log(`${colors.green}✨ No ghost variables found!${colors.reset}\n`);
}

if (unusedVariables.length > 0) {
    console.log(`${colors.yellow}${colors.bright}🗑️  UNUSED VARIABLES FOUND (${unusedVariables.length})${colors.reset}`);
    console.log(`${colors.yellow}These variables are declared but NOT used in any files:${colors.reset}`);
    unusedVariables.sort().forEach(v => console.log(`  - ${v}`));
    console.log('');
} else {
    console.log(`${colors.green}✨ No unused variables found!${colors.reset}\n`);
}

console.log(`==========================================`);
if (ghostVariables.length === 0 && unusedVariables.length === 0) {
    console.log(`${colors.green}${colors.bright}PASSED: Your CSS variables are clean! 🚀${colors.reset}`);
} else {
    console.log(`${colors.yellow}DONE: Audit completed with findings.${colors.reset}`);
}
console.log(`==========================================\n`);
