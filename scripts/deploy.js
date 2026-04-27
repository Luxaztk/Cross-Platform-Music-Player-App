import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

/**
 * MELOVISTA DEVOPS - AUTO-PUBLISH PIPELINE
 * Tuân thủ quy trình: Fast Dry-Run -> SemVer -> Git Tag -> Real Build -> Publish
 * 
 * HƯỚNG DẪN SỬ DỤNG:
 * 1. Đảm bảo file 'commit.txt' có nội dung mô tả thay đổi.
 * 2. Đảm bảo biến môi trường GH_TOKEN đã được thiết lập (export GH_TOKEN=xxx).
 * 3. Chạy lệnh theo các cú pháp sau:
 *    - Patch (v1.0.x): npm run deploy -- --type=patch --target=win
 *    - Minor (v1.x.0): npm run deploy -- --type=minor --target=win
 *    - Major (vX.0.0): npm run deploy -- --type=major --target=win
 * 
 * THAM SỐ:
 * --type   : major | minor | patch (mặc định: patch)
 * --target : win | mac | linux (mặc định: win)
 */

// --- CONFIGURATION ---
const ROOT_PKG_PATH = path.resolve('package.json');
const DESKTOP_PKG_PATH = path.resolve('apps/desktop/package.json');
const COMMIT_MSG_PATH = path.resolve('commit.txt');

const ARGS = process.argv.slice(2);
const TYPE = ARGS.find(arg => arg.startsWith('--type='))?.split('=')[1] || 'patch'; // major | minor | patch
const TARGET = ARGS.find(arg => arg.startsWith('--target='))?.split('=')[1] || 'win'; // win | mac | linux

const COLORS = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

// --- HELPERS ---
const log = (msg, color = COLORS.reset) => console.log(`${color}${msg}${COLORS.reset}`);
const error = (msg) => { log(`\n❌ ERROR: ${msg}`, COLORS.red); process.exit(1); };

const run = (cmd, title) => {
    log(`\n[${title}] > ${cmd}`, COLORS.blue);
    try {
        execSync(cmd, { stdio: 'inherit' });
    } catch (e) {
        error(`Lệnh thất bại: ${title}`);
    }
};

// --- PHASE 0: FATAL CHECK ---
log('🛡️  PHASE 0: KIỂM TRA SINH TỬ...', COLORS.yellow);

if (!process.env.GH_TOKEN) {
    error('THIẾU GITHUB TOKEN (process.env.GH_TOKEN). Auto-publish sẽ crash nếu không có token!');
}

if (!fs.existsSync(COMMIT_MSG_PATH)) {
    error('Không tìm thấy file commit.txt!');
}

const commitBody = fs.readFileSync(COMMIT_MSG_PATH, 'utf8').trim();
if (!commitBody) {
    error('Nội dung commit.txt đang trống!');
}

// --- PHASE 1: FAST DRY-RUN ---
log('\n🔍 PHASE 1: FAST DRY-RUN (Validation)...', COLORS.yellow);

// Kiểm tra TypeScript toàn dự án
run('npx tsc --noEmit', 'TypeScript Check');

// Build thử UI của Desktop
run('npm run build --workspace=apps/desktop', 'UI Build Check');

// --- PHASE 2: SEMVER VERSIONING ---
log('\n🚀 PHASE 2: SEMVER VERSIONING...', COLORS.yellow);

const rootPkg = JSON.parse(fs.readFileSync(ROOT_PKG_PATH, 'utf8'));
const desktopPkg = JSON.parse(fs.readFileSync(DESKTOP_PKG_PATH, 'utf8'));

const oldVersion = rootPkg.version;
let [major, minor, patch] = oldVersion.split('.').map(Number);

if (TYPE === 'major') major++;
else if (TYPE === 'minor') minor++;
else patch++;

if (TYPE !== 'patch') patch = 0;
if (TYPE === 'major') minor = 0;

const newVersion = `${major}.${minor}.${patch}`;
log(`\nVersioning: ${oldVersion} -> ${newVersion} (Type: ${TYPE})`, COLORS.green);

// Cập nhật cả 2 file package.json
rootPkg.version = newVersion;
desktopPkg.version = newVersion;

fs.writeFileSync(ROOT_PKG_PATH, JSON.stringify(rootPkg, null, 2) + '\n');
fs.writeFileSync(DESKTOP_PKG_PATH, JSON.stringify(desktopPkg, null, 2) + '\n');

// --- PHASE 3: GIT TAGGING & PUSH ---
log('\n📝 PHASE 3: GIT TAGGING & PUSH...', COLORS.yellow);

run('git add .', 'Git Add');
run(`git commit -m "release: v${newVersion}\n\n${commitBody}"`, 'Git Commit');
run(`git tag v${newVersion}`, 'Git Tag');
run('git push origin HEAD', 'Git Push Origin');
run('git push origin --tags', 'Git Push Tags');

// --- PHASE 4: REAL BUILD & AUTO-PUBLISH ---
log(`\n🏗️  PHASE 4: REAL BUILD & AUTO-PUBLISH (${TARGET.toUpperCase()})...`, COLORS.yellow);

// Dọn dẹp commit.txt trước khi build
fs.writeFileSync(COMMIT_MSG_PATH, '');

const buildCmd = `npm run build:${TARGET} --workspace=apps/desktop -- --publish always`;
run(buildCmd, 'Electron Build & Publish');

log(`\n✅ THÀNH CÔNG! Bản v${newVersion} đã được phát hành lên GitHub Releases.`, COLORS.green);