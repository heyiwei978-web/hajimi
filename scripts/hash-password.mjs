// Generates the value for the HAJIMI_ADMIN_PASSWORD_HASH environment variable.
// Usage: node scripts/hash-password.mjs   (the password is read without echoing it)
import readline from 'node:readline';
import {hashPassword} from '../api/_auth.js';

const rl = readline.createInterface({input: process.stdin, output: process.stdout, terminal: true});
rl._writeToOutput = text => { if (!rl.muted) rl.output.write(text); };
rl.question('管理员密码: ', password => {
  rl.muted = false;
  rl.close();
  process.stdout.write('\n');
  if (password.length < 12) {
    console.error('密码至少需要 12 个字符。');
    process.exit(1);
  }
  console.log('\n把下面这一行填入 Vercel Environment Variables 的 HAJIMI_ADMIN_PASSWORD_HASH：\n');
  console.log(hashPassword(password));
});
rl.muted = true;
