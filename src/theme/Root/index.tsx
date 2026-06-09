import React, { useEffect } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

// 侧边栏 TOC 集成组件
function SidebarTOCScript() {
  useEffect(() => {
    // 延迟执行，确保页面完全加载
    const timer = setTimeout(() => {
      initSidebarTOC();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return null;
}

function initSidebarTOC() {
  // 获取右侧 TOC
  const toc = document.querySelector('.theme-doc-toc-desktop .table-of-contents');
  if (!toc) return;

  // 获取当前文章标题
  const articleTitle = document.querySelector('.theme-doc-sidebar-menu .menu__link--active');
  if (!articleTitle) return;

  // 获取文章标题所在的 li 元素
  const articleLi = articleTitle.closest('li');
  if (!articleLi) return;

  // 检查是否已经添加了 TOC
  if (articleLi.querySelector('.sidebar-toc')) return;

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
    const level = getHeadingLevel(link);
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

  // 插入到文章标题的 li 元素内
  articleLi.appendChild(tocContainer);

  // 添加展开/折叠交互
  setupToggle(articleTitle, tocContainer);
}

function getHeadingLevel(link) {
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

function setupToggle(titleElement, tocContainer) {
  // 添加展开/折叠箭头
  const arrow = document.createElement('span');
  arrow.className = 'sidebar-toc-arrow';
  arrow.innerHTML = '▼';

  titleElement.appendChild(arrow);

  // 默认展开
  tocContainer.style.display = 'block';
  arrow.style.transform = 'rotate(0deg)';

  // 点击箭头展开/折叠
  arrow.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const isVisible = tocContainer.style.display !== 'none';
    tocContainer.style.display = isVisible ? 'none' : 'block';
    arrow.style.transform = isVisible ? 'rotate(-90deg)' : 'rotate(0deg)';
  });
}

// Root 组件
export default function Root({ children }) {
  return (
    <>
      {children}
      <BrowserOnly>
        {() => <SidebarTOCScript />}
      </BrowserOnly>
    </>
  );
}
