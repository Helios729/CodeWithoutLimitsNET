/**
 * Creates or promotes an administrator.
 *
 * The password is read from stdin rather than accepted as an argument, because
 * anything on a command line ends up in shell history and in the process list.
 *
 * Usage: npm run create-admin -w @cwl/api -- admin@codewithoutlimits.net "Full Name"
 */
import readline from 'node:readline';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { User } from '../models/User.js';
import { hashPassword } from '../services/auth.service.js';

const [email, displayName] = process.argv.slice(2);
if (!email || !displayName) {
  console.error('Usage: npm run create-admin -w @cwl/api -- <email> "<display name>"');
  process.exit(1);
}

function askHidden(prompt) {
  return new Promise((resolvePromise) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const onData = (char) => {
      if (['\n', '\r', '\u0004'].includes(char.toString())) process.stdin.removeListener('data', onData);
      else process.stdout.write('\u001b[2K\u001b[200D' + prompt);
    };
    process.stdin.on('data', onData);
    rl.question(prompt, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolvePromise(answer);
    });
  });
}

const password = await askHidden('Password (min 12 characters): ');
if (password.length < 12) {
  console.error('Password must be at least 12 characters.');
  process.exit(1);
}

await connectDatabase();

const existing = await User.findOne({ email: email.toLowerCase() });
if (existing) {
  existing.role = 'admin';
  existing.passwordHash = await hashPassword(password);
  existing.tokenVersion += 1;
  await existing.save();
  console.log(`Promoted ${email} to admin and reset the password.`);
} else {
  await User.create({
    email: email.toLowerCase(),
    displayName,
    passwordHash: await hashPassword(password),
    role: 'admin',
    emailVerifiedAt: new Date()
  });
  console.log(`Created admin ${email}.`);
}

await disconnectDatabase();
