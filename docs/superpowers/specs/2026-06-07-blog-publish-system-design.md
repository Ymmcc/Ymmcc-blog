# 博客发布系统设计文档

## 概述

为 Ymmcc Blog 添加一个网页端博客发布系统，支持密码验证、Markdown 编辑、独立代码片段编辑器，并通过 GitHub API 直接提交到仓库。

## 功能需求

### 1. 密码验证
- 固定密码：`Ymc060214@`
- 前端验证，不发送到服务器
- 验证通过后才能进入编辑页面

### 2. 文章信息编辑
- 标题
- 分类：学习笔记 / 学习日志 / 项目作品
- 标签：支持多个标签
- 摘要：简短描述

### 3. 内容编辑
#### Markdown 编辑器
- 支持标准 Markdown 语法
- 实时预览功能
- 支持标题、列表、链接、图片等

#### 代码片段编辑器
- 独立代码块管理
- 多语言支持：JavaScript、Python、Java、C++、TypeScript 等
- 每个代码块功能：
  - 语言选择下拉框
  - 代码编辑区（Monaco Editor）
  - 折叠/展开按钮
  - 复制按钮
  - 删除按钮

### 4. 发布功能
- 输入 GitHub Token（每次手动输入）
- 通过 GitHub API 提交文件
- 自动触发 GitHub Actions 部署
- 发布成功提示

## 页面结构

### 发布页面 `/publish`

```
┌─────────────────────────────────────────┐
│              密码验证区域                 │
│  密码输入框 + [验证] 按钮                │
└─────────────────────────────────────────┘
                    ↓ 验证通过
┌─────────────────────────────────────────┐
│              文章信息区域                 │
│  标题 | 分类 | 标签 | 摘要              │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│              内容编辑区域                 │
│  ┌─────────────────────────────────┐   │
│  │  Markdown 编辑器                 │   │
│  │  - 编辑区 + 预览区               │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  代码片段编辑器                   │   │
│  │  - [添加代码块] 按钮              │   │
│  │  - 代码块列表                    │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│              发布区域                    │
│  GitHub Token 输入框 + [发布] 按钮      │
└─────────────────────────────────────────┘
```

## 技术实现

### 1. 依赖库
- `@uiw/react-md-editor`：Markdown 编辑器
- `@monaco-editor/react`：代码编辑器（VS Code 同款）
- `@docusaurus/Link`：路由导航

### 2. 密码验证
```typescript
const PASSWORD = 'Ymc060214@';

function verifyPassword(input: string): boolean {
  return input === PASSWORD;
}
```

### 3. GitHub API 集成
```typescript
async function publishToGitHub(
  token: string,
  path: string,
  content: string,
  message: string
) {
  const response = await fetch(
    `https://api.github.com/repos/Ymmcc/Ymmcc-blog/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        content: btoa(unescape(encodeURIComponent(content))),
      }),
    }
  );
  return response.json();
}
```

### 4. 文件路径规则
- 学习笔记：`docs/{category}/{slug}.md`
- 学习日志：`blog/{date}-{slug}.md`
- 项目作品：`docs/projects/{slug}.md`

### 5. Markdown 输出格式
```markdown
---
title: 文章标题
date: 2026-06-07
tags: [标签1, 标签2]
---

这里是 Markdown 文本内容。

## 代码片段

```javascript
// 代码块 1
function hello() {
  console.log("Hello World!");
}
```

```python
# 代码块 2
def hello():
    print("Hello World!")
```
```

## 组件设计

### 1. PublishPage 组件
- 主页面组件
- 管理密码验证状态
- 管理文章数据状态

### 2. PasswordVerify 组件
- 密码输入框
- 验证按钮
- 错误提示

### 3. ArticleInfoForm 组件
- 标题输入
- 分类选择
- 标签输入
- 摘要输入

### 4. MarkdownEditor 组件
- Markdown 编辑器
- 实时预览

### 5. CodeSnippetEditor 组件
- 代码块列表
- 添加代码块按钮
- 每个代码块的编辑、折叠、复制、删除功能

### 6. PublishButton 组件
- GitHub Token 输入
- 发布按钮
- 发布状态提示

## 样式设计

### 颜色方案
- 密码验证区域：浅紫色背景
- 编辑区域：白色背景，深色边框
- 代码编辑器：深色主题（Monaco Editor 默认）
- 按钮：渐变紫色

### 响应式设计
- 桌面端：双栏布局（编辑 + 预览）
- 移动端：单栏布局，可切换编辑/预览

## 安全考虑

1. **密码验证**：仅前端验证，不发送到服务器
2. **GitHub Token**：每次手动输入，不存储
3. **XSS 防护**：Markdown 渲染时进行转义
4. **CSRF 防护**：使用 GitHub Token 验证

## 成功标准

1. 密码验证功能正常
2. Markdown 编辑器可正常使用
3. 代码片段编辑器支持多语言
4. 代码块可折叠、复制、删除
5. 发布功能正常，文件提交到 GitHub
6. 响应式设计，移动端可用
