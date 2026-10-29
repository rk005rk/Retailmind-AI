
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import {
  existsSync,
  readdirSync,
  cpSync
} from 'node:fs';

const htmlPages = Object.fromEntries(
  readdirSync(process.cwd())
    .filter((file) => file.endsWith('.html'))
    .map((file) => [
      file.replace(/\.html$/, ''),
      resolve(process.cwd(), file),
    ])
);

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-retailmind-static-files',
      closeBundle() {
        for (const folder of ['js', 'css']) {
          const source = resolve(process.cwd(), folder);
          const destination = resolve(process.cwd(), 'dist', folder);

          if (existsSync(source)) {
            cpSync(source, destination, { recursive: true });
            console.log(`Copied ${folder}/ to dist/${folder}/`);
          }
        }
      },
    },
  ],

  build: {
    rollupOptions: {
      input: htmlPages,
    },
  },
});
