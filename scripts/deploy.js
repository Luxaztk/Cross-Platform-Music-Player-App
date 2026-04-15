import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const pkgPath = path.resolve('apps/desktop/package.json');
const commitMsgPath = path.resolve('commit.txt');

// 1. Đọc file commit.txt
if (!fs.existsSync(commitMsgPath)) {
  console.error('Lỗi: Không tìm thấy file commit.txt!');
  process.exit(1);
}
const commitMessage = fs.readFileSync(commitMsgPath, 'utf8').trim();
if (!commitMessage) {
  console.error('Lỗi: commit.txt đang trống!');
  process.exit(1);
}

// 2. Tăng version trong package.json (Patch version: 1.0.1 -> 1.0.2)
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const oldVersion = pkg.version;
const versionParts = oldVersion.split('.');
versionParts[2] = parseInt(versionParts[2]) + 1;
const newVersion = versionParts.join('.');
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

console.log(`🚀 Đang nâng cấp: ${oldVersion} -> ${newVersion}`);

try {
  // 3. Git add & commit
  console.log('📝 Đang commit code...');
  execSync('git add .');
  execSync(`git commit -m "release: v${newVersion} - ${commitMessage}"`);

  // 4. Chạy Build (Dùng build:win để đẩy lên GitHub hoặc build:local để test máy)
  console.log('🏗️ Đang bắt đầu build bản Release...');
  // Thay 'build:win' bằng 'build:local' nếu bạn muốn tự tay upload GitHub sau
  execSync('npm run build:win --workspace=apps/desktop', { stdio: 'inherit' });

  // 5. Dọn dẹp
  fs.writeFileSync(commitMsgPath, ''); // Xóa trống file commit sau khi xong
  console.log(`✅ Đã xong! Bản v${newVersion} đã sẵn sàng.`);
} catch (error) {
  console.error('❌ Có lỗi xảy ra trong pipeline:', error.message);
}