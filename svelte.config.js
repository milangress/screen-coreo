// Tauri doesn't have a Node.js server to do proper SSR
// so we will use adapter-static to prerender the app (SSG)
// See: https://v2.tauri.app/start/frontend/sveltekit/ for more info
import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    csp: {
			mode: 'hash',
			directives: {
				'default-src': ['none'],
				'img-src': ['self'],
				'script-src': ['self'],
				'style-src': ['self', 'unsafe-inline'],
			}
		}
  },
};

export default config;
