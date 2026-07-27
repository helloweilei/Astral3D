# Vue 组件约定补充参考

主规则见 [SKILL.md](SKILL.md)。本文件供需要细节或排查不一致时阅读。

## 目录速查

```
packages/editor/src/
  components/          # 可复用；es/ 下为 Es* 封装
  views/editor/layouts/sidebar/
    SidebarTerrain.vue           # 父面板
    terrain/Sidebar.Terrain.*.vue
    weather/Sidebar.Weather.*.vue
    …
  language/zh-CN-en-US.ts
  assets/less/common.less        # .sidebar-config-item
```

## 控件尺寸对照

| 场景 | size |
|------|------|
| 新侧栏配置（地形/天气等）输入、选择、按钮 | `tiny` |
| checkbox / color-picker | `small` |
| 工具栏、对话框主操作 | `small` |
| 几何参数旧面板 | 多为 `small` + Uno `!w-90px`（改旧文件可沿用） |

## defineModel vs 历史写法

**新侧栏子面板（推荐）**

```ts
let config = defineModel<IAppProject.Terrain>({ required: true });
const emit = defineEmits<{ change: [] }>();
```

**Es 封装 / 旧组件**

```ts
const props = withDefaults(defineProps<{ value: number }>(), { value: 0 });
const emit = defineEmits(["update:value", "change"]);
```

父级汇总示例（地形）：

```ts
// SidebarTerrain.vue 思路
function onTerrainChange() {
  App.project.setKey("terrain", toRaw(terrainConfig));
  // 必要时通知 window.viewer.modules.terrain
}
```

单文件自管配置（天气 Fog 等历史模式）也可直接 `getKey`/`setKey`；拆子面板时优先改为 model + change。

## i18n 文件模式

```ts
// zh-CN-en-US.ts
layout: {
  sider: {
    terrain: {
      Origin: "坐标原点",
      "Select Layer": "图层",
      "URL Template": "URL",
    },
  },
},
```

- 无空格：`t("layout.sider.terrain.Origin")`
- 有空格：`t("layout.sider.terrain['Select Layer']")`
- 下拉 option 的 `label` 也走 `t()`，不要写死 `"Linear"` 等英文

## 图标

- 侧栏提示/箭头等：`@vicons/ionicons5`（如 `HelpCircleOutline`、`LayersOutline`）
- 工具栏/资源区：常见 `@vicons/carbon`
- 与邻近文件保持一致，勿混用同一按钮两套库

## 与引擎交互细节

```ts
import { App, Utils, Hooks } from "@astral3d/engine";

// 配置副本（自管面板）
const fogConfig = reactive(JSON.parse(JSON.stringify(App.project.getKey("weather.fog"))));

// Viewer 就绪后再绑
Hooks.useAddOnceSignal("viewerInitCompleted", () => { /* … */ });

// 运行时
const bounds = window.viewer?.modules?.terrain?.estimateBoundsFromCamera();
```

几何/材质变更走 Command，保证撤销：

```ts
App.execute(new SetGeometryCommand(App.selected, new BoxGeometry(...)));
```

## 样式片段习惯

```less
.hint-icon {
  color: var(--n-text-color-3);
  cursor: help;
}

.url-field {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-width: 0;
}
```

Uno 与 Less 可并存；能用工具类表达的间距不必再写 Less。

## 反例（避免）

| 反例 | 正确做法 |
|------|----------|
| Options API / `defineComponent` | `<script setup lang="ts">` |
| 硬编码 UI 文案 | `t(...)` + 写入 `zh-CN-en-US.ts` |
| 使用 `EsInputNumber` 却不 import | 显式 `@/components/es/...` |
| 新建第三套侧栏布局 class | 用 `sidebar-config-item` |
| 新侧栏数值用 `size="small"` | 用 `tiny` |
| `window.viewer.xxx` 无可选链 / 假定已 init | `?.` + `Hooks.useAddOnceSignal` |
| 空的 `<style scoped lang="less"></style>` | 删除 |
| `*_backup.vue` 入库 | 不提交备份文件 |
| 新代码随意 `any` / `@ts-ignore` | 用 `IAppProject.*` 等类型或收窄 |

## 历史例外（勿扩散）

- `SidebarMaterial*Property.vue` 命名
- `.sider-scene-geometry-item` 布局（样式依赖父组件）
- 几何面板 `size="small"`

维护旧文件时保持局部一致即可；跨域复制模式时按 SKILL 新约定写。

## 自检清单

- [ ] script → template → style
- [ ] 侧栏行用 `sidebar-config-item`，控件 size 正确
- [ ] Es* 已 import；n-* 无需 import
- [ ] 文案全部 i18n；新 key 已加
- [ ] 子面板 emit `change`，父级写 `App.project`
- [ ] viewer 访问安全；TS 无新增错误/警告
