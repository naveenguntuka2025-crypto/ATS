import { Queue } from "bullmq";
import { createRedisConnection } from "./redis";

// ---------------------------------------------------------------------------
// Background Worker / Queue pattern for mass email.
//
// Why: firing thousands of synchronous SES API calls from a request handler
// blocks the app on a slow/rate-limited external API and risks the request
// timing out or the process falling over under a big campaign. Instead:
//
//   1. A recruiter clicks "Send campaign" for N candidates.
//   2. The app saves an EmailCampaign row and enqueues N individual jobs
//      (one per recipient) onto this Redis-backed queue, then returns
//      immediately — the UI says "campaign queued", not "sending...".
//   3. A separate worker process (workers/email-worker.ts, run via
//      `npm run worker:email`) pulls jobs off the queue and sends them at a
//      throttled rate (see MASS_EMAIL_RATE_LIMIT below) so we stay under
//      SES/ISP sending limits regardless of campaign size.
//
// In production, the web process and the worker process are deployed and
// scaled independently (e.g. a web dyno + a worker dyno), both pointed at
// the same Redis instance via REDIS_URL.
// ---------------------------------------------------------------------------

export const MASS_EMAIL_QUEUE_NAME = "mass-email";

// Throttle: at most this many jobs processed per `duration` ms, applied by
// the Worker (see workers/email-worker.ts) regardless of how many jobs are
// queued at once. 5/sec is a conservative default under most SES sending
// rate limits — tune to your account's actual quota.
export const MASS_EMAIL_RATE_LIMIT = { max: 5, duration: 1000 };

export type MassEmailJobData = {
  campaignId: string;
  recipientId: string;
  email: string;
  name?: string;
  subject: string;
  body: string;
};

let queue: Queue<MassEmailJobData> | null = null;

/** Lazily-created singleton so we open one Redis connection per process, not one per call. */
export function getMassEmailQueue(): Queue<MassEmailJobData> {
  if (!queue) {
    queue = new Queue<MassEmailJobData>(MASS_EMAIL_QUEUE_NAME, {
      connection: createRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { age: 24 * 3600, count: 5000 },
        removeOnFail: { age: 7 * 24 * 3600 },
      },
    });
  }
  return queue;
}
