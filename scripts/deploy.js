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

const run = (cmd, title, options = {}) => {
    log(`\n[${title}] > ${cmd}`, COLORS.blue);
    try {
        execSync(cmd, { 
            stdio: 'inherit', 
            cwd: options.cwd || process.cwd(),
            env: { ...process.env, ...options.env }
        });
    } catch (e) {
        error(`Lệnh thất bại: ${title}`);
    }
};

// --- PHASE 0: FATAL CHECK ---
log('🛡️  PHASE 0: KIỂM TRA SINH TỬ...', COLORS.yellow);

// Đảm bảo GITHUB_TOKEN cũng được thiết lập cho electron-builder
if (process.env.GH_TOKEN && !process.env.GITHUB_TOKEN) {
    process.env.GITHUB_TOKEN = process.env.GH_TOKEN;
}

if (!process.env.GH_TOKEN) {
    error('THIẾU GITHUB TOKEN (process.env.GH_TOKEN). Auto-publish sẽ crash nếu không có token!');
}

if (!fs.existsSync(COMMIT_MSG_PATH)) {
    error('Không tìm thấy file commit.txt!');
}

// Xử lý mã hóa và BOM cho commit.txt
let commitBody = fs.readFileSync(COMMIT_MSG_PATH, 'utf8');
// Loại bỏ UTF-8 BOM nếu có (thường gặp trên Windows)
if (commitBody.startsWith('\uFEFF')) {
    commitBody = commitBody.slice(1);
}
// Loại bỏ các ký tự rác do mã hóa sai (nếu file là UTF-16)
commitBody = commitBody.replace(/\0/g, '').trim();

if (!commitBody) {
    error('Nội dung commit.txt đang trống!');
}

// --- PHASE 1: FAST DRY-RUN ---
log('\n🔍 PHASE 1: FAST DRY-RUN (Validation)...', COLORS.yellow);

// Kiểm tra TypeScript toàn dự án
run('npx tsc --noEmit', 'TypeScript Check');

// Build thử UI của Desktop (Lần 1 để kiểm tra lỗi sớm)
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

// Sử dụng file tạm cho commit message để tránh lỗi shell escaping trên Windows
const tempCommitMsgPath = path.resolve('.temp_commit_msg');
fs.writeFileSync(tempCommitMsgPath, `release: v${newVersion}\n\n${commitBody}`, 'utf8');
try {
    run(`git commit -F "${tempCommitMsgPath}"`, 'Git Commit');
} finally {
    if (fs.existsSync(tempCommitMsgPath)) fs.unlinkSync(tempCommitMsgPath);
}

run(`git tag v${newVersion}`, 'Git Tag');
run('git push origin HEAD', 'Git Push Origin');
run('git push origin --tags', 'Git Push Tags');

// Pre-create the GitHub release to avoid electron-builder race condition (422 already_exists)
log('\n🚀 Creating GitHub Draft Release...', COLORS.blue);
try {
    const response = await fetch(`https://api.github.com/repos/Luxaztk/Cross-Platform-Music-Player-App/releases`, {
        method: 'POST',
        headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `Bearer ${process.env.GH_TOKEN}`,
            'User-Agent': 'Melovista-Deploy-Script',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            tag_name: `v${newVersion}`,
            name: `Melovista v${newVersion}`,
            body: commitBody,
            draft: true
        })
    });
    if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        log(`Warning: Failed to pre-create release: ${response.statusText} - ${JSON.stringify(errJson)}`, COLORS.yellow);
    } else {
        log(`✅ Pre-created GitHub release v${newVersion}`, COLORS.green);
    }
} catch (e) {
    log(`Warning: Error pre-creating release: ${e.message}`, COLORS.yellow);
}

// --- PHASE 4: REAL BUILD & AUTO-PUBLISH ---
log(`\n🏗️  PHASE 4: REAL BUILD & AUTO-PUBLISH (${TARGET.toUpperCase()})...`, COLORS.yellow);

// Dọn dẹp commit.txt sau khi đã dùng
fs.writeFileSync(COMMIT_MSG_PATH, '');

// 1. Build frontend assets (Đảm bảo có bản build mới nhất)
log('\n📦 Building frontend assets...', COLORS.blue);
run('npm run build', 'Vite Build', { cwd: path.resolve('apps/desktop') });

// 2. Build & Publish Electron app
log('\n📦 Packaging & Publishing Electron app...', COLORS.blue);
// Chạy trực tiếp trong apps/desktop để electron-builder nhận diện đúng ngữ cảnh
const buildCmd = `npx electron-builder build --${TARGET} --publish always`;
run(buildCmd, 'Electron Build & Publish', { 
    cwd: path.resolve('apps/desktop'),
    env: {
        GH_TOKEN: process.env.GH_TOKEN,
        GITHUB_TOKEN: process.env.GH_TOKEN
    }
});

log(`\n✅ THÀNH CÔNG! Bản v${newVersion} đã được phát hành lên GitHub Releases.`, COLORS.green);