import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

/**
 * MELOVISTA DEVOPS — DEPLOY PIPELINE v3
 *
 * Quy trình: User commit thủ công → chạy deploy → retry tường minh nếu publish fail.
 * 
 * CÁCH DÙNG:
 * 1. Commit thủ công:  git add . && git commit -m "..." && git push
 * 2. Chạy deploy:     npm run deploy -- --type=patch --target=win
 * 3. Nếu publish fail: npm run deploy -- --retry --target=win
 * 
 * THAM SỐ:
 * --type   : major | minor | patch (mặc định: patch). Bỏ qua khi có --retry.
 * --target : win | mac | linux (mặc định: win)
 * --retry  : Build/publish lại version hiện tại, không bump version hoặc tạo tag mới.
 */

// --- CONFIGURATION ---
const ROOT_PKG_PATH = path.resolve('package.json');
const DESKTOP_PKG_PATH = path.resolve('apps/desktop/package.json');
const DESKTOP_DIR = path.resolve('apps/desktop');
const RELEASE_DIR = path.join(DESKTOP_DIR, 'release');

const ARGS = process.argv.slice(2);
const TYPE = ARGS.find(arg => arg.startsWith('--type='))?.split('=')[1] || 'patch';
const TARGET = ARGS.find(arg => arg.startsWith('--target='))?.split('=')[1] || 'win';
const IS_RETRY = ARGS.includes('--retry');

const VALID_RELEASE_TYPES = new Set(['major', 'minor', 'patch']);
const VALID_TARGETS = new Set(['win', 'mac', 'linux']);
const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

const COLORS = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
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

/**
 * Kiểm tra xem git tag đã tồn tại ở local hoặc remote hay chưa.
 */
const tagExists = (tag) => {
    try {
        const localTags = execSync(`git tag -l "${tag}"`, { encoding: 'utf8' }).trim();
        if (localTags.length > 0) return true;

        const remoteTags = execSync(`git ls-remote --tags origin refs/tags/${tag}`, {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore']
        }).trim();
        return remoteTags.length > 0;
    } catch {
        return false;
    }
};

// ============================================================================
// PHASE 0: FATAL CHECKS
// ============================================================================
log('🛡️  PHASE 0: KIỂM TRA SINH TỬ...', COLORS.yellow);

// Đảm bảo GITHUB_TOKEN cũng được thiết lập cho electron-builder
if (process.env.GH_TOKEN && !process.env.GITHUB_TOKEN) {
    process.env.GITHUB_TOKEN = process.env.GH_TOKEN;
}

if (!process.env.GH_TOKEN) {
    error('THIẾU GITHUB TOKEN (process.env.GH_TOKEN). Auto-publish sẽ crash nếu không có token!');
}

if (!VALID_RELEASE_TYPES.has(TYPE)) {
    error(`Loại release không hợp lệ: ${TYPE}. Chỉ chấp nhận major, minor hoặc patch.`);
}

if (!VALID_TARGETS.has(TARGET)) {
    error(`Target không hợp lệ: ${TARGET}. Chỉ chấp nhận win, mac hoặc linux.`);
}

// Kiểm tra working tree sạch (user phải commit trước)
try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
    if (status) {
        log('\n⚠️  Working tree có thay đổi chưa commit:', COLORS.yellow);
        log(status, COLORS.yellow);
        error('Hãy commit thủ công trước khi chạy deploy!\n  git add . && git commit -m "..." && git push');
    }
} catch (e) {
    error(`Không thể kiểm tra git status: ${e.message}`);
}

// ============================================================================
// PHASE 1: VALIDATE — EARLY ESCAPE
// ============================================================================
log('\n🔍 PHASE 1: VALIDATE (Early Escape)...', COLORS.yellow);

// TypeScript check toàn dự án
run('npx tsc --noEmit', 'TypeScript Check');

// Full build check (tsc -b + vite build) — thoát sớm nếu có lỗi
run('npm run build --workspace=apps/desktop', 'UI Build Check');

log('\n✅ Validation passed!', COLORS.green);

// ============================================================================
// SMART RETRY DETECTION
// ============================================================================
const rootPkg = JSON.parse(fs.readFileSync(ROOT_PKG_PATH, 'utf8'));
const desktopPkg = JSON.parse(fs.readFileSync(DESKTOP_PKG_PATH, 'utf8'));
const currentVersion = rootPkg.version;

if (!SEMVER_PATTERN.test(currentVersion) || !SEMVER_PATTERN.test(desktopPkg.version)) {
    error(`Version phải có định dạng SemVer x.y.z. Root=${currentVersion}, Desktop=${desktopPkg.version}`);
}

if (currentVersion !== desktopPkg.version) {
    error(`Version không đồng bộ. Root=${currentVersion}, Desktop=${desktopPkg.version}`);
}

let newVersion = currentVersion;

if (IS_RETRY) {
    const retryTag = `v${currentVersion}`;
    if (!tagExists(retryTag)) {
        error(`Không thể retry ${retryTag}: tag chưa tồn tại ở local hoặc origin.`);
    }

    log(`\n⚡ RETRY MODE: Build/publish lại ${retryTag}.`, COLORS.cyan);
    log('   Bỏ qua Phase 2 (version/tag).', COLORS.cyan);
}

