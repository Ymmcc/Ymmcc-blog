(function() {
  'use strict';

  var currentArticleTOC = null;
  var currentArrow = null;

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

  function cleanupOldTOC() {
    var oldContainers = document.querySelectorAll('.sidebar-toc');
    oldContainers.forEach(function(el) {
      if (el.parentElement) el.parentElement.removeChild(el);
    });
    var oldArrows = document.querySelectorAll('.sidebar-toc-arrow');
    oldArrows.forEach(function(el) {
      if (el.parentElement) el.parentElement.removeChild(el);
    });
    currentArticleTOC = null;
    currentArrow = null;
  }

  function isParentMenuCollapsed(articleLi) {
    var parent = articleLi.parentElement;
    while (parent) {
      if (parent.classList && parent.classList.contains('menu__list')) {
        var style = window.getComputedStyle(parent);
        if (style.display === 'none' || style.visibility === 'hidden') return true;
        if (parent.hasAttribute('hidden')) return true;
      }
      parent = parent.parentElement;
    }
    return false;
  }

  function hideTOC() {
    if (currentArticleTOC) {
      currentArticleTOC.style.display = 'none';
    }
    if (currentArrow) {
      currentArrow.style.transform = 'rotate(-90deg)';
    }
  }

  function showTOC() {
    if (currentArticleTOC) {
      currentArticleTOC.style.display = 'block';
    }
    if (currentArrow) {
      currentArrow.style.transform = 'rotate(0deg)';
    }
  }

  function initSidebarTOC() {
    // 获取右侧目录
    var toc = document.querySelector('.theme-doc-toc-desktop .table-of-contents');
    if (!toc) return;

    // 获取当前页面路径
    var currentPath = window.location.pathname;

    // 通过 href 精确匹配当前文章链接
    var sidebarLinks = document.querySelectorAll('.theme-doc-sidebar-menu a');
    var articleLink = null;
    for (var i = 0; i < sidebarLinks.length; i++) {
      var link = sidebarLinks[i];
      var href = link.getAttribute('href') || '';
      // 精确匹配路径
      if (href === currentPath || href === currentPath.replace(/\/$/, '') || currentPath.endsWith(href)) {
        // 排除父级菜单链接（有 sublist 类的）
        if (!link.classList.contains('menu__link--sublist')) {
          articleLink = link;
          break;
        }
      }
    }

    if (!articleLink) return;

    // 获取 li 元素
    var articleLi = articleLink.closest('li.menu__list-item');
    if (!articleLi) return;

    // 如果已经有 TOC，清理旧的重新创建
    if (articleLi.querySelector('.sidebar-toc')) {
      currentArticleTOC = articleLi.querySelector('.sidebar-toc');
      currentArrow = articleLink.querySelector('.sidebar-toc-arrow');
      return;
    }

    cleanupOldTOC();

    var tocContainer = document.createElement('ul');
    tocContainer.className = 'sidebar-toc';

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

    articleLi.appendChild(tocContainer);

    var arrow = setupToggle(articleLink, tocContainer);
    currentArticleTOC = tocContainer;
    currentArrow = arrow;

    if (isParentMenuCollapsed(articleLi)) {
      hideTOC();
    }
  }

  function setupToggle(titleElement, tocContainer) {
    var arrow = document.createElement('span');
    arrow.className = 'sidebar-toc-arrow';
    arrow.innerHTML = ' ▼';
    titleElement.appendChild(arrow);

    tocContainer.style.display = 'block';
    arrow.style.transform = 'rotate(0deg)';

    arrow.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var isVisible = tocContainer.style.display !== 'none';
      tocContainer.style.display = isVisible ? 'none' : 'block';
      arrow.style.transform = isVisible ? 'rotate(-90deg)' : 'rotate(0deg)';
    });

    return arrow;
  }

  // 监听侧边栏折叠状态
  function setupMenuObserver() {
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          var target = mutation.target;
          if (target.classList && target.classList.contains('menu__list')) {
            var style = window.getComputedStyle(target);
            if (style.display === 'none') {
              hideTOC();
            } else if (style.display !== 'none' && currentArticleTOC) {
              // 检查是否是因为展开父级菜单而显示
              showTOC();
            }
          }
        }
      });
    });

    var menuLists = document.querySelectorAll('.menu__list');
    menuLists.forEach(function(list) {
      observer.observe(list, { attributes: true, attributeFilter: ['style'] });
    });
    return observer;
  }

  function setupListeners() {
    window.addEventListener('popstate', function() {
      setTimeout(initSidebarTOC, 300);
    });

    document.addEventListener('click', function(e) {
      var link = e.target.closest('a');
      if (!link) return;
      var isSidebarLink = link.closest('.theme-doc-sidebar-menu');
      var isTOCLink = link.closest('.sidebar-toc');
      if (isSidebarLink && !isTOCLink) {
        setTimeout(initSidebarTOC, 500);
      }
    });
  }

  function init() {
    setupListeners();
    setupMenuObserver();
    initSidebarTOC();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 多重延迟确保 Docusaurus 渲染完毕
  setTimeout(initSidebarTOC, 500);
  setTimeout(initSidebarTOC, 1000);
  setTimeout(initSidebarTOC, 2000);
  setTimeout(initSidebarTOC, 3000);
})();
