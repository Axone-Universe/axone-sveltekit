import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
	optimizeDeps: {
		include: ['lodash.get', 'lodash.isequal', 'lodash.clonedeep']
	},
	// server: { https: true, proxy: {} },
	server: {
		https: false,
		proxy: {},
		// Allow all hosts for localtunnel and other tunneling services in development
		// Note: In production, specify exact hosts for security
		allowedHosts: process.env.NODE_ENV === 'development' ? true : []
	},
	plugins: [sveltekit(), mkcert()],
	test: {
		environment: 'happy-dom',
		globals: true,
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
