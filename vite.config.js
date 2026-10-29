
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { readdirSync } from 'node:fs';

const htmlPages = Object.fromEntries(
  readdirSync(process.cwd())
    .filter((file) => file.endsWith('.html'))
    .map((file) => [
      file.replace(/\.html$/, ''),
      resolve(process.cwd(), file),
    ])
);

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: htmlPages,
    },
  },
});
