import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		// environment: 'happy-dom',
		setupFiles: ['./src/setup.ts'],
		globals: true,
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
