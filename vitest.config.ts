import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
    resolve: {
        alias: {
            $lib: path.resolve(__dirname, './src/lib'),
        },
    },
    test: {
        testTimeout: 10000,
        globals: true,
        deps: {
            inline: [/vite-test-utils/]
        }
    }
})