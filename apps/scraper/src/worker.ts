import { db } from '@finance-bot/db';
import { jobQueue } from '@finance-bot/db/schema';
import { eq, and, lte, inArray, asc } from 'drizzle-orm';
import { runScraperForCredential } from './scraper.js';

export async function pollQueue() {
  try {
    const now = new Date();
    
    // Find one pending job ordered by urgency (runAfter) then age (createdAt)
    const pendingJobs = await db.select()
      .from(jobQueue)
      .where(
        and(
          inArray(jobQueue.status, ['pending', 'failed']),
          lte(jobQueue.runAfter, now),
          eq(jobQueue.type, 'scrape_credential')
        )
      )
      .orderBy(asc(jobQueue.runAfter), asc(jobQueue.createdAt))
      .limit(1);

    if (pendingJobs.length === 0) return;
    const targetJob = pendingJobs[0];

    if (targetJob.attempts >= targetJob.maxAttempts) {
       await db.update(jobQueue).set({ status: 'dead' }).where(eq(jobQueue.id, targetJob.id));
       return;
    }
    
    // Atomic lock to prevent race conditions. better-sqlite3 fully supports SQLite's RETURNING clause.
    const [job] = await db.update(jobQueue)
      .set({ status: 'running', startedAt: new Date(), attempts: targetJob.attempts + 1 })
      .where(and(
        eq(jobQueue.id, targetJob.id),
        inArray(jobQueue.status, ['pending', 'failed'])
      ))
      .returning();

    // If another worker grabbed it, skip
    if (!job) return;

    console.log(`Processing job ${job.id}`);
    
    try {
      const payload = JSON.parse(job.payload);
      await runScraperForCredential(payload.credentialId);

      // Mark as done
      await db.update(jobQueue)
        .set({ status: 'done', finishedAt: new Date(), result: 'Success' })
        .where(eq(jobQueue.id, job.id));
        
      console.log(`Finished job ${job.id}`);
    } catch (jobError) {
      console.error(`Job ${job.id} failed:`, jobError);
      
      // Robust error handling - mark job as failed
      await db.update(jobQueue)
        .set({ 
          status: 'failed', 
          finishedAt: new Date(), 
          lastError: jobError instanceof Error ? jobError.message : String(jobError) 
        })
        .where(eq(jobQueue.id, job.id));
    }
  } catch (sysError) {
    console.error('System error during polling:', sysError);
  }
}
