const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p, callback);
    } else {
      if (p.endsWith('.js')) callback(p);
    }
  });
}

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace ../utils/helpers.js with @dictaflow/shared
  content = content.replace(/import\s+{([^}]+)}\s+from\s+['"](?:\.\.\/|\.\/)utils\/(?:helpers\.js|constants\.js)['"]/g, "import { $1 } from '@dictaflow/shared'");
  content = content.replace(/import\s+{([^}]+)}\s+from\s+['"](?:\.\.\/|\.\/)core\/(?:api\.js|store\.js|audioManager\.js)['"]/g, "import { $1 } from '@dictaflow/shared'");
  content = content.replace(/import\s+api\s+from\s+['"](?:\.\.\/|\.\/)core\/api\.js['"]/g, "import { api } from '@dictaflow/shared'");
  content = content.replace(/import\s+{([^}]+)}\s+from\s+['"](?:\.\.\/|\.\/)components\/Toast\.js['"]/g, "import { $1 } from '@dictaflow/shared'");
  content = content.replace(/import\s+{([^}]+)}\s+from\s+['"](?:\.\.\/|\.\/)Toast\.js['"]/g, "import { $1 } from '@dictaflow/shared'");
  content = content.replace(/import\s+{([^}]+)}\s+from\s+['"]\.\/Toast\.js['"]/g, "import { $1 } from '@dictaflow/shared'");

  // Replace duplicate imports (naive) by letting the user or bundler handle it, or we can just leave it as multiple lines.
  // Vite can handle multiple imports from the same package.

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
}

const userAppDir = path.join(__dirname, '..', 'packages', 'user-app', 'src');
const adminAppDir = path.join(__dirname, '..', 'packages', 'admin-app', 'src');

walk(userAppDir, processFile);
walk(adminAppDir, processFile);
console.log('Done replacing imports');
