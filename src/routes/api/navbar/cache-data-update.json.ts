import { dev } from '$app/env'
import redis from "$lib/redis/init"
import { initGrapQLClient } from '$lib/graphql/init_graphQL';
import { GET_NAVBAR_DATA } from '$lib/graphql/header/query';
import { performance } from 'perf_hooks';
import Bull from 'bull';

import type { 
  Cache_Single_Lang_Header_Translation_Response, 
  Hasura_Header_Translation_Response 
} from '$lib/models/navbar/types';

// ~~~~~~~~~~~~~~~~~~~~~~~~
// [❗] BULL CRITICAL
// ~~~~~~~~~~~~~~~~~~~~~~~~

const settings = {
  stalledInterval: 300000, // How often check for stalled jobs (use 0 for never checking).
  guardInterval: 5000, // Poll interval for delayed jobs and added jobs.
  drainDelay: 300 // A timeout for when the queue is in drained state (empty waiting for jobs).
}
const cacheQueueNavbar = new Bull (
  'cacheQueueNavbar', 
  { 
    redis: { 
      port: import.meta.env.VITE_REDIS_BULL_ENDPOINT.toString(), 
      host: import.meta.env.VITE_REDIS_BULL_HOST.toString(), 
      password: import.meta.env.VITE_REDIS_BULL_PASS.toString(), 
      tls: {}
    },
    settings: settings
  }
);
const cacheTarget = "REDIS CACHE | navbar"
let logs = []

// ~~~~~~~~~~~~~~~~~~~~~~~~
//  [MAIN] ENDPOINT METHOD
// ~~~~~~~~~~~~~~~~~~~~~~~~

export async function post(): Promise < unknown > {

  // [🐛] debug
  if (dev) console.log(`
    ℹ ${cacheTarget} 
    at: ${new Date().toDateString()}
  `);

  // [ℹ] producers [JOBS]
  const job = await cacheQueueNavbar.add({});

  console.log(`
    job_id: ${job.id}
  `)

  return {
    status: 200,
    body: { 
      job_id: job.id
    }
  }
}

// ~~~~~~~~~~~~~~~~~~~~~~~~
//  [MAIN] CACHING METHODS
// ~~~~~~~~~~~~~~~~~~~~~~~~

async function cacheNavBar(lang: string, json_cache: Cache_Single_Lang_Header_Translation_Response) {
  try {
    //[ℹ] persist redis (cache)
    await redis.hset('navbar_t', lang, JSON.stringify(json_cache));
    // [🐛] debug
    if (dev) console.debug('✅ navbar-data cached')
  } 
  catch (e) {
    console.error("❌ unable to cache", 'navbar-data', e);
  }
}

async function deleteCacheNavBar() {
  await redis.del('navbar_t')
  return
}

// ~~~~~~~~~~~~~~~~~~~~~~~~
//  [MAIN] BULL WORKERS 
// ~~~~~~~~~~~~~~~~~~~~~~~~

cacheQueueNavbar.process (async (job, done) => {
  // console.log(job.data.argumentList);

  logs = []
  logs.push(`${job.id}`);

  /* 
  do stuff
  */

  const t0 = performance.now();
  await main();
  const t1 = performance.now();

  if (dev) console.log(`
    ${cacheTarget} updated!
    completed in: ${(t1 - t0) / 1000} sec
  `)

  logs.push(`${cacheTarget} updated!`);
  logs.push(`completed in: ${(t1 - t0) / 1000} sec`);

  done(null, { logs: logs });

}).catch(err => {
  console.log(err)
});

// ~~~~~~~~~~~~~~~~~~~~~~~~
//  [MAIN] METHOD
// ~~~~~~~~~~~~~~~~~~~~~~~~

async function main() {

  // [ℹ] get HASURA-DB response;
  const response: Hasura_Header_Translation_Response = await initGrapQLClient().request(GET_NAVBAR_DATA);

  // [ℹ] get-all-exisitng-lang-translations;
  const langArray: string [] = response.scores_hreflang_dev
    .filter(a => a.link)         /* filter for NOT "null" */
    .map(a => a.link)            /* map each LANG */ 

  // [ℹ] push "EN"
  langArray.push('en')

  // [🐛] debug
  if (dev) console.debug("langArray", langArray)

  const finalCacheObj: Cache_Single_Lang_Header_Translation_Response = {
    lang: undefined,
    langArray: [],
    scores_header_fixtures_information: undefined,
    scores_header_links_dev: undefined,
    scores_header_translations_dev: undefined,
    scores_top_bar_messages_dev: undefined
  }

  // deleteCacheNavBar()

  // [ℹ] for-each available translation:
  for (const lang_ of langArray) {
    
    finalCacheObj.lang = lang_;

    finalCacheObj.scores_header_fixtures_information = response.scores_header_fixtures_information.find(( { lang } ) => lang_ === lang);  // [ℹ] single bottom-row-header-info
    finalCacheObj.scores_header_links_dev = response.scores_header_links_dev.find(( { lang } ) => lang_ === lang);                        // [ℹ] single lang-translated-links-terms
    finalCacheObj.scores_header_translations_dev = response.scores_header_translations_dev.find(( { lang } ) => lang_ === lang);          // [ℹ] single-translated-LANG-terms
    finalCacheObj.scores_top_bar_messages_dev = response.scores_top_bar_messages_dev.find(( { lang } ) => lang_ === lang);                // [ℹ] platform-top-ALERT-system
    finalCacheObj.langArray = langArray;  // [ℹ] languages available for PLATFORM

    // [ℹ] persist-cache-response;
    await cacheNavBar(lang_, finalCacheObj);
  }

  return;
}