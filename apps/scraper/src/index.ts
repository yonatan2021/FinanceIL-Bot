import { pollQueue } from './worker.js';
import { setTimeout } from 'timers/promises';

const POLL_INTERVAL = 10000; // 10 seconds

async function main() {
  console.log('Starting scraper worker...');
  
  if (!process.env.ENCRYPTION_KEY) {
    console.error('FATAL: ENCRYPTION_KEY environment variable is required');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error('FATAL: DATABASE_URL environment variable is required');
    process.exit(1);
  }

  // Serial polling loop
  while (true) {
    try {
      await pollQueue();
    } catch (err) {
      console.error('Polling error:', err);
    }
    
    await setTimeout(POLL_INTERVAL);
  }
}

main().catch(console.error);
