import { sveltekit } from '@sveltejs/kit/vite';
import viteCompression from 'vite-plugin-compression'; // https://github.com/vbenjs/vite-plugin-compression
// DOC: - https://github.com/sanyuan0704/vite-plugin-chunk-split
// DOC: - https://github.com/alloc/vite-plugin-compress
// DOC: - https://github.com/jeddygong/vite-plugin-progresshttps://github.com/alloc/vite-plugin-compress
// import { chunkSplitPlugin } from 'vite-plugin-chunk-split';
// import * as c from 'vite-plugin-compress';
// import progress from 'vite-plugin-progress';

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [
    viteCompression(),
    // chunkSplitPlugin({
    //   strategy: 'all-in-one'
    // }), // not working
    // progress(),  // not-working
    // c.compress() // not-working
    sveltekit()
  ],

  /**
   * [ℹ] https://github.com/sveltejs/kit/issues/1571
   * [ℹ] https://stackoverflow.com/questions/68643743/separating-material-ui-in-vite-rollup-as-a-manual-chunk-to-reduce-chunk-size
   * [ℹ] https://www.reddit.com/r/sveltejs/comments/tih8sx/pagespeed_lighthouse_reduce_unused_javascript/
   * [ℹ] https://github.com/sveltejs/kit/issues/1632
  */
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
};

export default config;
