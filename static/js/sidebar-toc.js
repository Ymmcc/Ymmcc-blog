(function() {
  'use strict';

  var currentArticleTOC = null;
  var currentArrow = null;
  var scrollObserver = null;

  // ============ 工具函数 ============

  function getHeadingLevel(link) {
    var href = link.getAttribute('href') || '';
    var id = href.substring(1);
    if (!id) return 2;
    var target = document.getElementById(id);
    if (!target) return 2;
    var tag = target.tagName.toLowerCase();
    return parseInt(tag.charAt(1)) || 2;
  }

  // ============ 清理 ============

  function cleanup() {
    document.querySelectorAll('.sidebar-toc, .sidebar-toc-arrow, .sidebar-toc-item--active').forEach(function(el) {
      var parent = el.parentElement;
      if (parent && el.className === 'sidebar-toc-arrow') {
        parent.removeChild(el);
      } else if (parent && el.className.includes('sidebar-toc')) {
        parent.removeChild(el);
      }
    });
    currentArticleTOC = null;
    currentArrow = null;
    if (scrollObserver) { scrollObserver.disconnect(); scrollObserver = null; }
  }

  // ============ 父级菜单折叠检测 ============

  function isMenuCollapsed(articleLi) {
    var p = articleLi.parentElement;
    while (p) {
      if (p.classList && p.classList.contains('menu__list')) {
        var s = window.getComputedStyle(p);
        if (s.display === 'none' || s.visibility === 'hidden' || p.hasAttribute('hidden')) return true;
      }
      p = p.parentElement;
    }
    return false;
  }

  function hideTOC() {
    if (currentArticleTOC) currentArticleTOC.style.display = 'none';
    if (currentArrow) currentArrow.style.transform = 'rotate(-90deg)';
  }

  function showTOC() {
    if (currentArticleTOC) currentArticleTOC.style.display = 'block';
    if (currentArrow) currentArrow.style.transform = 'rotate(0deg)';
  }

  // ============ 滚动高亮 ============

  function setupScrollHighlight() {
    if (scrollObserver) scrollObserver.disconnect();

    // 获取文章内容区域的所有标题
    var article = document.querySelector('article');
    if (!article) return;

    var headings = article.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length === 0) return;

    // 为每个标题创建 IntersectionObserver
    var headingIds = [];
    headings.forEach(function(h) {
      if (h.id) headingIds.push(h.id);
    });
    if (headingIds.length === 0) return;

    // 获取所有 sidebar-toc-item
    var tocItems = currentArticleTOC ? currentArticleTOC.querySelectorAll('.sidebar-toc-item') : [];

    scrollObserver = new IntersectionObserver(function(entries) {
      // 找到第一个进入视口的标题
      var visibleEntry = null;
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          if (!visibleEntry || entry.boundingClientRect.top < visibleEntry.boundingClientRect.top) {
            visibleEntry = entry;
          }
        }
      });

      // 移除所有高亮
      tocItems.forEach(function(item) {
        item.classList.remove('sidebar-toc-item--active');
      });

      if (visibleEntry) {
        var id = visibleEntry.target.id;
        // 找到对应的 sidebar-toc-item 并高亮
        tocItems.forEach(function(item) {
          var link = item.querySelector('.sidebar-toc-link');
          if (link && link.getAttribute('href') === '#' + id) {
            item.classList.add('sidebar-toc-item--active');
          }
        });
      }
    }, {
      rootMargin: '-80px 0px -60% 0px',
      threshold: 0
    });

    headings.forEach(function(h) {
      if (h.id) scrollObserver.observe(h);
    });
  }

  // ============ 创建 TOC ============

  function initSidebarTOC() {
    var toc = document.querySelector('.theme-doc-toc-desktop .table-of-contents');
    if (!toc) return;

    // 通过 URL 路径匹配当前文章链接
    var currentPath = window.location.pathname.replace(/\/$/, '');
    var sidebarLinks = document.querySelectorAll('.theme-doc-sidebar-menu a');
    var articleLink = null;
    for (var i = 0; i < sidebarLinks.length; i++) {
      var link = sidebarLinks[i];
      var href = (link.getAttribute('href') || '').replace(/\/$/, '');
      if (href === currentPath || currentPath.endsWith(href)) {
        if (!link.classList.contains('menu__link--sublist')) {
          articleLink = link;
          break;
        }
      }
    }

    if (!articleLink) return;

    var articleLi = articleLink.closest('li.menu__list-item');
    if (!articleLi) return;

    // 已经有 TOC 则更新高亮
    if (articleLi.querySelector('.sidebar-toc')) {
      currentArticleTOC = articleLi.querySelector('.sidebar-toc');
      currentArrow = articleLink.querySelector('.sidebar-toc-arrow');
      setupScrollHighlight();
      return;
    }

    cleanup();

    var tocContainer = document.createElement('ul');
    tocContainer.className = 'sidebar-toc';

    toc.querySelectorAll('li').forEach(function(item) {
      var link = item.querySelector('a');
      if (!link) return;
      var level = getHeadingLevel(link);
      var tocItem = document.createElement('li');
      tocItem.className = 'sidebar-toc-item' + (level > 2 ? ' sidebar-toc-item--level-' + level : '');
      var tocLink = document.createElement('a');
      tocLink.href = link.href;
      tocLink.textContent = link.textContent;
      tocLink.className = 'sidebar-toc-link';

      tocLink.addEventListener('click', function(e) {
        e.preventDefault();
        var targetId = link.getAttribute('href').substring(1);
        var target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });

      tocItem.appendChild(tocLink);
      tocContainer.appendChild(tocItem);
    });

    articleLi.appendChild(tocContainer);

    // 箭头
    var arrow = document.createElement('span');
    arrow.className = 'sidebar-toc-arrow';
    arrow.innerHTML = ' ▼';
    articleLink.appendChild(arrow);
    tocContainer.style.display = 'block';
    arrow.style.transform = 'rotate(0deg)';

    arrow.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var visible = tocContainer.style.display !== 'none';
      tocContainer.style.display = visible ? 'none' : 'block';
      arrow.style.transform = visible ? 'rotate(-90deg)' : 'rotate(0deg)';
    });

    currentArticleTOC = tocContainer;
    currentArrow = arrow;

    if (isMenuCollapsed(articleLi)) hideTOC();
    else setupScrollHighlight();
  }

  // ============ 监听器 ============

  function setupObservers() {
    // 监听父级菜单折叠
    var menuObserver = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        if (m.type === 'attributes' && m.attributeName === 'style') {
          var t = m.target;
          if (t.classList && t.classList.contains('menu__list')) {
            window.getComputedStyle(t).display === 'none' ? hideTOC() : showTOC();
          }
        }
      });
    });
    document.querySelectorAll('.menu__list').forEach(function(list) {
      menuObserver.observe(list, { attributes: true, attributeFilter: ['style'] });
    });

    // 监听 Docusaurus 路由变化 — 检测文章内容何时渲染完成
    var bodyObserver = new MutationObserver(function(mutations) {
      var hasArticle = mutations.some(function(m) {
        return m.addedNodes.length > 0 || m.removedNodes.length > 0;
      });
      if (hasArticle) {
        // 检查文章内容是否就绪
        if (document.querySelector('article') && document.querySelector('.theme-doc-toc-desktop .table-of-contents')) {
          initSidebarTOC();
        }
      }
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true });

    // 监听点击导航
    document.addEventListener('click', function(e) {
      var link = e.target.closest('a');
      if (link && link.closest('.theme-doc-sidebar-menu') && !link.closest('.sidebar-toc')) {
        // 页面过渡可能改变内容，稍后初始化
        var checkInterval = setInterval(function() {
          if (document.querySelector('article') && document.querySelector('.theme-doc-toc-desktop .table-of-contents')) {
            initSidebarTOC();
            clearInterval(checkInterval);
          }
        }, 100);
        // 最多检查 5 秒
        setTimeout(function() { clearInterval(checkInterval); }, 5000);
      }
    });

    window.addEventListener('popstate', function() {
      setTimeout(initSidebarTOC, 200);
    });
  }

  // ============ 启动 ============

  function init() {
    setupObservers();

    // 首次初始化：等待 Docusaurus 渲染完成后尝试
    var tryInit = function() {
      if (document.querySelector('article') && document.querySelector('.theme-doc-toc-desktop .table-of-contents')) {
        initSidebarTOC();
      } else {
        setTimeout(tryInit, 200);
      }
    };
    tryInit();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
