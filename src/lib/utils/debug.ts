import { dev } from '$app/environment';

export const PAGE_INVALID_MSG = `Uh-oh! This page does not exist!`;
export const ERROR_CODE_INVALID = 404;
export const ERROR_CODE_PRELOAD = 500;
export const LAYOUT_1_LANG_PAGE_ERROR_MSG = `Uh-oh! There has been a pre-load error (/layout)`;
export const HOME_LANG_PAGE_ERROR_MSG = `Uh-oh! There has been a pre-load error (/lang)`;

/**
 * @param groupName
 * @param msg
 */
export function logErrorGroup(
	groupName: string,
	msg: string
) {
	console.groupCollapsed(groupName);
	msg = msg.replace(/\t/g, '');
	console.error(`${msg}`);
	console.groupEnd();
}

/**
 * @param groupName
 * @param msg
 */
export function logDevGroup(
	groupName: string,
	msg: string
) {
	console.groupCollapsed(groupName);
	msg = msg.replace(/\t/g, '');
	console.log(`${msg}`);
	console.groupEnd();
}

/**
 * @param groupName
 * @param msgs
 */
export function log_info_group(
	groupName: string,
	msgs: string[]
) {
	console.groupCollapsed(
		`%c${groupName}`,
		'background: blue; color: #fffff'
	);
	for (const m of msgs) {
		const msg = m.replace(/\t/g, '');
		console.log(`${msg}`);
	}
	console.groupEnd();
}

/**
 * @param msg
 */
export function dlog(
	msg: string | object,
	show?: boolean
) {
	// [🐞]
	if (dev && show) console.debug(msg);
}

/**
 * @param groupName
 * @param msgs
 * @param show
 * @param style
 */
export function dlogv2(
	groupName: string,
	msgs: unknown[],
	show?: boolean,
	style?: string
) {
	// [🐞]
	if (dev && show) {
		console.groupCollapsed(
			`%c${groupName}`,
			style
		);
		for (const m of msgs) {
			const msg =
				typeof m == 'string'
					? m.replace(/\t/g, '')
					: m;
			console.debug(msg);
		}
		console.groupEnd();
	}
}

/**
 * @param msg
 */
export function errlog(msg: string) {
	// [🐞]
	if (dev) console.error(`❌ Error: ${msg}`);
}
