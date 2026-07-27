---
name: vue-component-dev
description: >-
    Astral3D packages/editor Vue 组件开发约定：script setup、naive-ui、Es* 封装、
    sidebar-config-item、defineModel/emit change、i18n、UnoCSS/Less。
    Use when creating or editing Vue SFCs in packages/editor, sidebar panels
    (Sidebar.*), Es* components, terrain/weather/material UI, or when the user
    asks about Vue component style, layout, or i18n in the editor package.
---

# Astral3D Vue 组件开发

编写或修改 `packages/editor` 下的 `.vue` 时遵循本约定。细节与反例见 [reference.md](reference.md)。

## 技术栈（必须）

- `<script setup lang="ts">`，禁止 Options API / `defineComponent`
- UI：naive-ui（模板直接写 `n-*`，自动按需引入）
- 数值/增强控件：手动 `import` `Es*`（`@/components/es/...`），勿假设自动解析
- 文案：`import { t } from "@/language"`，禁止硬编码中英文 UI
- 样式：`scoped` + `lang="less"`；布局/间距优先 UnoCSS；主题色用 `var(--n-*)`
- 引擎：`@astral3d/engine`（`App` / `Utils` / `Hooks`）；运行时用 `window.viewer?.…`
- 样式: 优先使用uno-css, 复杂样式才考虑<style>...</style>

## 文件放置与命名

| 类型        | 位置                            | 命名                             |
| ----------- | ------------------------------- | -------------------------------- |
| 可复用控件  | `src/components/`               | PascalCase；封装控件用 `Es*`     |
| 路由/大布局 | `src/views/`                    | PascalCase                       |
| 侧栏父面板  | `views/editor/layouts/sidebar/` | `SidebarXxx.vue`                 |
| 侧栏子配置  | 同域子目录                      | `Sidebar.<Domain>.<Feature>.vue` |

新侧栏子面板跟 `Sidebar.Terrain.*` / `Sidebar.Weather.*` 点号命名；不要再扩散 `SidebarMaterial*Property` 旧拼法。

## 块顺序

新文件统一：

```vue
<script setup lang="ts">
	...
</script>
<template>...</template>
<style scoped lang="less">
	...
</style>
```

无样式时省略 `<style>`，不要留空 style 块。

## 侧栏配置面板（默认模式）

1. 布局类：`sidebar-config-item`（全局 `assets/less/common.less`）
2. 控件 `size`：输入/选择/按钮用 **`tiny`**；checkbox / color-picker 用 **`small`**
3. 数值：优先 `EsInputNumber`，`:show-button="false"`，设 `:decimal` / `:min` / `:max`
4. 数据流：
    - 子面板：`defineModel<T>({ required: true })` + `defineEmits<{ change: [] }>()`
    - 改配置后调用 `emit("change")`；**父组件**负责 `App.project.setKey(...)`
5. `disabled`：用 `computed` 聚合父级/本级 enabled，统一绑到控件

骨架：

```vue
<script setup lang="ts">
	import { computed } from "vue";
	import { t } from "@/language";
	import EsInputNumber from "@/components/es/EsInputNumber.vue";

	const model = defineModel<SomeConfig>({ required: true });
	const emit = defineEmits<{ change: [] }>();
	const disabled = computed(() => !model.value.enabled);

	function onChange() {
		emit("change");
	}
</script>

<template>
	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.domain.Label") }}</span>
		<div>
			<EsInputNumber
				v-model:value="model.foo"
				:disabled="disabled"
				size="tiny"
				:show-button="false"
				:decimal="2"
				@change="onChange"
			/>
		</div>
	</div>
</template>
```

几何/材质若改现有面板，可沿用其既有布局类与 Command 模式；**新建配置域**仍用上面的 `sidebar-config-item` + emit change。

## 引擎交互选型

| 场景                           | 写法                                                                                     |
| ------------------------------ | ---------------------------------------------------------------------------------------- |
| 项目持久配置（天气/地形/特效） | `App.project.getKey` / `setKey`（父级汇总）                                              |
| 可撤销场景编辑（几何/材质）    | `App.execute(new XxxCommand(...))`                                                       |
| Viewer 运行时                  | `window.viewer?.modules?.…`；初始化用 `Hooks.useAddOnceSignal("viewerInitCompleted", …)` |

访问 `window.viewer` 必须可选链；不要假定 `onMounted` 时已就绪。

## i18n

- Key 写在 `packages/editor/src/language/zh-CN-en-US.ts`（英文 key → 中文 value）
- 调用：`t("layout.sider.terrain.Origin")`；含空格用 `t("layout.sider.terrain['Select Layer']")`
- 非 setup 回调可用 `window.$t`；响应式标签用 `cpt` / `window.$cpt`
- 新增文案时中英文件同步补 key（该仓库由同一文件生成双语）

## 样式

- 组件特有样式才写 Less；通用间距用 Uno（`flex`、`gap-4px`、`w-full`、`inline-flex items-center`）
- 颜色/边框：`var(--n-text-color-3)`、`var(--n-border-color)`、`var(--n-primary-color)`
- 改 naive 内部：`:deep(.n-xxx)`
- 不要为装饰再造第三套侧栏布局类

## 完成后

- 补齐缺失的 `Es*` import 与 i18n key
- 修复引入的 TS / 模板类型错误与警告

## 正例对照

- 子面板：`Sidebar.Terrain.Imagery.vue`、`Sidebar.Terrain.Origin.vue`
- 父面板：`SidebarTerrain.vue`
- Es 封装：`components/es/EsInputNumber.vue`
