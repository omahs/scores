<!-- ===============
	COMPONENT JS (w/ TS)
==================== -->
<script lang="ts">
	import { fade } from 'svelte/transition';

	import { userBetarenaSettings } from '$lib/store/user-settings';

	import type {
		REDIS_CACHE_SINGLE_tournaments_top_player_widget_t_data_response,
		Top_player_ratings
	} from '$lib/models/tournaments/top_players/types';

	export let pos: number;
	export let optView: string;
	export let data: Top_player_ratings;
	export let translations: REDIS_CACHE_SINGLE_tournaments_top_player_widget_t_data_response;

	let ratingColorCode: string;

	$: if (optView === 'rating') {
		if (data[optView] > 7.99) {
			ratingColorCode = 'G';
		} else if (data[optView] > 6.99) {
			ratingColorCode = 'Y';
		} else {
			ratingColorCode = 'T';
		}
	} else {
		ratingColorCode = undefined;
	}

	let showExtraInfo: boolean;
</script>

<!-- ===============
  COMPONENT HTML 
==================== -->

<div
	class="best-player-row"
	class:dark-background-1={$userBetarenaSettings.theme ==
		'Dark'}
	in:fade
>
	<!-- first container of the row site 
  -->
	<div class="row-space-out">
		<!-- [ℹ] first container 
    -->
		<div class="row-space-start">
			<div class="pos-number-player-box">
				<p class="medium w-500">
					{pos}
				</p>
			</div>

			<!-- [ℹ] player logo-img & team logo 
      -->
			<div id="image-contaier">
				<img
					id="player-img"
					src={data.avatar}
					alt=""
				/>
				{#if data.team_logo !== null}
					<img
						id="team-img"
						src={data.team_logo}
						alt=""
					/>
				{/if}
			</div>

			<!-- [ℹ] player name  & player position
      -->
			<div style="margin-left: 16px;">
				<p
					class="medium w-500 no-wrap player-name"
				>
					{data.player_name}
				</p>
				<p
					class="medium w-400 color-grey no-wrap"
				>
					{translations.pos_t[data.position]}
				</p>
			</div>
		</div>

		<!-- [ℹ] second container 
    -->
		<div
			class="row-space-end"
			style="width: auto;"
		>
			<p
				id="box-goals"
				class="medium w-500"
				class:rating_green={ratingColorCode ===
					'G'}
				class:rating_yellow={ratingColorCode ===
					'Y'}
				class:rating_grey={ratingColorCode ===
					'T'}
			>
				{data[optView]}
			</p>
		</div>
	</div>
</div>

<!-- ===============
  COMPONENT STYLE
==================== -->
<style>
	.best-player-row {
		padding: 12.5px 20px;
		background-color: #ffffff;
		/* box-shadow: inset 0px 1px 0px #ebebeb; */
		display: flex;
		align-items: center;
		justify-content: space-between;
		position: relative;
	}
	.best-player-row #image-contaier {
		position: relative;
	}
	.best-player-row
		#image-contaier
		img#player-img {
		width: 40px;
		height: 40px;
		object-fit: contain;
		border-radius: 50%;
		border: 1px solid #cccccc;
	}
	.best-player-row #image-contaier img#team-img {
		width: 20px;
		height: 20px;
		object-fit: contain;
		position: absolute;
		right: -5px;
		bottom: 0;
	}
	.best-player-row div.pos-number-player-box {
		width: 8px;
		margin-right: 24px;
		position: relative;
	}
	.best-player-row div.pos-number-player-box p {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 50%;
		right: 50%;
		margin: auto;
		height: 21px;
	}

	.best-player-row p#box-goals {
		background-color: #ffffff;
		border: 1px solid #e6e6e6;
		box-sizing: border-box;
		border-radius: 4px;
		text-align: center;
		padding: 5px 0;
		max-height: 30px;
		width: 64px;
	}
	.best-player-row p#box-goals.rating_green {
		background-color: #59c65d !important;
		color: #ffffff;
		border: 1px solid transparent;
	}
	.best-player-row p#box-goals.rating_yellow {
		background-color: #ffb904 !important;
		color: #ffffff;
		border: 1px solid transparent;
	}
	.best-player-row p#box-goals.rating_grey {
		background-color: #f2f2f2 !important;
		color: #8c8c8c;
		border: 1px solid transparent;
	}

	/* 
  MOBILE RESPONSIVNESS (&+) */
	@media only screen and (max-width: 375px) {
		p.player-name {
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
			max-width: 150px;
			width: auto !important;
		}
	}

	@media only screen and (max-width: 425px) {
		p.player-name {
			width: 150px;
		}
	}

	@media only screen and (max-width: 475px) {
		.best-player-row:first-child {
			padding-top: 24px;
		}
	}

	/* 
  RESPONSIVE FOR DESKTOP ONLY (&+) [1440px] */
	@media only screen and (min-width: 1160px) and (max-width: 1240px) {
		p.player-name {
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
			max-width: 135px;
			width: 135px;
		}
	}

	@media only screen and (min-width: 1240px) {
		p.player-name {
			width: 200px;
		}
	}

	/* .............. 
	WIDGET DARK THEME 
	................. */

	div.dark-background-1.best-player-row {
		box-shadow: inset 0px 0px 0px #616161 !important;
		background-color: #4b4b4b !important;
	}

	.dark-background-1.best-player-row
		#image-contaier
		img#player-img {
		border: 1px solid #999999 !important;
	}

	.dark-background-1.best-player-row p#box-goals {
		background: #4b4b4b;
		border: 1px solid #616161;
	}
	.dark-background-1.best-player-row
		p#box-goals.rating_grey {
		background-color: #616161 !important;
		color: #a8a8a8;
		border: 1px solid transparent;
	}

	.dark-background-1 p {
		color: #ffffff;
	}
</style>
