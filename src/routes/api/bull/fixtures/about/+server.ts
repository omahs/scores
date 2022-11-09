import { dev } from '$app/environment'
import { error, json } from '@sveltejs/kit';

import redis from "$lib/redis/init"
import { initGrapQLClient } from '$lib/graphql/init_graphQL';
import Bull from 'bull';
import { Queue, Worker } from 'bullmq';

import { GET_HREFLANG_DATA } from '$lib/graphql/query';
import { 
  REDIS_CACHE_FIXTURE_ABOUT_DATA_0, 
  REDIS_CACHE_FIXTURE_ABOUT_DATA_1, 
  REDIS_CACHE_FIXTURE_ABOUT_DATA_2
} from '$lib/graphql/fixtures/about/query';

import fs from 'fs';
import { performance } from 'perf_hooks';

import type {
  BETARENA_HASURA_historic_fixtures 
} from '$lib/models/hasura';
import type { 
  BETARENA_HASURA_about_query, 
  Fixture_About, 
  REDIS_CACHE_SINGLE_about_translation 
} from '$lib/models/fixtures/about/types';

// ~~~~~~~~~~~~~~~~~~~~~~~~
// [❗] BULL CRITICAL
// ~~~~~~~~~~~~~~~~~~~~~~~~

const cacheTarget = "REDIS CACHE | fixture about (all)"
const cacheQueueProcessName = "CQ_Fixture_About"
const cache_data_addr = "fixture_about_data"
const cache_trans_addr = "fixture_about_trans"

