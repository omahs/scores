<!-- ===================
	COMPONENT JS - BASIC 
=================== -->
<script lang="ts">
	import { page } from "$app/stores";
	import type { REDIS_CACHE_SINGLE_fixtures_page_info_response } from "$lib/models/_main_/pages_and_seo/types";

  export let FIXTURE_INFO: REDIS_CACHE_SINGLE_fixtures_page_info_response;
  export let country_link: string;
  export let league_name_link: string;
</script>

<!-- ===================
	COMPONENT HTML
=================== -->

<!-- 
[ℹ] breadcrumbs URL 
-->
<div
  id="fixture-page-breadcrumbs"
  class="
    row-space-start 
    m-b-20
  "
>
  <!-- 
  [ℹ] sport 
  -->
  <a
    
    href={$page.params.lang != undefined
      ? `/${$page.params.lang}/${$page.params.sport}`
      : `/${$page.params.sport}`}
  >
    <p
      class="
        s-14 
        color-white 
        m-r-10 
        capitalize 
        cursor-pointer 
        no-wrap
      "
    >
      {FIXTURE_INFO?.data?.sport}
    </p>
  </a>

  <img
    src="/assets/svg/tournaments/arrow-right.svg"
    alt=""
    class="m-r-10"
    width="14px"
    height="14px"
  />

  <!-- 
  [ℹ] country 
  -->
  <a
    
    href={$page.params.lang != undefined
      ? `/${$page.params.lang}/${$page.params.sport}/${country_link}`
      : `/${$page.params.sport}/${country_link}`}
  >
    <p
      class="
        s-14 
        color-white 
        m-r-10 
        capitalize 
        cursor-pointer 
        no-wrap
      "
    >
      {FIXTURE_INFO?.data?.country}
    </p>
  </a>

  <img
    src="/assets/svg/tournaments/arrow-right.svg"
    alt=""
    class="m-r-10"
    width="14px"
    height="14px"
  />

  <!-- 
  [ℹ] league_name 
  -->
  <a
    
    href={$page.params.lang != undefined
      ? `/${$page.params.lang}/${$page.params.sport}/${country_link}/${league_name_link}`
      : `/${$page.params.sport}/${country_link}/${league_name_link}`}
  >
    <p
      class="
        s-14 
        color-white
        m-r-10 
        capitalize 
        cursor-pointer 
        no-wrap
      "
    >
      {FIXTURE_INFO?.data?.league_name}
    </p>
  </a>

  <img
    src="/assets/svg/tournaments/arrow-right.svg"
    alt=""
    class="m-r-10"
    width="14px"
    height="14px"
  />

  <!-- 
  [ℹ] fxiture_name 
  -->
  <p
    class="
      s-14 
      color-white 
      m-r-10 
      capitalize 
      fixture-name
    "
  >
    {FIXTURE_INFO?.data?.home_team_name}
    vs
    {FIXTURE_INFO?.data?.away_team_name}
  </p>
</div>