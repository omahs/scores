import { dev } from '$app/environment';
import fs from 'fs';
import { performance } from 'perf_hooks';
import { error, json } from '@sveltejs/kit';

import { initGrapQLClient } from '$lib/graphql/init_graphQL';
import { REDIS_CACHE_FIXTURE_PROBABILITIES_0, REDIS_CACHE_FIXTURE_PROBABILITIES_1 } from '$lib/graphql/fixtures/probabilities/query';

import type { 
  Fixture_Probabilities,
  BETARENA_HASURA_SURGICAL_JSONB_historic_fixtures,
  BETARENA_HASURA_probabilities_query,
  REDIS_CACHE_SINGLE_probabilities_translation
} from '$lib/models/fixtures/probabilities/types';
import { GET_HREFLANG_DATA } from '$lib/graphql/query';

// [ℹ] debug info
const logs = [];
let t0;
let t1;

// ~~~~~~~~~~~~~~~~~~~~~~~~
//  [MAIN] ENDPOINT METHOD
// ~~~~~~~~~~~~~~~~~~~~~~~~

export async function GET(req, res): Promise<unknown> {

	const lang: string = req.url['searchParams'].get('lang');
	const fixture_id: string = req.url['searchParams'].get('fixture_id');

  // [ℹ] target widget [data]
  if (fixture_id) {
		const response_hasura = await main(fixture_id);
		if (response_hasura) {
			return json(response_hasura);
		}
	}

  // [ℹ] target widget [translation]
	if (lang) {
		const response_hasura = await main_trans_and_seo(lang);
		if (response_hasura) {
			return json(response_hasura);
		}
	}

	return json(null);
}

// ~~~~~~~~~~~~~~~~~~~~~~~~
//  [MAIN] METHOD
// ~~~~~~~~~~~~~~~~~~~~~~~~

async function main (
  _fixture_id: string
): Promise < unknown | null > {
	// [ℹ] relying on Fixture Id
	// [ℹ] to get Target Fixture
	// [ℹ] and return

	const FIXTURE_ID = parseInt(_fixture_id);

	/**
	 * [ℹ] obtain target historic_fixtures [fixture_id]
  */

	const fixture = await get_target_fixture(FIXTURE_ID);
	// [ℹ] exit
	if (fixture == undefined) {
		return null;
	}

	const fixture_data = fixture[0];

	/**
	 * [ℹ] generate FIXTURE data
  */

  const fixture_id = fixture_data?.id;
  const probabilites_data = fixture_data?.probabilities

  // [ℹ] generate [final] fixture object
  const fixture_object: Fixture_Probabilities = {
    id:             fixture_id || null,
    probabilites:   probabilites_data || null
  }

  // [ℹ] return fixture
	return fixture_object;
}

async function main_trans_and_seo (
  lang: string
) {

  const response = await get_widget_translations(
    lang
  )

  /**
   * [ℹ] MAIN 
  */

  const object: REDIS_CACHE_SINGLE_probabilities_translation = {}
  object.lang = lang

  const objectFixOdds = response.scores_fixture_probabilities_translations
    .find(({ lang }) => lang === lang)

  const objectFixGeneralTranslation = response.scores_general_translations
    .find(({ lang }) => lang === lang)

  const mergedObj = {
    ...object, 
    ...objectFixOdds?.data,
    ...objectFixGeneralTranslation?.widgets_no_data_available
  }

  // [🐞]
  /*
    if (dev) {
      const data = JSON.stringify(fix_odds_translation_map.values(), null, 4)
      fs.writeFile('./datalog/main_trans_and_seo.json', data, err => {
        if (err) {
          console.error(err);
        }
      });
    }
  */

  return mergedObj
}

// ~~~~~~~~~~~~~~~~~~~~~~~~
//  [HELPER] OTHER METHODS
// ~~~~~~~~~~~~~~~~~~~~~~~~

async function get_target_fixture(
	fixture_id: number
): Promise<BETARENA_HASURA_SURGICAL_JSONB_historic_fixtures[]> {
	// [ℹ] obtain target historic_fixtures [fixture_id]
	const queryName = 'REDIS_CACHE_FIXTURE_PROBABILITIES_0';
	t0 = performance.now();
	const VARIABLES = {
		fixture_id: fixture_id
	};
	const response: BETARENA_HASURA_probabilities_query = await initGrapQLClient().request(
		REDIS_CACHE_FIXTURE_PROBABILITIES_0,
		VARIABLES
	);
	t1 = performance.now();
	logs.push(`${queryName} completed in: ${(t1 - t0) / 1000} sec`);

	return response.historic_fixtures;
}

async function get_hreflang (
  lang: string
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
  lang: string
): Promise < BETARENA_HASURA_probabilities_query > {

  const queryName = "REDIS_CACHE_FIXTURE_PROBABILITIES_1";
  const t0 = performance.now();
  const VARIABLES = {
		lang: lang
	};
  const response: BETARENA_HASURA_probabilities_query = await initGrapQLClient().request (
    REDIS_CACHE_FIXTURE_PROBABILITIES_1,
    VARIABLES
  );
  const t1 = performance.now();
  logs.push(`${queryName} completed in: ${(t1 - t0) / 1000} sec`);

  return response;
}