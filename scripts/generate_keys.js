const crypto = require('crypto');
const fs = require('fs');

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

let env = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf-8') : '';

if (!env.includes('JWT_PRIVATE_KEY')) {
  env += '\nJWT_PRIVATE_KEY="' + privateKey.replace(/\n/g, '\\n') + '"\n';
  env += 'JWT_PUBLIC_KEY="' + publicKey.replace(/\n/g, '\\n') + '"\n';
  fs.writeFileSync('.env', env);
  console.log('Keys generated and appended to .env');
} else {
  console.log('Keys already exist in .env');
}
