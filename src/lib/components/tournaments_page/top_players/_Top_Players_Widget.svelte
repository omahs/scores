<!-- ===============
COMPONENT JS (w/ TS)
=================-->
<script lang="ts">
	import { browser } from '$app/environment';
	import { afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';

	import { get } from '$lib/api/utils';
	import { sessionStore } from '$lib/store/session';
	import { userBetarenaSettings } from '$lib/store/user-settings';
	import {
		dlog, dlogv2, TP_W_STY, TP_W_TAG, TP_W_TOG
	} from '$lib/utils/debug';
	import { viewport_change } from '$lib/utils/platform-functions';

	import type {
		REDIS_CACHE_SINGLE_tournaments_top_player_widget_data_response,
		REDIS_CACHE_SINGLE_tournaments_top_player_widget_t_data_response,
		Tournament_Season_Top_Player
	} from '$lib/models/tournaments/top_players/types';

	import TopPlayersWidgetContentLoader from './_Top_Players_Widget_ContentLoader.svelte';
	import TopPlayerRow from './_Top_Player_Row.svelte';

	import arrow_down from './assets/arrow-down.svg';
	import arrow_up from './assets/arrow-up.svg';
	import check_league from './assets/check-league.svg';
	import no_visual from './assets/no_visual.svg';
	import no_visual_dark from './assets/no_visual_dark.svg';
  
  // ~~~~~~~~~~~~~~~~~~~~~
	//  COMPONENT VARIABLES
	// ~~~~~~~~~~~~~~~~~~~~~

	let loaded: boolean = false; // [ℹ] holds boolean for data loaded;
	let refresh: boolean = false; // [ℹ] refresh value speed of the WIDGET;
	let refresh_data: any = undefined; // [ℹ] refresh-data value speed;
	let noTopPlayersBool: any = false; // [ℹ] identifies the noTopPlayersBool boolean;
	let dropdownPlayerViewSelect: string = 'rating'; // [ℹ] selected TOP PLAYER VIEW;
	let playerArrayConst: string = 'top_players_';
	let selectedPlayerArray: string =
		'top_players_rating';
	let toggleDropdown: boolean = false;
	let showMore: boolean = false;
	let displayShowMore: boolean = false;
	let limitViewRow: number;           // [ℹ] holds the actual, `total` limit of the list of featured sites
	let staticViewRow: number;          // [ℹ] holds the `initial` number of featured sites to be displayed
	let trueLengthOfArray: number;      // [ℹ] original array length
	let lazyLoadingSeasonFixture: boolean = false;

	let diasbleDev: boolean = false;

	let refreshRow: boolean = false;

	export let TOP_PLAYERS_T: REDIS_CACHE_SINGLE_tournaments_top_player_widget_t_data_response;
	export let TOP_PLAYERS_DATA: REDIS_CACHE_SINGLE_tournaments_top_player_widget_data_response;

	dlog(TOP_PLAYERS_DATA, TP_W_TOG);

	// ~~~~~~~~~~~~~~~~~~~~~
	//  COMPONENT METHODS
	// ~~~~~~~~~~~~~~~~~~~~~

	async function widgetInit(): Promise<REDIS_CACHE_SINGLE_tournaments_top_player_widget_data_response> {
		if (!$userBetarenaSettings.country_bookmaker ||
			$sessionStore?.selectedSeasonID == undefined
		) {
			return;
		}

		if (TOP_PLAYERS_DATA == undefined) {
      dlog(`${TP_W_TAG} ❌ no data available!`, TP_W_TOG, TP_W_STY);
			noTopPlayersBool = true;
			return;
		}
		// [ℹ] otherwise, revert back to DATA AVAILABLE;
		else {
			noTopPlayersBool = false;
		}

		const sleep = (ms) =>
			new Promise((r) => setTimeout(r, ms));
		await sleep(2000);

		selectPlayerView(dropdownPlayerViewSelect);

		return TOP_PLAYERS_DATA;
	}

	function selectTableView(opt: string) {
		// selectedOpt = opt;
		refreshRow = true;
		setTimeout(async () => {
			refreshRow = false;
		}, 50);
	}

  $: dlogv2 (
    TP_W_TAG,
    [
      `trueLengthOfArray: ${trueLengthOfArray}`,
      `toggleDropdown: ${toggleDropdown}`,
      `showMore: ${showMore}`,
    ],
    TP_W_TOG,
    TP_W_STY
  )

	async function selectPlayerView(opt: string) {
    dlog(`${TP_W_TAG} ➡️ selectPlayerView()`, TP_W_TOG, TP_W_STY);

		dropdownPlayerViewSelect = opt
			.toLowerCase()
			.replace(/\s/g, '_');
		selectedPlayerArray =
			playerArrayConst + dropdownPlayerViewSelect;
		showMore = false;
		// limitViewRow = 10;

		let checkPlayerViewOptLength =
			TOP_PLAYERS_DATA.seasons.find(
				({ season_id }) =>
					season_id ===
					$sessionStore.selectedSeasonID
			);
		if (checkPlayerViewOptLength == undefined) {
			lazyLoadingSeasonFixture = true;
			// TODO: direct Hasura DB data of TOP-PLAYERS EXTRACT for Target Season
			// TODO: create endpoint accordingly
			const response: Tournament_Season_Top_Player =
				await get(
					`/api/hasura/tournaments/top_players?seasonId=` +
						$sessionStore.selectedSeasonID
				);
			if (response == undefined) {
				noTopPlayersBool = true;
				trueLengthOfArray = 0;
				lazyLoadingSeasonFixture = false;
				return;
			} else {
				TOP_PLAYERS_DATA.seasons.push(response);
				TOP_PLAYERS_DATA = TOP_PLAYERS_DATA;
				checkPlayerViewOptLength = response;
				lazyLoadingSeasonFixture = false;
			}
		}

		// [ℹ] validation of NO-WIDGET-DATA
		if (
			checkPlayerViewOptLength == undefined ||
			(checkPlayerViewOptLength
				.top_players_assists.length == 0 &&
				checkPlayerViewOptLength.top_players_goals
					.length == 0 &&
				checkPlayerViewOptLength
					.top_players_rating.length == 0 &&
				checkPlayerViewOptLength
					.top_players_total_shots.length == 0)
		) {
			noTopPlayersBool = true;
			trueLengthOfArray = 0;
			return;
		}
		// [ℹ] there is data to show
		else {
			noTopPlayersBool = false;
			trueLengthOfArray =
				checkPlayerViewOptLength[
					selectedPlayerArray
				].length;

			if (trueLengthOfArray > 10) {
				displayShowMore = true;
				staticViewRow = 10;
				limitViewRow = 10;
			} else {
				displayShowMore = false;
				staticViewRow = 10;
				limitViewRow = 10;
			}

			return;
		}
	}

	function closeAllDropdowns() {
		toggleDropdown = false;
	}

	function toggleFullList() {
		// [ℹ] update the showMore Boolean
		showMore = !showMore;
		// [ℹ] check if the `limitViewRow` matches the `trueLengthOfArray`,
		if (limitViewRow == trueLengthOfArray) {
			// [ℹ] if so, revert back to the original number of list row items,
			limitViewRow = staticViewRow;
			return;
		}
		// [ℹ] otherwise, expand the list to the full length,
		limitViewRow = trueLengthOfArray;
	}

  // ~~~~~~~~~~~~~~~~~~~~~
	// VIEWPORT CHANGES | IMPORTANT
  // [NOT USED]
	// ~~~~~~~~~~~~~~~~~~~~~

	const TABLET_VIEW = 1000;
	const MOBILE_VIEW = 725; // 768 - Tablet (start)
	let mobileExclusive,
		tabletExclusive: boolean = false;

	onMount(async () => {
		[tabletExclusive, mobileExclusive] =
			viewport_change(TABLET_VIEW, MOBILE_VIEW);
		window.addEventListener(
			'resize',
			function () {
				[tabletExclusive, mobileExclusive] =
					viewport_change(
						TABLET_VIEW,
						MOBILE_VIEW
					);
			}
		);
	});

	// ~~~~~~~~~~~~~~~~~~~~~
	// REACTIVE SVELTE METHODS
	// [! CRITICAL !]
	// ~~~~~~~~~~~~~~~~~~~~~

	$: refresh_data =
		$userBetarenaSettings.country_bookmaker;

	$: if (browser && refresh_data) {
		// [ℹ] reset necessary variables;
		refresh = true;
		loaded = false;
		noTopPlayersBool = false;
		// widgetInit()
		setTimeout(async () => {
			refresh = false;
		}, 100);
	}

	afterNavigate(async () => {
		widgetInit();
	});

	// ~~~~~~~~~~~~~~~~~~~~~
	// REACTIVE SVELTE OTHER
	// ~~~~~~~~~~~~~~~~~~~~~

  /**
   * @description regenerated the top-player widget
   * on every time the selectedSeasonID updates
  */
	$: if (browser &&	$sessionStore.selectedSeasonID != undefined) {
	  selectPlayerView(dropdownPlayerViewSelect)
	}
</script>

<!-- ===============
COMPONENT HTML 
=================-->

<!-- [ℹ] area-outside-for-close 
-->
{#if toggleDropdown}
	<div
		id="background-area-close"
		on:click={() => closeAllDropdowns()}
	/>
{/if}

<div id="widget-outer">
	<!-- 
  [ℹ] SEO-DATA-LOADED 
  -->
	<!-- {#if !loaded} -->
	<div id="seo-widget-box">
		<h2>{TOP_PLAYERS_T?.top_players}</h2>
		{#if TOP_PLAYERS_DATA?.seasons.length != 0}
			{#each TOP_PLAYERS_DATA.seasons[0].top_players_rating as player}
				<p>{player.player_name}</p>
			{/each}
		{/if}
	</div>
	<!-- {/if} -->

	<!-- 
  [ℹ] NO WIDGET DATA AVAILABLE PLACEHOLDER
  -->
	{#if noTopPlayersBool && !loaded}
		<!-- [ℹ] title of the widget 
    -->
		<h2
			class="s-20 m-b-10 w-500 color-black-2"
			style="margin-top: 0;"
			class:color-white={$userBetarenaSettings.theme ==
				'Dark'}
		>
			{TOP_PLAYERS_T?.top_players}
		</h2>

		<!-- 
    [ℹ] no-widget-data-avaiable-placeholder container 
    -->
		<div
			id="no-widget-box"
			class="column-space-center"
			class:dark-background-1={$userBetarenaSettings.theme ==
				'Dark'}
		>
			<!-- 
      [ℹ] no-visual-asset
      -->
      <img
        src={$userBetarenaSettings.theme == 'Dark' ? no_visual_dark : no_visual}
        alt={$userBetarenaSettings.theme == 'Dark' ? "no_visual_dark" : "no_visual"}
        width="32"
        height="32"
        class="m-b-16"
      />

			<!-- 
      [ℹ] container w/ text 
      -->
			<div>
				<p
					class="s-14 m-b-8 w-500"
					class:color-white={$userBetarenaSettings.theme ==
						'Dark'}
				>
					{TOP_PLAYERS_T.no_data_t.no_info}
				</p>
				<p class="s-14 color-grey w-400">
					{TOP_PLAYERS_T.no_data_t.no_info_desc}
				</p>
			</div>
		</div>
	{/if}

	<!-- 
  [ℹ] MAIN WIDGET COMPONENT
  -->
	{#if !noTopPlayersBool && !refresh && browser && $userBetarenaSettings.country_bookmaker && !diasbleDev}
		<!--
    [ℹ] promise is pending 
    -->
		{#await widgetInit()}
			<TopPlayersWidgetContentLoader />
    <!-- 
    [ℹ] promise was fulfilled
    -->
		{:then data}
			{#if lazyLoadingSeasonFixture}
				<TopPlayersWidgetContentLoader />
			{:else}
				<h2
					class="s-20 m-b-10 w-500 color-black-2"
					style="margin-top: 0px;"
					class:color-white={$userBetarenaSettings.theme ==
						'Dark'}
				>
					{TOP_PLAYERS_T?.top_players}
				</h2>

				<div
					id="top-players-widget-container"
					class:widget-no-data-height={trueLengthOfArray ==
						0}
					class:dark-background-1={$userBetarenaSettings.theme ==
						'Dark'}
				>
					<!-- [ℹ] dropdown leagues select box 
          -->
					<div
						id="dropdown-top-players-container"
						on:click={() =>
							(toggleDropdown = !toggleDropdown)}
					>
						<!-- [ℹ] main seleced 
            -->
						<div
							id="dropdown-box-select"
							class="row-space-out cursor-pointer"
						>
							<p class="s-14 w-500 color-black-2">
								{TOP_PLAYERS_T[
									dropdownPlayerViewSelect
								]}
							</p>
              <img
                src={!toggleDropdown ? arrow_down : arrow_up}
                alt={!toggleDropdown ? "arrow_down" : "arrow_up"}
                width="20"
                height="20"
              />
						</div>

						<!-- [ℹ] show main TOP PLAYERS VIEWS 
            -->
						{#if toggleDropdown}
							<div id="more-top-leagues-outer">
								<div
									id="more-top-leagues-list-container"
								>
									<!-- [ℹ] for-loop-each-population 
                  -->
									{#each TOP_PLAYERS_T.pl_view_opt as optView}
										<div
											class="row-space-out top-league-container"
											on:click={() =>
												selectPlayerView(
													optView.toLowerCase()
												)}
										>
											<!-- [ℹ] row-data;
                      -->
											<div
												class="row-space-start cursor-pointer"
											>
												<!-- [ℹ] vlaidate that THIS SEASON - LEAGUE is PRE-SELECTED
                        -->
												<p
													class="s-14 w-500 color-black-2"
													class:color-primary={dropdownPlayerViewSelect ===
														optView
															.toLowerCase()
															.replace(
																/\s/g,
																'_'
															)}
												>
													{TOP_PLAYERS_T[
														optView
															.toLowerCase()
															.replace(/\s/g, '_')
													]}
												</p>
											</div>
											<!-- [ℹ] vlaidate that THIS SEASON - LEAGUE is PRE-SELECTED
                      -->
											{#if dropdownPlayerViewSelect === optView
													.toLowerCase()
													.replace(/\s/g, '_')}
												<img
													src={check_league}
													alt=""
													width="20px"
													height="20px"
												/>
											{/if}
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>

					<!-- [ℹ] widget-brakdown-columns-section 
          -->
					<div
						id="widget-title-row"
						class="row-space-out"
						style="width: auto;"
					>
						<div class="row-space-start">
							<p
								class="w-400 small color-grey m-r-20"
							>
								#
							</p>
							<p class="w-400 small color-grey">
								{TOP_PLAYERS_T.player}
							</p>
						</div>

						<div class="row-space-end">
							<p class="w-400 small color-grey">
								{TOP_PLAYERS_T[
									dropdownPlayerViewSelect
								]}
							</p>
						</div>
					</div>

					<!-- [ℹ] no-seasons-data-check
          -->
					{#if trueLengthOfArray != 0}
						<!-- [ℹ] rows
            -->
						{#each TOP_PLAYERS_DATA.seasons as season}
							{#if season.season_id === $sessionStore.selectedSeasonID}
								{#each season[selectedPlayerArray].slice(0, limitViewRow) as data, i}
									<TopPlayerRow
										pos={i + 1}
										optView={dropdownPlayerViewSelect}
										{data}
										translations={TOP_PLAYERS_T}
									/>
								{/each}
							{/if}
						{/each}
					{:else}
						<!-- [ℹ] placeholder
            -->
						<div
							class="column-space-center"
							style="margin-top: 280px;"
						>
							<!-- [ℹ] no-visual-asset
              -->
							{#if $userBetarenaSettings.theme == 'Dark'}
								<img
									src={no_visual_dark}
									alt="no_visual_dark"
									width="32px"
									height="32px"
									class="m-b-16"
								/>
							{:else}
								<img
									src={no_visual}
									alt="no_visual"
									width="32px"
									height="32px"
									class="m-b-16"
								/>
							{/if}

							<!-- [ℹ] container w/ text 
              -->
							<div>
								<p
									class="s-14 w-500"
									class:color-white={$userBetarenaSettings.theme ==
										'Dark'}
								>
									{TOP_PLAYERS_T.no_data_t
										.no_info}
								</p>
							</div>
						</div>
					{/if}

					<!-- [ℹ] show-more / show-less
          -->
					{#if displayShowMore && trueLengthOfArray != 0}
						<div>
							<p
								id="show-more-box"
								on:click={() => toggleFullList()}
							>
								{#if !showMore}
									{TOP_PLAYERS_T
										.show_more_less[1]}
								{:else}
									{TOP_PLAYERS_T
										.show_more_less[0]}
								{/if}
							</p>
						</div>
					{:else if trueLengthOfArray != 0}
						<p
							id="show-more-box"
							style="padding: 5px; box-shadow: none;"
						/>
					{/if}
				</div>
			{/if}

    <!-- 
    [ℹ] promise was rejected
    -->
		{:catch error}
			<!-- {error} -->
		{/await}
	{/if}
</div>

<!-- ===============
COMPONENT STYLE
=================-->
<style>
	/* [ℹ] OTHER STYLE / CSS */

	#background-area-close {
		position: absolute;
		top: 0;
		bottom: 0;
		right: 0;
		left: 0;
		height: 100%;
		width: 100%;
		z-index: 1000;
	}

	.color-primary {
		color: #f5620f !important;
	}

	/* [ℹ] NO DATA WIDGET STYLE / CSS */

	#no-widget-box {
		padding: 20px;
		background: #ffffff;
		box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.08);
		border-radius: 12px;
		text-align: center;
	}

	/* [ℹ] SEO WIDGET DATA */

	#seo-widget-box {
		position: absolute;
		z-index: -100;
		top: -9999px;
		left: -9999px;
	}

	/*
    [ℹ] WIDGET MAIN STYLE / CSS 
    [ℹ] MOBILE FIRST
  */

	/* div#widget-outer {
    margin-top: 24px;
  } */

	div#top-players-widget-container.widget-no-data-height {
		height: 832px;
	}

	#top-players-widget-container {
		padding: 0;
		background: #ffffff;
		box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.08);
		border-radius: 12px;
		width: 100%;
		position: relative;
	}

	div#widget-title-row {
		background-color: #f2f2f2;
		border-radius: 2px;
		padding: 7px 16px 7px 9px;
		margin: 16px 20px 10px 20px;
	}

	div#more-top-leagues-outer {
		position: absolute;
		top: 115%;
		width: 100%;
		background-color: #ffffff;
		box-shadow: 0px 4px 16px rgb(0 0 0 / 8%);
		border-radius: 4px;
		z-index: 10000;
		max-height: 302px;
		overflow-y: scroll;
		padding-right: 6px;
	}
	div#more-top-leagues-outer::-webkit-scrollbar {
		/* Hide scrollbar for Chrome, Safari and Opera */
		display: none;
	}
	div#more-top-leagues-outer::-webkit-scrollbar {
		/* Hide scrollbar for IE, Edge and Firefox */
		-ms-overflow-style: none; /* IE and Edge */
		scrollbar-width: none; /* Firefox */
	}

	div#dropdown-top-players-container {
		position: relative;
		margin: 0 20px 0px 20px;
		padding-top: 20px;
	}
	div#dropdown-top-players-container
		div#dropdown-box-select {
		padding: 9px 20px;
		border: 1px solid #cccccc;
		box-sizing: border-box;
		border-radius: 8px;
		position: relative;
		height: 40px;
	}
	div#dropdown-top-players-container
		div#dropdown-box-select:hover {
		border: 1px solid #8c8c8c !important;
	}
	div#dropdown-top-players-container
		div#more-top-leagues-list-container {
		max-height: 302px;
		overflow-y: scroll;
	}
	div#dropdown-top-players-container
		div#more-top-leagues-list-container
		.top-league-container {
		padding: 12px 20px;
	}
	div#dropdown-top-players-container
		div#more-top-leagues-list-container
		.top-league-container:hover {
		cursor: pointer;
	}
	div#dropdown-top-players-container
		div#more-top-leagues-list-container
		.top-league-container:hover
		p {
		color: #f5620f !important;
	} /* width */
	div#dropdown-top-players-container
		div#more-top-leagues-list-container::-webkit-scrollbar {
		width: 4px;
	} /* track */
	div#dropdown-top-players-container
		div#more-top-leagues-list-container::-webkit-scrollbar-track {
		background: #f2f2f2;
		border-radius: 12px;
		margin: 8px;
	} /* handle */
	div#dropdown-top-players-container
		div#more-top-leagues-list-container::-webkit-scrollbar-thumb {
		background: #cccccc;
		border-radius: 12px;
	}

	#show-more-box {
		padding: 25px 0;
		text-align: center;
		white-space: nowrap;
		color: var(--primary);
		box-shadow: inset 0px 1px 0px #ebebeb;
		cursor: pointer;
	}

	/* ====================
    RESPONSIVNESS
  ==================== */

	/* 
  TABLET RESPONSIVNESS (&+) */
	@media only screen and (min-width: 726px) and (max-width: 1000px) {
		#top-players-widget-container {
			min-width: 100%;
			/* max-width: 700px; */
		}
	}

	/* 
  TABLET && DESKTOP SHARED RESPONSIVNESS (&+) */
	@media only screen and (min-width: 726px) {
		/* EMPTY */
	}

	/* 
  DESKTOP RESPONSIVNESS (&+) */
	@media only screen and (min-width: 1160px) {
		#top-players-widget-container {
			min-width: 100%;
		}

		div#widget-outer {
			margin-top: 0;
		}

		div#widget-title-row {
			margin: 20px 20px 12.5px 20px;
		}
	}

	/* ====================
    WIDGET DARK THEME
  ==================== */

	.dark-background-1 div#widget-title-row {
		background-color: #616161 !important;
	}

	.dark-background-1 p#show-more-box {
		box-shadow: inset 0px 1px 0px #616161 !important;
	}

	.dark-background-1
		div.stand-view-opt-box:hover
		p {
		color: white !important;
	}

	.dark-background-1 div#mobile-table-box p {
		color: white;
	}

	.dark-background-1 div#more-top-leagues-outer {
		/* dark theme/dark-gray */
		background: #616161;
		/* shadow/black */
		box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.24);
		border-radius: 4px;
	} /* handle */
	.dark-background-1
		div#more-top-leagues-list-container::-webkit-scrollbar-thumb {
		background: #999999 !important;
	} /* track */
	.dark-background-1
		div#more-top-leagues-list-container::-webkit-scrollbar-track {
		background: #4b4b4b !important;
	}
</style>
