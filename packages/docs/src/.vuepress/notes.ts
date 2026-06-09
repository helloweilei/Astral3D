import { defineNoteConfig, defineNotesConfig } from 'vuepress-theme-plume'

const updateNote = defineNoteConfig({
    dir: 'update/logs',
    link: '/update',
    sidebar: [
        {
            text: '2025年',
            collapsed: false,
            icon: 'carbon:calendar',
            items: [
                '_2025_01',
                '_2025_02',
                '_2025_03',
                '_2025_04',
                '_2025_05',
                '_2025_06',
            ]
        },
        {
            text: '2024年',
            collapsed: false,
            icon: 'carbon:calendar',
            items: [
                '_2024_03',
                '_2024_04',
                '_2024_05',
                '_2024_06',
                '_2024_07',
                '_2024_08',
                '_2024_09',
                '_2024_10',
                '_2024_11',
                '_2024_12',
            ]
        },
        {
            text: '2023年',
            collapsed: false,
            icon: 'carbon:calendar',
            items: [
                '_2023_02',
                '_2023_03',
                '_2023_04',
                '_2023_05',
                '_2023_07',
                '_2023_08',
            ]
        }
    ]
})

const planNote = defineNoteConfig({
    dir: 'update/plan',
    link: '/update/plan',
    sidebar: 'auto'
})

const guideNote = defineNoteConfig({
    dir: 'guide',
    link: '/guide',
    sidebar: [
        {
            text: '快速入门',
            collapsed: false,
            prefix: 'quick-start',
            icon: 'carbon:lightning',
            items: [
                '介绍',
                '安装',
                '项目结构',
                '部署'
            ]
        },
        {
            text: '编辑器使用手册',
            collapsed: false,
            prefix: 'manual',
            icon: 'carbon:apps',
            items: [
                {
                    text: '首页',
                    collapsed: false,
                    prefix: 'home',
                    items: [
                        '项目',
                        '数据中心',
                        '资源中心',
                        '设置中心',
                    ]
                },
                {
                    text: '编辑器',
                    collapsed: false,
                    prefix: 'editor',
                    items: [
                        '界面',
                        "顶栏",
                        {
                            text: '左侧边栏',
                            collapsed: false,
                            prefix: 'leftSidebar',
                            items: [
                                '场景树',
                                'CAD解析预览',
                                'BIM轻量化',
                            ]
                        },
                        {
                            text: '视口',
                            collapsed: false,
                            prefix: 'viewport',
                            items: [
                                '2D图纸',
                                '3D场景'
                            ]
                        },
                        {
                            text: '扩展栏',
                            collapsed: false,
                            prefix: 'extras',
                            items: [
                                '资源中心',
                                '动画编辑器',
                                '日志'
                            ]
                        },
                        {
                            text: '右侧边栏',
                            collapsed: false,
                            prefix: 'rightSidebar',
                            items: [
                                '场景配置',
                                '渲染器配置',
                                '后期处理',
                                '天气',
                                '历史记录',
                                '场景图纸',
                                '对象',
                                '几何',
                                '材质',
                                '动画',
                                '脚本',
                                '粒子',
                                '广告牌',
                                'Html面板',
                            ]
                        },
                    ]
                },
                {
                    text: '预览页',
                    collapsed: false,
                    prefix: 'preview',
                    items: [
                        '界面',
                    ]
                },
            ]
        },
        {
            text: '插件系统',
            collapsed: false,
            prefix: 'plugins',
            icon: 'carbon:lightning',
            items: [
                '入门',
                '插件开发',
                {
                    text: '内置插件',
                    collapsed: false,
                    prefix: 'builtin',
                    icon: 'carbon:plug',
                    items: [
                        'glTFHandler'
                    ]
                }
            ]
        },
    ]
})

const sdkNote = defineNoteConfig({
    dir: 'sdk',
    link: '/notes/sdk/',
    sidebar: [
        { text: '总览', link: '/notes/sdk/' },
        {
            text: '核心入口',
            collapsed: false,
            icon: 'carbon:api',
            items: [
                'core/Viewer',
                'core/App',
                'core/Preview',
                'core/Loader',
                'core/Package',
            ]
        },
        {
            text: '应用模块',
            collapsed: false,
            prefix: 'modules/app',
            icon: 'carbon:application',
            items: [
                'Config',
                'Project',
                'History',
                'Resource',
                'Selector',
                'Storage',
                'CSM',
            ]
        },
        {
            text: '视口模块',
            collapsed: false,
            prefix: 'modules/viewer',
            icon: 'carbon:view',
            items: [
                'Helper',
                'CameraManage',
                'Effect',
                'Weather',
                'Signals',
                'ParticleSystem',
                'Drag',
            ]
        },
        {
            text: '对象与资源',
            collapsed: false,
            prefix: 'objects',
            icon: 'carbon:cube',
            items: [
                { text: '概览', link: '/notes/sdk/objects/' },
                '基础对象',
                '广告牌',
                'HTML面板',
                '粒子对象',
            ]
        },
        {
            text: '材质与几何',
            collapsed: false,
            prefix: 'materials',
            icon: 'carbon:3d-cursor',
            items: [
                { text: '概览', link: '/notes/sdk/materials/' },
                'TeapotGeometry',
                'Shader材质',
            ]
        },
        {
            text: '工具类',
            collapsed: false,
            prefix: 'tools',
            icon: 'carbon:tools',
            items: [
                { text: '概览', link: '/notes/sdk/tools/' },
                'Roaming',
                'MiniMap',
                'ClippedEdgesBox',
                'Measure',
                'Export',
                'ModelExplode',
            ]
        },
        {
            text: '命令系统',
            collapsed: false,
            prefix: 'commands',
            icon: 'carbon:terminal',
            items: [
                { text: '概览', link: '/notes/sdk/commands/' },
                '对象命令',
                '脚本命令',
                '属性命令',
                '变换命令',
                '几何命令',
                '材质命令',
                '场景命令',
            ]
        },
        {
            text: '时间轴与粒子',
            collapsed: false,
            icon: 'carbon:flow',
            items: [
                { text: 'Timeline', link: '/notes/sdk/timeline/' },
                { text: 'Particle', link: '/notes/sdk/particle/' },
            ]
        },
        {
            text: '通用能力',
            collapsed: false,
            icon: 'carbon:settings',
            items: [
                { text: '常量', link: '/notes/sdk/constants/' },
                { text: 'Utils 与 Hooks', link: '/notes/sdk/utils/' },
            ]
        },
        {
            text: '扩展集成',
            collapsed: false,
            icon: 'carbon:plug',
            items: [
                { text: '脚本', link: '/notes/sdk/script/' },
                { text: 'DXF', link: '/notes/sdk/dxf/' },
                { text: '点云', link: '/notes/sdk/point-cloud/' },
                { text: '插件', link: '/notes/sdk/plugin/' },
            ]
        },
    ]
})

export const notes = defineNotesConfig({
    dir: 'notes',
    link: '/',
    notes: [updateNote, planNote, guideNote, sdkNote],
})
