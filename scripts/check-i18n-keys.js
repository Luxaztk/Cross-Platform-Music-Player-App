import fs from 'fs';
import path from 'path';

const translationsPath = path.join(process.cwd(), 'packages', 'i18n', 'src', 'desktop.ts');
const srcDir = path.join(process.cwd(), 'apps', 'desktop', 'src');
const extensions = ['.tsx', '.ts', '.jsx'];

/**
 * Thô bỉ nhưng hiệu quả: Trích xuất object 'en' từ file .ts mà không cần parser phức tạp
 */
function extractBlockKeys(content, lang) {
    const match = content.match(new RegExp(`${lang}:\\s*\\{`));
    if (!match) return new Set();

    const startPos = match.index + match[0].length - 1;
    let braceCount = 0;
    let endPos = -1;

    for (let i = startPos; i < content.length; i++) {
        if (content[i] === '{') braceCount++;
        if (content[i] === '}') braceCount--;
        if (braceCount === 0) {
            endPos = i + 1;
            break;
        }
    }

    const blockString = content.substring(startPos, endPos);
    try {
        const obj = eval(`(${blockString})`);
        const keys = new Set();
        function flatten(o, prefix = '') {
            for (const k in o) {
                const fullKey = prefix ? `${prefix}.${k}` : k;
                if (typeof o[k] === 'object' && o[k] !== null && !Array.isArray(o[k])) {
                    flatten(o[k], fullKey);
                } else {
                    keys.add(fullKey);
                }
            }
        }
        flatten(obj);
        return keys;
    } catch (e) {
        console.error(`❌ Lỗi khi parse block "${lang}":`, e.message);
        return new Set();
    }
}

function getDeclaredKeys() {
    const content = fs.readFileSync(translationsPath, 'utf8');
    const viKeys = extractBlockKeys(content, 'vi');
    const enKeys = extractBlockKeys(content, 'en');
    
    if (viKeys.size === 0) {
        console.error('❌ Không tìm thấy block "vi:" trong desktop.ts');
        process.exit(1);
    }
    
    return { viKeys, enKeys };
}
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

const { viKeys, enKeys } = getDeclaredKeys();
const declaredKeys = viKeys; // Lấy tiếng Việt làm base
const usedKeys = new Set();

// Regex trích xuất key: t('key'), t("key"), i18nKey="key"
// Bỏ qua template literals có biến t(`${...}`)
const patterns = [
    /\bt\(\s*['"]([^'"]+)['"]\s*[\),]/g,  // t('key') hoặc t('key', ...)
    /i18nKey=['"]([^'"]+)['"]/g          // i18nKey="key"
];

const excludeDirs = ['tests', 'stories', '__tests__', '__mocks__'];
const excludeFiles = ['.test.', '.spec.', '.d.ts', '.stories.'];

walk(srcDir, (filePath) => {
    if (!extensions.includes(path.extname(filePath))) return;
    if (filePath === translationsPath) return; // Bỏ qua chính file định nghĩa
    
    // Loại trừ thư mục và file không liên quan
    if (excludeDirs.some(d => filePath.includes(path.sep + d + path.sep))) return;
    if (excludeFiles.some(f => filePath.includes(f))) return;

    const content = fs.readFileSync(filePath, 'utf8');
    
    patterns.forEach(regex => {
        let match;
        while ((match = regex.exec(content)) !== null) {
            const key = match[1];
            // Bỏ qua nếu có vẻ là biến hoặc template literal (Regex trên đã loại bỏ hầu hết)
            if (key && !key.includes('${') && !key.includes('`')) {
                usedKeys.add(key);
            }
        }
    });
});

const ghostKeys = [...usedKeys].filter(k => !declaredKeys.has(k));
const unusedKeys = [...declaredKeys].filter(k => !usedKeys.has(k));

const missingInEn = [...viKeys].filter(k => !enKeys.has(k));
const missingInVi = [...enKeys].filter(k => !viKeys.has(k));

// === REPORT ===
const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    bright: "\x1b[1m",
};

console.log(`\n${colors.bright}${colors.cyan}🔍 I18N KEYS AUDIT REPORT${colors.reset}`);
console.log(`==========================================`);
console.log(`${colors.green}✅ Total Declared: ${declaredKeys.size}${colors.reset}`);
console.log(`${colors.cyan}📝 Total Used:     ${usedKeys.size}${colors.reset}`);
console.log(`==========================================\n`);

if (ghostKeys.length > 0) {
    console.log(`${colors.red}${colors.bright}👻 GHOST KEYS FOUND (${ghostKeys.length})${colors.reset}`);
    console.log(`${colors.red}These keys are used in code but NOT declared in translations.ts:${colors.reset}`);
    ghostKeys.sort().forEach(k => console.log(`  - ${k}`));
    console.log('');
} else {
    console.log(`${colors.green}✨ No ghost keys found!${colors.reset}\n`);
}

if (unusedKeys.length > 0) {
    console.log(`${colors.yellow}${colors.bright}🗑️  UNUSED KEYS FOUND (${unusedKeys.length})${colors.reset}`);
    console.log(`${colors.yellow}These keys are declared but NOT used in any .ts/.tsx files:${colors.reset}`);
    unusedKeys.sort().forEach(k => console.log(`  - ${k}`));
    console.log('');
} else {
    console.log(`${colors.green}✨ No unused keys found!${colors.reset}\n`);
}

if (missingInEn.length > 0 || missingInVi.length > 0) {
    console.log(`${colors.cyan}${colors.bright}⚠️  TRANSLATION MISMATCH FOUND${colors.reset}`);
    if (missingInEn.length > 0) {
        console.log(`${colors.red}Missing in 'en' (Declared in 'vi'):${colors.reset}`);
        missingInEn.sort().forEach(k => console.log(`  - ${k}`));
    }
    if (missingInVi.length > 0) {
        console.log(`${colors.red}Missing in 'vi' (Declared in 'en'):${colors.reset}`);
        missingInVi.sort().forEach(k => console.log(`  - ${k}`));
    }
    console.log('');
} else {
    console.log(`${colors.green}✨ Translations 'vi' and 'en' are perfectly synced!${colors.reset}\n`);
}

console.log(`==========================================`);
if (ghostKeys.length === 0 && unusedKeys.length === 0 && missingInEn.length === 0 && missingInVi.length === 0) {
    console.log(`${colors.green}${colors.bright}PASSED: Your i18n keys are clean and perfectly synced! 🚀${colors.reset}`);
} else {
    console.log(`${colors.yellow}DONE: Audit completed with findings.${colors.reset}`);
}
console.log(`==========================================\n`);