// ============================================================================
// PHASE 2: SEMVER + TAG + PUSH (chỉ chạy lần đầu)
// ============================================================================
if (!IS_RETRY) {
    log('\n🚀 PHASE 2: SEMVER + TAG + PUSH...', COLORS.yellow);

    const oldVersion = currentVersion;
    let [major, minor, patch] = oldVersion.split('.').map(Number);

    if (TYPE === 'major') { major++; minor = 0; patch = 0; }
    else if (TYPE === 'minor') { minor++; patch = 0; }
    else { patch++; }

    newVersion = `${major}.${minor}.${patch}`;
    log(`\nVersioning: ${oldVersion} → ${newVersion} (Type: ${TYPE})`, COLORS.green);

    const newTag = `v${newVersion}`;
    if (tagExists(newTag)) {
        error(`Không thể phát hành ${newTag}: tag đã tồn tại. Dùng --retry nếu muốn publish lại version hiện tại.`);
    }

    // Cập nhật cả 2 file package.json
    rootPkg.version = newVersion;
    desktopPkg.version = newVersion;
    fs.writeFileSync(ROOT_PKG_PATH, JSON.stringify(rootPkg, null, 2) + '\n');
    fs.writeFileSync(DESKTOP_PKG_PATH, JSON.stringify(desktopPkg, null, 2) + '\n');

    // Git commit chỉ version files
    run('git add package.json apps/desktop/package.json', 'Git Add Version Files');
    run(`git commit -m "release: v${newVersion}"`, 'Git Commit Version');
    run(`git tag ${newTag}`, 'Git Tag');
    run('git push origin HEAD', 'Git Push Origin');
    run('git push origin --tags', 'Git Push Tags');

    // Pre-create GitHub Draft Release
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
                body: `Release v${newVersion}`,
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
}

// ============================================================================
// PHASE 3: CLEANUP + BUILD + PUBLISH (retry-safe)
// ============================================================================
log(`\n🏗️  PHASE 3: CLEANUP + BUILD + PUBLISH (${TARGET.toUpperCase()})...`, COLORS.yellow);

// --- 3a: Dọn dẹp stale build artifacts ---
log('\n🧹 Cleaning stale build artifacts...', COLORS.blue);

const winUnpacked = path.join(RELEASE_DIR, 'win-unpacked');
const winUnpackedTmp = path.join(RELEASE_DIR, 'win-unpacked.tmp');

const cleanBuildDirectory = (dir) => {
    if (!fs.existsSync(dir)) return;

    const relPath = path.relative(process.cwd(), dir);
    log(`  Removing: ${relPath}`, COLORS.yellow);

    try {
        fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 1000 });
        log(`  ✅ Removed: ${relPath}`, COLORS.green);
        return;
    } catch (removeError) {
        const quarantineDir = `${dir}.stale-${Date.now()}`;
        const quarantineRelPath = path.relative(process.cwd(), quarantineDir);

        log(`  ⚠️ Could not remove ${relPath}: ${removeError.message}`, COLORS.yellow);
        log(`  → Attempting to quarantine it as ${quarantineRelPath}...`, COLORS.yellow);

        try {
            fs.renameSync(dir, quarantineDir);
            log(`  ✅ Quarantined locked build directory: ${quarantineRelPath}`, COLORS.green);
            return;
        } catch (renameError) {
            log(`  ⚠️ Locked directory will be left untouched: ${relPath}`, COLORS.yellow);
            log(`    Remove failed: ${removeError.message}`, COLORS.yellow);
            log(`    Rename failed: ${renameError.message}`, COLORS.yellow);
            log('  → Build will continue in a new isolated output directory.', COLORS.cyan);
        }
    }
};

for (const dir of [winUnpackedTmp, winUnpacked]) {
    cleanBuildDirectory(dir);
}

// Auto-prune old installers (giữ 2 bản mới nhất)
if (fs.existsSync(RELEASE_DIR)) {
    const installers = fs.readdirSync(RELEASE_DIR)
        .filter(f => f.endsWith('.exe') && f.startsWith('Melovista Setup'))
        .sort((a, b) => {
            const vA = a.match(/(\d+\.\d+\.\d+)/)?.[1] || '0.0.0';
            const vB = b.match(/(\d+\.\d+\.\d+)/)?.[1] || '0.0.0';
            return vB.localeCompare(vA, undefined, { numeric: true });
        });

    const KEEP_COUNT = 2;
    if (installers.length > KEEP_COUNT) {
        log(`\n🗑️  Pruning old installers (keeping ${KEEP_COUNT} latest)...`, COLORS.blue);
        for (const installer of installers.slice(KEEP_COUNT)) {
            const installerPath = path.join(RELEASE_DIR, installer);
            const blockmapPath = installerPath + '.blockmap';
            try {
                fs.unlinkSync(installerPath);
                if (fs.existsSync(blockmapPath)) fs.unlinkSync(blockmapPath);
                log(`  Deleted: ${installer}`, COLORS.yellow);
            } catch (e) {
                log(`  ⚠️ Could not delete ${installer}: ${e.message}`, COLORS.yellow);
            }
        }
    }
}

// --- 3b: Build frontend assets ---
// Chỉ chạy vite build (không lặp lại tsc -b vì Phase 1 đã validate)
log('\n📦 Building frontend assets (vite only)...', COLORS.blue);
run('npx vite build', 'Vite Build', { cwd: DESKTOP_DIR });

// --- 3c: Build & Publish Electron app ---
log('\n📦 Packaging & Publishing Electron app...', COLORS.blue);
const isolatedOutputDir = `release/deploy-${newVersion}-${Date.now()}`;
log(`  Isolated output: apps/desktop/${isolatedOutputDir}`, COLORS.cyan);
const buildCmd = `npx electron-builder build --${TARGET} --publish always -c.directories.output="${isolatedOutputDir}"`;
run(buildCmd, 'Electron Build & Publish', { 
    cwd: DESKTOP_DIR,
    env: {
        GH_TOKEN: process.env.GH_TOKEN,
        GITHUB_TOKEN: process.env.GH_TOKEN
    }
});

log(`\n✅ THÀNH CÔNG! Bản v${newVersion} đã được phát hành lên GitHub Releases.`, COLORS.green);
