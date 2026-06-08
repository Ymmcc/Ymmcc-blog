# 侧边栏 TOC 集成设计文档

## 概述

将 Docusaurus 文章内的标题层级（TOC）集成到左侧导航栏中，实现点击文章标题展开显示文章内各级标题的功能。

## 目标

1. 点击文章标题后，在左侧导航栏中展开显示文章内的标题层级
2. 显示所有层级的标题（H2、H3、H4 等）
3. 点击文章标题展开标题列表，点击具体标题才跳转

## 技术方案

### 方案：JavaScript 动态移动 TOC

使用 JavaScript 将右侧的 TOC 内容移动到左侧导航栏中。

### 实现细节

#### 1. CSS 调整

**文件**: `src/css/custom.css`

```css
/* 隐藏右侧 TOC（已实现） */
.theme-doc-toc-desktop {
  display: none !important;
}

/* 左侧导航栏中的 TOC 样式 */
.sidebar-toc {
  margin-left: 16px;
  border-left: 2px solid var(--ifm-color-primary-lighter);
  padding-left: 12px;
}

.sidebar-toc-item {
  padding: 4px 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
  transition: color var(--transition-fast);
}

.sidebar-toc-item:hover {
  color: var(--ifm-color-primary);
}

.sidebar-toc-item--active {
  color: var(--ifm-color-primary);
  font-weight: 600;
}

/* 不同层级的缩进 */
.sidebar-toc-item--level-3 {
  margin-left: 12px;
}

.sidebar-toc-item--level-4 {
  margin-left: 24px;
}
```

#### 2. JavaScript 逻辑

**文件**: `static/js/sidebar-toc.js`

```javascript
// 侧边栏 TOC 集成
class SidebarTOC {
  constructor() {
    this.init();
  }

  init() {
    // 监听页面加载
    this.setupPageLoad();
    // 监听路由变化
    this.setupRouteChange();
  }

  setupPageLoad() {
    document.addEventListener('DOMContentLoaded', () => {
      this.moveTOC();
    });
  }

  setupRouteChange() {
    // Docusaurus 使用客户端路由
    // 监听路由变化事件
    window.addEventListener('popstate', () => {
      setTimeout(() => this.moveTOC(), 100);
    });

    // 监听点击链接事件
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && link.href.includes('/docs/')) {
        setTimeout(() => this.moveTOC(), 100);
      }
    });
  }

  moveTOC() {
    // 获取右侧 TOC
    const toc = document.querySelector('.theme-doc-toc-desktop .table-of-contents');
    if (!toc) return;

    // 获取当前文章标题
    const articleTitle = document.querySelector('.theme-doc-sidebar-menu .menu__link--active');
    if (!articleTitle) return;

    // 检查是否已经添加了 TOC
    const existingTOC = articleTitle.parentElement.querySelector('.sidebar-toc');
    if (existingTOC) return;

    // 创建 TOC 容器
    const tocContainer = document.createElement('ul');
    tocContainer.className = 'sidebar-toc';

    // 复制 TOC 内容
    const tocItems = toc.querySelectorAll('li');
    tocItems.forEach(item => {
      const link = item.querySelector('a');
      if (!link) return;

      const tocItem = document.createElement('li');
      tocItem.className = 'sidebar-toc-item';

      // 根据标题层级添加缩进
      const level = this.getHeadingLevel(link);
      if (level > 2) {
        tocItem.classList.add(`sidebar-toc-item--level-${level}`);
      }

      const tocLink = document.createElement('a');
      tocLink.href = link.href;
      tocLink.textContent = link.textContent;
      tocLink.className = 'sidebar-toc-link';

      tocItem.appendChild(tocLink);
      tocContainer.appendChild(tocItem);
    });

    // 插入到文章标题后面
    articleTitle.parentElement.appendChild(tocContainer);

    // 添加展开/折叠交互
    this.setupToggle(articleTitle, tocContainer);
  }

  getHeadingLevel(link) {
    const href = link.getAttribute('href');
    if (!href) return 2;

    // 从 href 中提取标题 ID
    const id = href.split('#')[1];
    if (!id) return 2;

    // 查找对应的标题元素
    const heading = document.getElementById(id);
    if (!heading) return 2;

    // 根据标题标签判断层级
    const tag = heading.tagName.toLowerCase();
    if (tag === 'h2') return 2;
    if (tag === 'h3') return 3;
    if (tag === 'h4') return 4;
    if (tag === 'h5') return 5;
    if (tag === 'h6') return 6;

    return 2;
  }

  setupToggle(titleElement, tocContainer) {
    // 添加展开/折叠箭头
    const arrow = document.createElement('span');
    arrow.className = 'sidebar-toc-arrow';
    arrow.innerHTML = '▼';
    arrow.style.cssText = `
      display: inline-block;
      margin-left: 8px;
      font-size: 0.7rem;
      transition: transform 0.2s ease;
      cursor: pointer;
    `;

    titleElement.appendChild(arrow);

    // 默认展开
    tocContainer.style.display = 'block';
    arrow.style.transform = 'rotate(0deg)';

    // 点击标题展开/折叠
    titleElement.addEventListener('click', (e) => {
      // 如果点击的是链接本身，不阻止默认行为
      if (e.target.tagName === 'A' && !e.target.classList.contains('sidebar-toc-link')) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const isVisible = tocContainer.style.display !== 'none';
      tocContainer.style.display = isVisible ? 'none' : 'block';
      arrow.style.transform = isVisible ? 'rotate(-90deg)' : 'rotate(0deg)';
    });
  }
}

// 初始化
new SidebarTOC();
```

#### 3. 集成到 Docusaurus

**文件**: `docusaurus.config.ts`

在 `themeConfig` 中添加自定义脚本：

```typescript
themeConfig: {
  // ... 其他配置
  scripts: [
    {
      src: '/Ymmcc-blog/js/sidebar-toc.js',
      async: true,
    },
  ],
}
```

#### 4. 静态资源

**文件**: `static/js/sidebar-toc.js`

将 JavaScript 代码复制到静态目录中。

## 交互流程

1. 用户访问文档页面
2. 页面加载完成后，JavaScript 检测右侧 TOC
3. 将 TOC 内容移动到左侧导航栏中，作为当前文章的子目录
4. 文章标题显示可点击的展开/折叠箭头
5. 默认展开显示文章标题
6. 点击文章标题可折叠/展开
7. 点击具体标题跳转到对应位置

## 视觉效果

```
📁 前端开发
  ├─ 前端开发 (点击跳转)
  └─ React Hooks 入门指南 ▼ (点击展开/折叠)
      ├─ useState (点击跳转)
      ├─ useEffect (点击跳转)
      ├─ 自定义 Hook (点击跳转)
      └─ 最佳实践 (点击跳转)
📁 后端开发
  └─ ...
```

## 注意事项

1. **性能优化**：避免重复添加 TOC，检查是否已存在
2. **路由处理**：正确处理 Docusaurus 的客户端路由
3. **响应式设计**：确保在移动端也能正常显示
4. **样式一致性**：与现有导航栏样式保持一致

## 测试场景

1. 访问文档页面，检查 TOC 是否正确显示
2. 点击文章标题，检查展开/折叠功能
3. 点击具体标题，检查跳转功能
4. 在不同页面间切换，检查 TOC 更新
5. 在移动端访问，检查响应式显示

## 依赖

- Docusaurus 3.10.1
- 现有的 CSS 样式系统
- 浏览器 JavaScript 支持
