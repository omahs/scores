import { dev } from '$app/env'

import Bull from 'bull';

/** 
 * @type {import('@sveltejs/kit').RequestHandler} 
*/
export async function get (req: { url: { [x: string]: { get: (arg0: string) => string; }; }; }, res: any): Promise < unknown > {

  const jobQueueName: string = req.url['searchParams'].get('jobQueueName');
  const jobId: string = req.url['searchParams'].get('jobId');

  const cacheQueueJob = new Bull(jobQueueName, 
  {
    redis: { 
      port: import.meta.env.VITE_REDIS_BULL_ENDPOINT.toString(), 
      host: import.meta.env.VITE_REDIS_BULL_HOST.toString(), 
      password: import.meta.env.VITE_REDIS_BULL_PASS.toString(), 
      tls: {}
    }
  });

  const jobW = await cacheQueueJob.getJob(jobId);

  if (jobW === null) {
    // [ℹ] ALT
    // res.status(404).end();
    // [ℹ] ALT 2
    return {
      status: 404,
      body: {
        msg: null
      }
    }
  } else {    
    // [ℹ] ALT
    // res.json({ jobId, state, progress, reason });
    const state = await jobW.getState();
    const progress = jobW.progress;
    const attemptsMade = jobW.attemptsMade;
    const processedOn = jobW.processedOn;
    const finishedOn = jobW.finishedOn;
    const reason = jobW.failedReason;
    const result = jobW.returnvalue;
    // [ℹ] ALT 2
    return {
        status: 200,
        body: { 
          job_id: jobId,
          state: state,
          attemptsMade: attemptsMade,
          processedOn: processedOn,
          finishedOn: finishedOn,
          progress: progress,
          reason: reason,
          result: result
        }
      }
    }
} 