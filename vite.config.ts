import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
	optimizeDeps: {
		include: ['lodash.get', 'lodash.isequal', 'lodash.clonedeep']
	},
	server: { https: true, proxy: {} },
	plugins: [sveltekit(), mkcert()],
	test: {
		environment: 'happy-dom',
		globals: true,
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
