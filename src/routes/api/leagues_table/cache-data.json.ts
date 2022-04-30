
// ... import $app `modules`;
import { dev } from '$app/env'

// ... import necessary LIBRARIES & MODULES;
import redis from "$lib/redis/init"

// ... DECLARING TYPESCRIPT-TYPES imports;
import type { Leagues_Table_Cache_Ready } from "$lib/models/leagues_table/types"

// ... server-variables;
let userGeo: string

/** 
 * @type {import('@sveltejs/kit').RequestHandler} 
*/
export async function post({ params, request }, res): Promise < any > {
    // ... ℹ extract the 'geo_js';
    userGeo = await request.json(); // or request.json(), etc
    // ... 🐛 DEBUGGING;
    if (dev) console.info('ℹ cache-data.json userGeo', userGeo)

    // ... ℹ check for cache-existance [IN THE USER-GEO-POS];
    const response_usergeo = await get_League_Table_FromCache(userGeo)
    // ... ℹ return RESPONSE;
    if (response_usergeo) {
        return {
            body: response_usergeo
        }
    }

    // ... ℹ otherwise, return the "EN" version - default;
    const response_en = await get_League_Table_FromCache('en')
    // ... ℹ return RESPONSE;
    if (response_en) {
        return {
            body: response_en
        }
    }

    // ... ℹ otherwise, there is NO BEST PLAYERS available;
    return {
        body: null
    }
}

// ~~~~~~~~~~~~~~~~~~~~~~~~
//     CACHING w/ REDIS
// ~~~~~~~~~~~~~~~~~~~~~~~~
// - get_League_Table_FromCache(geoPos)
// ~~~~~~~~~~~~~~~~~~~~~~~~

async function get_League_Table_FromCache(geoPos: string): Promise < Leagues_Table_Cache_Ready | Record < string, never > > {
    // ... ℹ TRY;
    try {
        // ... ℹ cached data retrival;
        const cached: string = await redis.hget('leagues_table', geoPos);
        // ... ℹ check for `cached` data
        if (cached) {
            // ... ℹ convert the data from `string` to `JSON`
            const parsed: Leagues_Table_Cache_Ready = JSON.parse(cached);
            // ... 🐛 DEBUGGING;
            if (dev) console.info(`✅ found leagues_table ${geoPos} in cache`);
            // ... ℹ return, cached data;
            return parsed;
        }
        return
    } 
    // ... ℹ CATCH, ERROR;
    catch (e) {
        // ... ℹ error, return;
        console.debug("❌ unable to retrieve from cache", geoPos, e);
        return
    }
    // ... error, return;
    return
}