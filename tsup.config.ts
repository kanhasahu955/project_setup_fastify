import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['main.ts'],
    format: ['esm'],
    target: 'node20',
    outDir: 'dist',
    clean: true,
    sourcemap: true,
    dts: false,
    splitting: false,
    treeshake: true,
    minify: process.env.NODE_ENV === 'production',
    skipNodeModulesBundle: true,
    bundle: true,
    esbuildOptions(options) {
        options.alias = {
            '@': './src',
        };
    },
    // Copy prisma schema
    async onSuccess() {
        console.log('✅ Build completed successfully!');
    },
});
