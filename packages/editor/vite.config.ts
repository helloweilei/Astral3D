import { defineConfig, loadEnv } from "vite";
import path from "path";
import dotenv from "dotenv";
import vue from "@vitejs/plugin-vue";
import Unocss from "unocss/vite";
import mkcert from "vite-plugin-mkcert";
import { viteStaticCopy } from "vite-plugin-static-copy";
// 自动按需引入Naive UI组件
import Components from "unplugin-vue-components/vite";
import { NaiveUiResolver } from "unplugin-vue-components/resolvers";
import { wrapperEnv, createPlugins } from "@astral3d/build-vite-plugins";

export default defineConfig(async ({ mode, command }) => {
	const root = process.cwd();
	const env = loadEnv(mode, root);
	//LoadEnv读取的布尔类型是一个字符串。此函数可以转换为布尔类型
	const viteEnv = wrapperEnv(env);
	const { VITE_PORT, VITE_PUBLIC_PATH, VITE_BUILD_COMPRESS, VITE_BUILD_COMPRESS_DELETE_ORIGIN_FILE, VITE_ENABLE_ANALYZE, VITE_ENABLE_CONFIG_GENERATE } =
		viteEnv;

	const isBuild = command === "build";
	const plugins = await createPlugins({
		isBuild,
		root,
		compress: {
			compress: VITE_BUILD_COMPRESS,
			deleteOriginFile: VITE_BUILD_COMPRESS_DELETE_ORIGIN_FILE,
		},
		enableAnalyze: VITE_ENABLE_ANALYZE,
		enableConfig: VITE_ENABLE_CONFIG_GENERATE,
	});

	// 为@monaco-editor定义define
	const define: any = {
		"process.env": process.env,
	};
	if (mode === "development") {
		dotenv.config({ path: ".env.development" });
		define.global = {};
	} else if (mode === "production") {
		dotenv.config({ path: ".env.production" });
	}

	return {
		define: define,
		base: VITE_PUBLIC_PATH,
		build: {
			outDir: "dist",
			terserOptions: {
				compress: {
					// 生产环境移除console
					drop_console: false,
				},
			},
			sourcemap: false,
			// 启用 CSS 代码拆分
			cssCodeSplit: true,
			// 禁用 gzip 压缩大小报告。压缩大型输出文件可能会很慢，因此禁用该功能可能会提高大型项目的构建性能。
			reportCompressedSize: false,
			// 规定触发警告的 chunk 大小。（以 kbs 为单位）
			chunkSizeWarningLimit: 1024 * 6,
			// 自定义底层的 Rollup 打包配置
			rollupOptions: {
				output: {
					manualChunks: {
						vue: ["vue", "vue-router", "pinia"],
						i18n: ["vue-i18n"],
						ui: ["naive-ui"],
						astral3d: ["@astral3d/engine"],
					},
				},
			},
		},
		root,
		plugins: [
			vue(),
			Unocss(),
			Components({
				resolvers: [NaiveUiResolver()],
			}),
			// 本地开发https证书
			mkcert(),
			viteStaticCopy({
				targets: [{ src: "node_modules/@astral3d/engine/dist/libs/*", dest: "assets/libs" }],
			}),
			...plugins,
		],
		resolve: {
			alias: {
				"~": path.resolve(__dirname, "./types"),
				"@": path.resolve(__dirname, "./src"), // 直接指向源代码
			},
			extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".vue"],
		},
		optimizeDeps: {
			exclude: ["keyframe-resample", "draco3dgltf", "@astral3d/engine"],
		},
		server: {
			host: true,
			port: VITE_PORT,
			//设置 server.hmr.overlay 为 false 可以禁用开发服务器错误的屏蔽
			// hmr: { overlay: false },
			headers: {
				"Cross-Origin-Embedder-Policy": "require-corp",
				"Cross-Origin-Opener-Policy": "same-origin",
			},
			cors: {
				origin: "*",
				credentials: true,
			},
			proxy: {
				"^/api": {
					target: env.VITE_PROXY_URL,
					changeOrigin: true,
					rewrite: path => path.replace(new RegExp(`^/api`), "/api"),
				},
				"^/file/static": {
					target: env.VITE_PROXY_URL,
					changeOrigin: true,
					rewrite: path => path.replace(new RegExp(`^/file/static`), "/api/common/static"),
				},
			},
		},
	};
});
