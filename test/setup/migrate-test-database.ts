import { execFileSync } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

execFileSync(npmCommand, ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  env: process.env,
});
