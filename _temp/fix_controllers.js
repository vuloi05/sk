const fs = require('fs');
function fixDir(dir) {
  fs.readdirSync(dir).forEach(f => {
    const file = dir + '/' + f;
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/require\(['"]\.\.\/models/g, `require('../../models`);
    content = content.replace(/require\(['"]\.\.\/utils/g, `require('../../utils`);
    fs.writeFileSync(file, content);
  });
}
fixDir('./packages/server/controllers/admin');
fixDir('./packages/server/controllers/user');
