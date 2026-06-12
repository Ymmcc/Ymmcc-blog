import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Ymmcc Blog',
  tagline: '记录学习，分享知识，持续成长',
  favicon: 'img/favicon.ico',

  // 头部标签
  headTags: [
    {
      tagName: 'script',
      attributes: {
        src: '/Ymmcc-blog/js/sidebar-toc.js',
        defer: 'true',
      },
    },
  ],

  future: {
    v4: true,
  },

  // GitHub Pages 部署配置
  url: 'https://yymmcc.github.io',
  baseUrl: '/Ymmcc-blog/',

  // GitHub pages deployment config
  organizationName: 'yymmcc',
  projectName: 'Ymmcc-blog',
  trailingSlash: false,

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          sidebarCollapsible: true,
          sidebarCollapsed: false,
          showLastUpdateTime: true,
          showLastUpdateAuthor: true,
        },
        blog: {
          showReadingTime: true,
          blogTitle: '学习日志',
          blogDescription: '记录我的学习历程',
          postsPerPage: 10,
          blogSidebarTitle: '最近文章',
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'ignore',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Ymmcc Blog',
      logo: {
        alt: 'Ymmcc Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          to: '/explore',
          label: '探索',
          position: 'left',
        },
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: '学习笔记',
        },
        {
          to: '/publish',
          label: '发布文章',
          position: 'left',
        },
        {
          href: 'https://github.com/yymmcc/Ymmcc-blog',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '学习笔记',
          items: [
            {
              label: '前端开发',
              to: '/docs/frontend/intro',
            },
            {
              label: '后端开发',
              to: '/docs/backend/intro',
            },
            {
              label: '算法',
              to: '/docs/algorithm/intro',
            },
          ],
        },
        {
          title: '内容',
          items: [
            {
              label: '项目作品',
              to: '/docs/projects/intro',
            },
            {
              label: '学习日志',
              to: '/blog',
            },
          ],
        },
        {
          title: '更多',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/yymmcc/Ymmcc-blog',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Ymmcc Blog. 使用 Docusaurus 构建.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['python', 'java', 'cpp', 'csharp', 'typescript'],
    },
    scripts: [
      {
        src: '/Ymmcc-blog/js/sidebar-toc.js',
        async: true,
      },
    ],
  } satisfies Preset.ThemeConfig,
};

export default config;
