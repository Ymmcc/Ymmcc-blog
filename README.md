# Ymmcc Blog

一个精致现代化的个人学习博客，基于 Docusaurus 构建，集成 GSAP 动画和响应式设计。

## 设计特色

- **深邃蓝紫渐变** - 科技感与知识感的完美融合
- **玻璃态效果** - 现代感十足的毛玻璃 UI
- **GSAP 动画** - 流畅的入场动画和交互效果
- **粒子背景** - 动态粒子增加视觉深度
- **响应式设计** - 完美适配各种设备
- **亮暗主题** - 支持手动切换和跟随系统

## 功能特性

- 学习笔记管理（前端、后端、算法）
- 代码片段展示（带语法高亮）
- 项目作品展示
- 学习日志记录
- 亮暗主题切换
- GSAP 动画效果
- 响应式设计
- GitHub Pages 自动部署

## 快速开始

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm start
```

访问 http://localhost:3000/Ymmcc-blog/ 查看效果。

### 构建

```bash
npm run build
```

### 本地预览构建结果

```bash
npm run serve
```

## 部署到 GitHub Pages

### 1. 创建 GitHub 仓库

1. 在 GitHub 上创建一个新仓库，命名为 `Ymmcc-blog`
2. 仓库设置为公开（Public）

### 2. 修改配置

编辑 `docusaurus.config.ts`，修改以下配置：

```typescript
// 替换为你的 GitHub 用户名
url: 'https://yymmcc.github.io',
baseUrl: '/Ymmcc-blog/',
organizationName: 'yymmcc',
projectName: 'Ymmcc-blog',
```

### 3. 推送代码

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yymmcc/Ymmcc-blog.git
git push -u origin main
```

### 4. 配置 GitHub Pages

1. 进入仓库的 Settings > Pages
2. Source 选择 "GitHub Actions"
3. 保存设置

### 5. 自动部署

推送到 `main` 分支后，GitHub Actions 会自动构建并部署到 GitHub Pages。

访问 https://yymmcc.github.io/Ymmcc-blog/ 查看效果。

## 内容结构

```
docs/
├── frontend/          # 前端笔记
├── backend/           # 后端笔记
├── algorithm/         # 算法笔记
└── projects/          # 项目作品

blog/
├── code-snippets/     # 代码片段
└── daily/             # 学习日志
```

## 添加内容

### 添加学习笔记

在 `docs/` 目录下创建 Markdown 文件：

```markdown
---
sidebar_position: 1
---

# 标题

内容...
```

### 添加代码片段

在 `blog/` 目录下创建 Markdown 文件：

```markdown
---
slug: my-code-snippet
title: 代码片段标题
authors: [default]
tags: [javascript, 前端]
---

内容...

{/* truncate */}

更多内容...
```

### 添加学习日志

在 `blog/` 目录下创建 Markdown 文件：

```markdown
---
slug: daily-learning-2026-06-06
title: 学习日志 - 2026年6月6日
authors: [default]
tags: [每日一题, 学习日志]
---

内容...

{/* truncate */}

更多内容...
```

## 技术栈

- React 19
- TypeScript
- Docusaurus 3.10
- GSAP 3
- GitHub Actions

## 设计系统

### 色彩

- **主色调**: 深蓝紫渐变 (hsl(250, 85%, 65%))
- **强调色**: 青蓝色 (hsl(190, 90%, 55%))
- **背景**: 深邃渐变 + 玻璃态效果

### 字体

- **标题**: Space Grotesk - 现代感强，适合科技主题
- **正文**: DM Sans - 清晰易读，适合长文阅读
- **代码**: JetBrains Mono - 程序员首选

### 动画

- **入场动画**: GSAP timeline 实现错落有致的元素入场
- **滚动触发**: IntersectionObserver + GSAP 实现滚动动画
- **交互效果**: hover 时的弹性动画和光效

## 许可证

MIT License
