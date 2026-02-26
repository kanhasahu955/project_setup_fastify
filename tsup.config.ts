import { defineConfig } from 'tsup';
import { copyFileSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

function copyGraphQLSchema() {
    const srcDir = join(process.cwd(), 'src', 'graphql', 'schema');
    const destDir = join(process.cwd(), 'dist', 'graphql', 'schema');
    mkdirSync(destDir, { recursive: true });
    for (const name of readdirSync(srcDir)) {
        if (name.endsWith('.graphql')) {
            copyFileSync(join(srcDir, name), join(destDir, name));
        }
    }
}

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
    // Copy GraphQL schema .graphql files to dist for production
    async onSuccess() {
        copyGraphQLSchema();
        console.log('✅ Build completed successfully!');
    },
});
