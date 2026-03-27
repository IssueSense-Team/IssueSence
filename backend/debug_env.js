import dotenv from 'dotenv';
dotenv.config();

console.log('Current working directory:', process.cwd());
console.log('GMAIL_USER present:', !!process.env.GMAIL_USER);
console.log('GMAIL_APP_PASSWORD present:', !!process.env.GMAIL_APP_PASSWORD);
console.log('GMAIL_USER value length:', process.env.GMAIL_USER ? process.env.GMAIL_USER.length : 0);
console.log('GMAIL_APP_PASSWORD value length:', process.env.GMAIL_APP_PASSWORD ? process.env.GMAIL_APP_PASSWORD.length : 0);
