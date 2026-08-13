const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..', '..');
const e2eDir = path.join(projectRoot, 'e2e');
const outFile = 'C:\\Temp\\e2e-hook-out.txt';

const APP_PORT = 5173;

function changedFeatureFiles() {
  const run = (cmd) => {
    try {
      return execSync(cmd, { cwd: projectRoot, encoding: 'utf8' });
    } catch {
      return '';
    }
  };

  const lines = [
    ...run('git diff --name-only --cached').split('\n'),
    ...run('git diff --name-only').split('\n'),
    ...run('git ls-files --others --exclude-standard').split('\n'),
  ];

  return lines.some(f => f && /^(src|components|amplify)\//.test(f));
}

function isPortUp(port) {
  return new Promise((resolve) => {
    const req = http.get({ hostname: 'localhost', port, path: '/', timeout: 2000 }, () => resolve(true));
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

function rewake(additionalContext) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'Stop', additionalContext },
  }));
  process.exit(2);
}

async function main() {
  if (!changedFeatureFiles()) return;
  if (!fs.existsSync(path.join(e2eDir, 'playwright.config.ts'))) return;

  if (!(await isPortUp(APP_PORT))) {
    rewake(`E2E tests skipped — app :${APP_PORT} not running. Start "npm run dev" if you want test coverage.`);
    return;
  }

  if (!fs.existsSync('C:\\Temp')) fs.mkdirSync('C:\\Temp', { recursive: true });

  spawnSync(
    'cmd',
    ['/c', `node_modules\\.bin\\playwright.cmd test --config=playwright.config.ts --reporter=list > "${outFile}" 2>&1`],
    { cwd: e2eDir },
  );

  const output = fs.existsSync(outFile)
    ? fs.readFileSync(outFile, 'utf8').trim()
    : '(no output)';

  rewake(`E2E results after your changes:\n${output}`);
}

main();
