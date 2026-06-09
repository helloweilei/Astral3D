import { defineNavbarConfig } from 'vuepress-theme-plume';
import { version } from '../../package.json';

export const navbar = defineNavbarConfig([
    {
        text: '指南',
        icon: 'icon-park-outline:guide-board',
        link: '/notes/guide/quick-start/介绍.md',
    },
    { text: 'SDK', link: '/notes/sdk/', icon: 'carbon:api' },
    { text: '示例', link: 'https://examples.astraljs.com/', icon: 'carbon:carbon-for-ibm-dotcom' },
    { text: '推广中心', link: '/notes/promotion/README.md', icon: 'mdi:star-shooting-outline' },
    { text: '商务合作', link: '/notes/cooperation/README.md', icon: 'carbon:partnership' },
    {
        text: '更多',
        icon: 'icon-park-outline:more-three',
        items: [
            { text: '常见问题', link: '/notes/more/questions.md', icon: 'wpf:faq' },
        ],
    },
    {
        text: `${version}`,
        icon: 'codicon:versions',
        items: [
            { 
                text: '更新日志', 
                link: '/notes/update/logs/',
            }
        ],
    },
])
