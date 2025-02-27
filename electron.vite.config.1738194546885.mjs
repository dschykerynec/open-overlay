// electron.vite.config.ts
import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import vue from "@vitejs/plugin-vue";
var __electron_vite_injected_dirname = "C:\\iRacing dev\\electron-vite-scaffold-test";
var electron_vite_config_default = defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__electron_vite_injected_dirname, "src/main/index.ts"),
          sdkUtility: resolve(__electron_vite_injected_dirname, "src/main/utilities/sdkUtility.ts")
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
        "@renderer": resolve("src/renderer/src")
      }
    },
    plugins: [vue()],
    build: {
      rollupOptions: {
        input: {
          lapTimesWindow: resolve(__electron_vite_injected_dirname, "src/renderer/html/lapTimes.html"),
          relativeWindow: resolve(__electron_vite_injected_dirname, "src/renderer/html/relative.html"),
          standingsWindow: resolve(__electron_vite_injected_dirname, "src/renderer/html/standings.html")
        }
      }
    }
  }
});
export {
  electron_vite_config_default as default
};
