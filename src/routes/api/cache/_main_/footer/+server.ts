import { json } from '@sveltejs/kit';

import {
	footer_cache_trans_addr,
	get_target_hset_cache_data
} from '../../std_main';

/** @type {import('./$types').RequestHandler} */
export async function GET(req): Promise<unknown> {
	const lang: string =
		req.url['searchParams'].get('lang');

	const response_cache =
		await get_target_hset_cache_data(
			footer_cache_trans_addr,
			lang
		);

	if (response_cache) {
		return json(response_cache);
	}

	return json(null);
}
