const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(srcDir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Replace theme
  content = content.replace(/from\s+['"]\.\.\/\.\.\/theme['"]/g, "from '../../presentations/components/Theme'");
  content = content.replace(/from\s+['"]\.\.\/theme['"]/g, "from '../presentations/components/Theme'");

  // Replace i18n
  content = content.replace(/from\s+['"]\.\.\/\.\.\/i18n['"]/g, "from '../../presentations/components/Language'");
  content = content.replace(/from\s+['"]\.\.\/i18n['"]/g, "from '../presentations/components/Language'");

  // Replace notifications
  content = content.replace(/from\s+['"]\.\.\/\.\.\/notifications['"]/g, "from '../../presentations/components/Notification'");
  content = content.replace(/from\s+['"]\.\.\/notifications['"]/g, "from '../presentations/components/Notification'");

  // Special cases for within presentations/components
  if (file.includes('NotificationProvider.tsx')) {
    content = content.replace(/from\s+['"]\.\.\/\.\.\/theme['"]/g, "from '../Theme'");
  }

  if (content !== originalContent) {
    console.log('Fixed imports in', file);
    fs.writeFileSync(file, content, 'utf8');
  }
});
