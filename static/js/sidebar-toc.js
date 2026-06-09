(function() {
  'use strict';

  // 存储当前页面的 TOC 状态
  var currentArticleTOC = null;
  var currentArrow = null;

  // 获取标题级别
  function getHeadingLevel(link) {
    var href = link.getAttribute('href') || '';
    var match = href.match(/^#(.+)/);
    if (!match) return 2;
    var id = match[1];
    var target = document.getElementById(id);
    if (!target) return 2;
    var tag = target.tagName.toLowerCase();
    if (tag === 'h1') return 1;
    if (tag === 'h2') return 2;
    if (tag === 'h3') return 3;
    if (tag === 'h4') return 4;
    if (tag === 'h5') return 5;
    if (tag === 'h6') return 6;
    return 2;
  }

  // 清除旧的 TOC
  function cleanupOldTOC() {
    var oldContainers = document.querySelectorAll('.sidebar-toc');
    oldContainers.forEach(function(el) {
      if (el.parentElement) {
        el.parentElement.removeChild(el);
      }
    });
    var oldArrows = document.querySelectorAll('.sidebar-toc-arrow');
    oldArrows.forEach(function(el) {
      if (el.parentElement) {
        el.parentElement.removeChild(el);
      }
    });
    currentArticleTOC = null;
    currentArrow = null;
  }

  // 检查父级菜单是否折叠
  function isParentMenuCollapsed(articleLi) {
    // 查找所有父级 menu__list 元素
    var parent = articleLi.parentElement;
    while (parent) {
      if (parent.classList && parent.classList.contains('menu__list')) {
        var style = window.getComputedStyle(parent);
        if (style.display === 'none' || style.visibility === 'hidden') {
          return true;
        }
        if (parent.hasAttribute('hidden')) {
          return true;
        }
      }
      parent = parent.parentElement;
    }
    return false;
  }

  // 隐藏 TOC
  function hideTOC() {
    if (currentArticleTOC) {
      currentArticleTOC.style.display = 'none';
    }
    if (currentArrow) {
      currentArrow.style.transform = 'rotate(-90deg)';
    }
  }

  // 显示 TOC
  function showTOC() {
    if (currentArticleTOC) {
      currentArticleTOC.style.display = 'block';
    }
    if (currentArrow) {
      currentArrow.style.transform = 'rotate(0deg)';
    }
  }

  // 初始化侧边栏 TOC
  function initSidebarTOC() {
    // 查找右侧的目录
    var toc = document.querySelector('.theme-doc-toc-desktop .table-of-contents');
    if (!toc) {
      return;
    }

    // 查找当前激活的文章标题 - 使用更精确的选择器
    // Docusaurus 结构：menu__list-item > menu__link menu__link--active
    var activeLinks = document.querySelectorAll('.theme-doc-sidebar-menu .menu__link--active');
    if (!activeLinks || activeLinks.length === 0) {
      return;
    }

    // 取最后一个激活的链接（最深层级的）
    var articleTitle = activeLinks[activeLinks.length - 1];

    // 查找包含该标题的 li 元素
    var articleLi = articleTitle.closest('li.menu__list-item');
    if (!articleLi) {
      return;
    }

    // 检查是否已经添加了 TOC
    if (articleLi.querySelector('.sidebar-toc')) {
      // 更新引用
      currentArticleTOC = articleLi.querySelector('.sidebar-toc');
      currentArrow = articleTitle.querySelector('.sidebar-toc-arrow');
      return;
    }

    // 清除旧的 TOC
    cleanupOldTOC();

    // 创建 TOC 容器
    var tocContainer = document.createElement('ul');
    tocContainer.className = 'sidebar-toc';

    // 复制目录项
    var tocItems = toc.querySelectorAll('li');
    tocItems.forEach(function(item) {
      var link = item.querySelector('a');
      if (!link) return;

      var tocItem = document.createElement('li');
      tocItem.className = 'sidebar-toc-item';

      var level = getHeadingLevel(link);
      if (level > 2) {
        tocItem.classList.add('sidebar-toc-item--level-' + level);
      }

      var tocLink = document.createElement('a');
      tocLink.href = link.href;
      tocLink.textContent = link.textContent;
      tocLink.className = 'sidebar-toc-link';

      // 点击链接时滚动到目标位置
      tocLink.addEventListener('click', function(e) {
        e.preventDefault();
        var targetId = link.getAttribute('href').substring(1);
        var targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      });

      tocItem.appendChild(tocLink);
      tocContainer.appendChild(tocItem);
    });

    // 将 TOC 添加到文章标题的 li 元素中
    articleLi.appendChild(tocContainer);

    // 设置折叠/展开功能
    var arrow = setupToggle(articleTitle, tocContainer);

    // 存储引用
    currentArticleTOC = tocContainer;
    currentArrow = arrow;

    // 初始检查父级菜单状态
    if (isParentMenuCollapsed(articleLi)) {
      hideTOC();
    }
  }

  // 设置折叠/展开功能
  function setupToggle(titleElement, tocContainer) {
    // 创建箭头
    var arrow = document.createElement('span');
    arrow.className = 'sidebar-toc-arrow';
    arrow.innerHTML = ' ▼';
    titleElement.appendChild(arrow);

    // 初始状态：展开
    tocContainer.style.display = 'block';
    arrow.style.transform = 'rotate(0deg)';

    // 点击箭头切换显示状态
    arrow.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();

      var isVisible = tocContainer.style.display !== 'none';
      if (isVisible) {
        tocContainer.style.display = 'none';
        arrow.style.transform = 'rotate(-90deg)';
      } else {
        tocContainer.style.display = 'block';
        arrow.style.transform = 'rotate(0deg)';
      }
    });

    return arrow;
  }

  // 监听父级菜单折叠状态变化
  function setupParentMenuObserver() {
    // 使用 MutationObserver 监听父级菜单的样式变化
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          var target = mutation.target;
          // 检查是否是 menu__list 元素
          if (target.classList && target.classList.contains('menu__list')) {
            var style = window.getComputedStyle(target);
            if (style.display === 'none') {
              // 父级菜单被折叠，隐藏 TOC
              hideTOC();
            } else {
              // 父级菜单被展开，显示 TOC
              showTOC();
            }
          }
        }
      });
    });

    // 开始观察所有 menu__list 元素
    var menuLists = document.querySelectorAll('.menu__list');
    menuLists.forEach(function(list) {
      observer.observe(list, { attributes: true, attributeFilter: ['style'] });
    });

    return observer;
  }

  // 监听页面变化
  function setupPageListeners() {
    // 监听浏览器前进/后退
    window.addEventListener('popstate', function() {
      setTimeout(initSidebarTOC, 100);
    });

    // 监听所有链接点击（使用事件委托）
    document.addEventListener('click', function(e) {
      var link = e.target.closest('a');
      if (!link) return;

      // 检查是否是侧边栏链接
      var isSidebarLink = link.closest('.theme-doc-sidebar-menu');
      // 检查是否是目录链接
      var isTOCLink = link.closest('.sidebar-toc');

      if (isSidebarLink && !isTOCLink) {
        // 延迟初始化，等待页面内容加载
        setTimeout(initSidebarTOC, 300);
      }
    });

    // 使用 MutationObserver 监听 DOM 变化
    var observer = new MutationObserver(function(mutations) {
      // 检查是否有新的目录被添加
      var hasTOCChanges = mutations.some(function(mutation) {
        return mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0;
      });

      if (hasTOCChanges) {
        // 延迟初始化，避免频繁触发
        setTimeout(initSidebarTOC, 200);
      }
    });

    // 开始观察
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // 设置父级菜单观察器
    setupParentMenuObserver();
  }

  // 初始化函数
  function init() {
    // 设置页面监听器
    setupPageListeners();

    // 首次初始化
    initSidebarTOC();
  }

  // 确保 DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM 已经加载完成
    init();
  }

  // 额外的延迟初始化（确保 Docusaurus 完成渲染）
  setTimeout(initSidebarTOC, 500);
  setTimeout(initSidebarTOC, 1000);
  setTimeout(initSidebarTOC, 2000);
})();
