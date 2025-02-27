import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.ts'),
          sdkUtility: resolve(__dirname, 'src/main/utilities/sdkUtility.ts')
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [vue()],
    build: {
      rollupOptions: {
        input: {
          telemetryWindow: resolve(__dirname, 'src/renderer/html/telemetry.html'),
          lapTimesWindow: resolve(__dirname, 'src/renderer/html/lapTimes.html'),
          relativeWindow: resolve(__dirname, 'src/renderer/html/relative.html'),
          standingsWindow: resolve(__dirname, 'src/renderer/html/standings.html')
        }
      }
    }
  },
})