// NOTE: V1 Bull V3
const settings = {
  stalledInterval: 600000, // How often check for stalled jobs (use 0 for never checking).
  guardInterval: 5000, // Poll interval for delayed jobs and added jobs.
  drainDelay: 300 // A timeout for when the queue is in drained state (empty waiting for jobs).
}
const CQ_Fixture_About = new Bull (
  cacheQueueProcessName, 
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

// NOTE: V2 BullMQ
/*
  const CQ_Fixture_About = new Queue (
    cacheQueueProcessName,
    { 
      connection: { 
        port: 6379, 
        host: "localhost", 
        password: "J6*&+@yDsRhyPU4%"
      },
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 5
      }
    }
  );
*/

// [ℹ] debug info
let logs = []
let t0: number;
let t1: number;

// ~~~~~~~~~~~~~~~~~~~~~~~~
//  [MAIN] ENDPOINT METHOD
// ~~~~~~~~~~~~~~~~~~~~~~~~

export async function POST(): Promise < unknown > {

  // [ℹ] dev / local environment
  if (dev) {
    console.log(`${cacheTarget}`);
    console.log(`at: ${new Date().toDateString()}`);

    /*
      NOTE: Cache data:
      NOTE: Only current_season fixtures should be cached; 
    */

    /*
      NOTE: SEO Cache Data
      [ℹ] => All Cache is meant to be cached
    */
    const langArray = await getHrefLang()
    await main_trans_and_seo(langArray)
    await main(langArray)

    for (const log of logs) {
      console.log(log)
    }

    return json({
      job_id: cacheTarget + " done!"
    })
  }
  // [ℹ] otherwise prod.
  else {
    // [ℹ] producers add [JOB] to consumer [QUEUE]
    const job = await CQ_Fixture_About.add('job', {});
    console.log(`${cacheQueueProcessName} -> job_id: ${job.id}`)
    return json({
      job_id: job.id
    })
  }
  
}

// ~~~~~~~~~~~~~~~~~~~~~~~~
//  [MAIN] CACHING METHODS
// ~~~~~~~~~~~~~~~~~~~~~~~~

async function cache_data (
  id: string | number,
  json_cache: object
) {
  try {
    await redis.hset(cache_data_addr, id, JSON.stringify(json_cache));
  } 
  catch (e) {
    console.error(`❌ unable to cache ${cache_data_addr}`, e);
  }
}

async function cache_translation (
  id: string | number,
  json_cache: object
) {
  try {
    await redis.hset(cache_trans_addr, id, JSON.stringify(json_cache));
  } 
  catch (e) {
    console.error(`❌ unable to cache ${cache_trans_addr}`, e);
  }
}

// ~~~~~~~~~~~~~~~~~~~~~~~~
//  [MAIN] BULL WORKERS 
// ~~~~~~~~~~~~~~~~~~~~~~~~

// NOTE: V1 Bull V3
CQ_Fixture_About.process (async function (job, done) {
  // console.log(job.data.argumentList);
  // console.log(job.data)

  logs = []
  logs.push(`${job.id}`);

  /* 
  do stuff
  */

  const t0 = performance.now();
  const langArray = await getHrefLang()
  await main_trans_and_seo(langArray)
  await main(langArray)
  const t1 = performance.now();

  logs.push(`${cacheTarget} updated!`);
  logs.push(`completed in: ${(t1 - t0) / 1000} sec`);

  done(null, { logs: logs });

}).catch(err => {
  console.log(err)
});

// NOTE: V2 BullMQ
/**
const worker = new Worker (
  cacheQueueProcessName, 
  async job =>
  {
    logs = []
    logs.push(`JobId: ${job.id}`);

    const t0 = performance.now();
    const langArray = await getHrefLang()
    await main_trans_and_seo(langArray)
    await main(langArray)
    const t1 = performance.now();

    logs.push(`${cacheTarget} updated!`);
    logs.push(`completed in: ${(t1 - t0) / 1000} sec`);

    return { logs: logs };
  },
  {
    connection: { 
      port: 6379, 
      host: "localhost", 
      password: "J6*&+@yDsRhyPU4%"
    }
  }
);
*/

// ~~~~~~~~~~~~~~~~~~~~~~~~
//  [MAIN] METHOD
// ~~~~~~~~~~~~~~~~~~~~~~~~

async function main (
  langArray :string[]
) {

  /**
   * [ℹ] obtain target current season_id's
  */

  const current_seasons = await get_current_seasons()
  // eslint-disable-next-line prefer-const
  let current_seasons_arr: number[] = current_seasons?.scores_football_seasons_details.map(a => a.id)
  if (dev) current_seasons_arr = [19734] // [ℹ] manual update target seasons
  // if (dev) console.log(`current_seasons_arr`, current_seasons_arr)

  /**
  * [ℹ] obtain target historic_fixtures
  * [ℹ] convert to map
  */

  const h_fixtures_arr = await get_target_historic_fixtures(current_seasons_arr)
  const historic_fixtures_map = await generate_historic_fixtures_map(h_fixtures_arr)

  /**
   * [ℹ] data pre-processing
   * [ℹ] & persistance to cache [END]
  */

  // [🐞]
  const cache_data_arr: Fixture_About[] = []

  for (const [id, data] of historic_fixtures_map.entries()) {

    for (const lang_ of langArray) {
      
      const _id = id + "_" + lang_

      const data_point_root = 
        lang_ == "en"
            ? "seo_fixtures"
            : "seo_fixtures_" + lang_

      if (data[data_point_root] == undefined) {
        continue;
      }

      // [ℹ] generate [final] fixture object
      const fixture_object: Fixture_About = {
        seo_data: data[data_point_root]
      }

      await cache_data(_id, fixture_object)

      // [🐞]
      cache_data_arr.push(fixture_object)
    }

  }

  // [🐞]
  if (dev) {
    const data = JSON.stringify(cache_data_arr, null, 4)
    fs.writeFile(`./datalog/${cacheQueueProcessName}.json`, data, err => {
      if (err) {
        console.error(err);
      }
    });
  }

  return;
}

async function main_trans_and_seo (
  langArray :string[]
) {

  const res = await get_widget_translations()

  const fix_odds_translation_map = new Map <string, REDIS_CACHE_SINGLE_about_translation> ()

  /**
   * [ℹ] MAIN 
  */
  for (const lang_ of langArray) {

    const object: REDIS_CACHE_SINGLE_about_translation = {}
    object.lang = lang_

    const objectFixAbout = res.scores_fixture_about_translations
      .find(({ lang }) => lang === lang_)

    const objectFixGeneralTranslation = res.scores_general_translations
      .find(({ lang }) => lang === lang_)

    const mergedObj = {
      ...object, 
      ...objectFixAbout?.translations,
      ...objectFixGeneralTranslation?.widgets_no_data_available
    }

    fix_odds_translation_map.set(lang_, mergedObj)
  }

  // [🐛] debug
  if (dev) {
    const data = JSON.stringify(fix_odds_translation_map.values(), null, 4)
    fs.writeFile('./datalog/main_trans_and_seo.json', data, err => {
      if (err) {
        console.error(err);
      }
    });
  }

  // [ℹ] persist data
  t0 = performance.now();
  logs.push(`total lang's: ${fix_odds_translation_map.size}`)
  for (const [key, value] of fix_odds_translation_map.entries()) {
    await cache_translation(key, value);
  }
  t1 = performance.now();
  logs.push(`cache uplaod complete in: ${(t1 - t0) / 1000} sec`);

  return

}

// ~~~~~~~~~~~~~~~~~~~~~~~~
//  [HELPER] OTHER METHODS
// ~~~~~~~~~~~~~~~~~~~~~~~~

async function get_current_seasons (
): Promise < BETARENA_HASURA_about_query > {

  const t0 = performance.now();
  const queryName = "REDIS_CACHE_FIXTURE_ABOUT_DATA_0";
  const response: BETARENA_HASURA_about_query = await initGrapQLClient().request (
    REDIS_CACHE_FIXTURE_ABOUT_DATA_0
  );
  const t1 = performance.now();
  logs.push(`${queryName} completed in: ${(t1 - t0) / 1000} sec`);

  return response;
}
  
async function get_target_historic_fixtures (
  seasonIdsArr: number[]
): Promise < BETARENA_HASURA_historic_fixtures[] > {

  const limit = 1000;
  let offset = 0;
  let total_limit;

  let h_fixtures_arr: BETARENA_HASURA_historic_fixtures[] = [] 
  let counter = 0

  // [ℹ] obtain target historic_fixtures
  const queryName = "REDIS_CACHE_FIXTURE_ABOUT_DATA_1";
  t0 = performance.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {

    const VARIABLES = {
      limit: limit,
      offset: offset,
      seasonIds: seasonIdsArr
    }
    
    const response: BETARENA_HASURA_about_query = await initGrapQLClient().request (
      REDIS_CACHE_FIXTURE_ABOUT_DATA_1,
      VARIABLES
    );

    h_fixtures_arr = h_fixtures_arr.concat(response.historic_fixtures)

    // [ℹ] exit loop
    if (offset >= total_limit) {
      // [🐛] debug
      if (dev) console.log(`exiting loop`)
      logs.push(`total limit: ${total_limit}`)
      logs.push(`fixtures gathered: ${h_fixtures_arr.length}`)
      logs.push(`exiting loop after ${counter} iterations`)
      break;
    }

    total_limit = response.historic_fixtures_aggregate.aggregate.totalCount;
    offset += limit;
    counter++
  }
  t1 = performance.now();
  logs.push(`${queryName} completed in: ${(t1 - t0) / 1000} sec`);

  // [🐛] debug
  // FIXME: some duplicates [?]
  /*
    const mainArrIds = []
    for (const i of h_fixtures_arr) {
      mainArrIds.push(i.id)
    }
    const duplicates = mainArrIds.filter((e, i, a) => a.indexOf(e) !== i) // [2, 4]
    logs.push(`duplicates: ${duplicates.length}`)

    if (dev) {
      const data = JSON.stringify(duplicates, null, 4)
      await fs.writeFile(`./datalog/duplicates_local_main.json`, data);
    }
  */

  return h_fixtures_arr;
}

async function generate_historic_fixtures_map (
  h_fixtures_arr: BETARENA_HASURA_historic_fixtures[]
): Promise < Map <number, BETARENA_HASURA_historic_fixtures> > {
  const historic_fixtures_map = new Map <number, BETARENA_HASURA_historic_fixtures>()

  // [ℹ] conversion to hashmap
  t0 = performance.now();
  for (const h_fixture of h_fixtures_arr) {
    historic_fixtures_map.set(h_fixture.id, h_fixture);
  }
  t1 = performance.now();
  logs.push(`historic_fixtures_map generated with size: ${historic_fixtures_map.size}`)
  logs.push(`Hashmap conversion completed in: ${(t1 - t0) / 1000} sec`);

  return historic_fixtures_map;
}

async function getHrefLang (
): Promise < string[] > {
  // [ℹ] get KEY platform translations
  const response = await initGrapQLClient().request(GET_HREFLANG_DATA)

  // [ℹ] get-all-exisitng-lang-translations;
  const langArray: string [] = response.scores_hreflang
    .filter(a => a.link)         /* filter for NOT "null" */
    .map(a => a.link)            /* map each LANG */ 

  // [ℹ] push "EN"
  langArray.push('en')

  return langArray;
}

async function get_widget_translations (
): Promise < BETARENA_HASURA_about_query > {

  const t0 = performance.now();
  const queryName = "REDIS_CACHE_FIXTURE_ABOUT_DATA_2";
  const response: BETARENA_HASURA_about_query = await initGrapQLClient().request (
    REDIS_CACHE_FIXTURE_ABOUT_DATA_2
  );
  const t1 = performance.now();
  logs.push(`${queryName} completed in: ${(t1 - t0) / 1000} sec`);

  return response;
}