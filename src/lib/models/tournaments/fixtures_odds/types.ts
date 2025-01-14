import type {
	BETARENA_HASURA_historic_fixtures,
	BETARENA_HASURA_historic_fixtures_aggregate,
	BETARENA_HASURA_scores_football_seasons_details,
	BETARENA_HASURA_scores_general_translations,
	BETARENA_HASURA_scores_livescore_football_translations,
	BETARENA_HASURA_scores_widget_football_fixtures_odds_translations,
	BETARENA_HASURA_sportsbook_details,
	DataStats,
	FixturesOddsTranslations,
	MediaLinkWelcome,
	Round,
	Scores,
	Time,
	Urls,
	Weekdays,
	WelcomeMonths,
	WidgetsNoDataAvailable
} from '$lib/models/hasura';
import type { FIXTURE_STATUS_TYPES } from '$lib/models/sportmonks';

/**
 * ==========================================
 * HASURA DB - COMPLETE WIDGET REQUIRED DATA
 * ==========================================
 */

export interface BETARENA_HASURA_SURGICAL_JSONB_historic_fixtures
	extends BETARENA_HASURA_historic_fixtures {
	stats_j?: DataStats;
	localteam_id_j?: number;
	visitorteam_id_j?: number;
	round_j?: Round;
	time_j?: Time;
	scores_j?: Scores;
	stage_id_j: number;
}

export interface BETARENA_HASURA_fixtures_odds_query {
	historic_fixtures_aggregate: BETARENA_HASURA_historic_fixtures_aggregate;
	historic_fixtures: BETARENA_HASURA_SURGICAL_JSONB_historic_fixtures[];

	scores_football_seasons_details: BETARENA_HASURA_scores_football_seasons_details[];

	scores_widget_football_fixtures_odds_translations: BETARENA_HASURA_scores_widget_football_fixtures_odds_translations[];
	scores_general_translations: BETARENA_HASURA_scores_general_translations[];
	scores_livescore_football_translations: BETARENA_HASURA_scores_livescore_football_translations[];
	sportsbook_details: BETARENA_HASURA_sportsbook_details[];
}

/**
 * ==========================================
 * CACHING PERSIST - COMPLETE WIDGET REQUIRED DATA
 * ==========================================
 */

export interface REDIS_CACHE_SINGLE_tournaments_fixtures_odds_widget_data_response {
	league_id?: number;
	seasons?: Tournament_Season_Fixtures_Odds[];
}

export interface REDIS_CACHE_SINGLE_tournaments_fixtures_odds_widget_t_data_response
	extends FixturesOddsTranslations,
		WelcomeMonths,
		Weekdays,
		WidgetsNoDataAvailable {
	lang: string;
	status_abv?: FIXTURE_STATUS_TYPES;
}

export interface Tournament_Season_Fixtures_Odds {
	season_id?: number;
	rounds?: Rounds_Data[];
	weeks?: Weeks_Data[];
	fixtures?: Tournament_Fixture_Odds[];
}

export interface Rounds_Data {
	name?: string;
	type?: 'round' | 'advanced';
	s_date?: string;
	e_date?: string;
	stage_id?: number;
	value?: number;
}

export interface Weeks_Data {
	name: string;
	s_date: string;
	e_date: string;
}

export interface Tournament_Fixture_Odds {
	id: number;

	/*
  round
  ➤ Rounds and weeks = 
  ➤ scores_football_seasons_details + round_data + scores_general_translations
  */
	round: number;

	/*
  [DISABLED]
  week
  ➤ Rounds and weeks = 
  ➤ scores_football_seasons_details + round_data + scores_general_translations
  */
	// week: number

	/*
  fixture_time
  ➤ Day and Month = historic_fixtures + "league_id" + "time" +  scores_general_translations 
  ➤ (Filter fixtures between dates or rounds to get fixtures day information, 
  ➤ varies depending on the computer date and time of the end user) 
  ➤ [❓] whats the: historic_fixtures + "league_id" FOR ?
  */
	fixture_time: string;

	/*
  fixture_date
  ➤ Fixture Date = historic_fixtures + "time" (Varies depending 
  ➤ on the computer date and time of the end user)
  */
	fixture_date: string;

	/*
  minute
  ➤ live option, from firebase (non-cache-based)  
  ➤ Fixture Live Time Information (Status LIVE) = livescore_now  + "minute": 13,"
  */
	minute: number;

	/*
  status
  ➤ [❓] should be real-time [?] as in, without the user 
  ➤ refreshing the app will autamtically show the fixture data is LIVE
  */
	status: FIXTURE_STATUS_TYPES;

	teams: {
		home: Fixture_Odds_Team;
		away: Fixture_Odds_Team;
	};

	/*
  tip_link
  ➤ [data] = tip_link_wp + scores_general_translations
  */
	tip_link: string;

	/*
  fixture_link 
  ➤ [data] = fixture_link_wp NOTE: now official-new FIXTURE-LINKS 
  */
	fixture_link: Urls;

	/*
  media_link 
  ➤ [data] = historic_fixtures + media_link + "video_link"
  */
	media_link: MediaLinkWelcome[];

	/*
  bet_icon
  ➤ Betting Site Icon = sportsbook_details (GEO or forced header option)  
  ➤ [❔] only 1 betting site at the moment 
  ➤ for all fixtures of X GEO (design is wrong)
  */
	bet_icon?: string;

	/*
  live_odds
  ➤ [ℹ] extra-real-time-odds
  */
	live_odds?: LiveOdds;
}

export interface Fixture_Odds_Team {
	name: string; // Team Names = historic_fixtures + "home_team_name" + "away_team_name"
	score: number; // Score = historic_fixtures + "ft_score" [❓] what is this field [complex property]
	red_cards: number; // Red Cards = historic_fixtures + "cards"
}

export interface LiveOdds {
	home: LiveOddsSingle;
	away: LiveOddsSingle;
	draw: LiveOddsSingle;
}
export interface LiveOddsSingle {
	betting_site_icon_link?: string;
	register_link?: string;
	value?: number;
}
