import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'
import { BOOKS_DIR, buildLibrary } from './scripts/library.mjs'

/** Keep public/data/library.json in sync with the book files in public/data/books. */
function bookLibrary() {
  return {
    name: 'book-library',
    buildStart() {
      buildLibrary()
    },
    configureServer(server) {
      server.watcher.add(BOOKS_DIR)
      const onChange = (file) => {
        if (path.dirname(path.resolve(file)) === path.resolve(BOOKS_DIR) && file.endsWith('.json')) {
          buildLibrary()
          server.ws.send({ type: 'full-reload' })
        }
      }
      server.watcher.on('add', onChange)
      server.watcher.on('change', onChange)
      server.watcher.on('unlink', onChange)
    },
  }
}

export default defineConfig({
  base: './', // relative asset paths: deployable to any folder or static host
  plugins: [react(), bookLibrary()],
  test: {
    environment: 'node',
  },
})
