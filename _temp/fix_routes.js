const fs = require('fs');
function fixDir(dir, prefix) {
  fs.readdirSync(dir).forEach(f => {
    const file = dir + '/' + f;
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/require\(['"]\.\.\/controllers/g, `require('../../controllers/${prefix}`);
    content = content.replace(/require\(['"]\.\.\/middlewares/g, `require('../../middlewares`);
    fs.writeFileSync(file, content);
  });
}
fixDir('./packages/server/routes/admin', 'admin');
fixDir('./packages/server/routes/user', 'user');
