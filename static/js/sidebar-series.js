(function () {
  'use strict';

  // 从当前页 URL 中提取基础路径（适配开发和生产环境）
  function getBasePath() {
    var scripts = document.querySelectorAll('script[src*="sidebar"]');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].getAttribute('src') || '';
      var idx = src.indexOf('/js/');
      if (idx !== -1) return src.substring(0, idx);
    }
    // fallback: 从 page URL 推断
    var path = window.location.pathname;
    var blogIdx = path.indexOf('/docs/');
    if (blogIdx !== -1) return path.substring(0, blogIdx);
    return '';
  }

  var basePath = getBasePath();
  var seriesDataUrl = basePath + '/data/series-data.json';

  var seriesData = null;
  var mutationTimer = null;

  // ============ 加载系列数据 ============

  function loadSeriesData() {
    if (seriesData) return Promise.resolve(seriesData);
    return fetch(seriesDataUrl)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        seriesData = data.series || [];
        return seriesData;
      })
      .catch(function () {
        seriesData = []; // 加载失败则静默忽略
        return [];
      });
  }

  // ============ 构建 URL 映射 ============

  // 构建 path -> seriesName 的映射
  function buildPathToSeriesMap(series) {
    var map = {};
    series.forEach(function (s) {
      s.articles.forEach(function (a) {
        map[a.path] = { seriesName: s.name, seriesDir: s.dirName, article: a };
      });
    });
    return map;
  }

  // ============ 侧边栏重组 ============

  function reorganizeSidebar() {
    if (!seriesData || seriesData.length === 0) return;

    var sidebar = document.querySelector('.theme-doc-sidebar-menu');
    if (!sidebar) return;

    var pathMap = buildPathToSeriesMap(seriesData);

    // 按系列名称分组，每组找到对应的 sidebar <a> 链接
    var seriesItems = {};
    var sidebarLinks = sidebar.querySelectorAll('a.menu__link:not(.menu__link--sublist)');

    sidebarLinks.forEach(function (link) {
      var href = link.getAttribute('href') || '';
      // Docusaurus 侧边栏链接在生产环境已包含 basePath
      // 去掉 basePath 以匹配 series-data.json 中的相对路径
      var relativePath = href;
      if (basePath && href.indexOf(basePath) === 0) {
        relativePath = href.substring(basePath.length);
      }
      relativePath = relativePath.replace(/\/$/g, '');

      var match = pathMap[relativePath];
      if (!match) return;

      var seriesName = match.seriesName;
      if (!seriesItems[seriesName]) {
        seriesItems[seriesName] = {
          name: seriesName,
          dirName: match.seriesDir,
          items: [],
        };
      }
      seriesItems[seriesName].items.push({
        link: link,
        li: link.closest('li.menu__list-item'),
        article: match.article,
      });
    });

    // 对每个系列，将文章归组到新创建的 category 下
    Object.keys(seriesItems).forEach(function (seriesName) {
      var group = seriesItems[seriesName];
      if (group.items.length === 0) return;

      // 按 sidebar_position 排序
      group.items.sort(function (a, b) {
        return (a.article.sidebar_position || 999) - (b.article.sidebar_position || 999);
      });

      // 使用第一篇文章的父级列表作为插入位置参考
      var firstLi = group.items[0].li;
      var parentList = firstLi.parentElement;
      if (!parentList) return;

      // 检查是否已经创建过该系列的 category（避免重复）
      var existingCategory = parentList.querySelector(
        '.menu__list-item--series[data-series="' + seriesName.replace(/"/g, '&quot;') + '"]'
      );
      if (existingCategory) return;

      // 检查该系列文章是否已经被移走过
      var alreadyMoved = false;
      group.items.forEach(function (item) {
        if (item.li.getAttribute('data-series-moved')) alreadyMoved = true;
      });
      if (alreadyMoved) return;

      // 创建系列 category
      var seriesCategoryLi = document.createElement('li');
      seriesCategoryLi.className = 'menu__list-item menu__list-item--category menu__list-item--series';
      seriesCategoryLi.setAttribute('data-series', seriesName);

      var seriesLink = document.createElement('a');
      seriesLink.className = 'menu__link menu__link--sublist';
      seriesLink.setAttribute('href', '#!');
      seriesLink.setAttribute('aria-expanded', 'true');
      seriesLink.innerHTML = '🔖 ' + seriesName;

      var seriesChildList = document.createElement('ul');
      seriesChildList.className = 'menu__list';
      seriesChildList.style.display = 'block';

      // 将原文章 li 移动到系列下
      group.items.forEach(function (item) {
        // 标记已移动
        item.li.setAttribute('data-series-moved', 'true');
        // 克隆节点（保持事件监听器）
        var clone = item.li.cloneNode(true);
        // 清除克隆上的 data-series-moved 标记（新位置需要保留原始类但不标记为已移动）
        clone.removeAttribute('data-series-moved');
        clone.setAttribute('data-series-child', seriesName);

        // 移除原文
        item.li.style.display = 'none';

        seriesChildList.appendChild(clone);
      });

      seriesCategoryLi.appendChild(seriesLink);
      seriesCategoryLi.appendChild(seriesChildList);
      parentList.insertBefore(seriesCategoryLi, firstLi);
    });
  }

  // ============ 重置（SPA 导航时需要） ============

  function resetSidebar() {
    // 恢复被隐藏的原始文章
    document.querySelectorAll('li[data-series-moved]').forEach(function (li) {
      li.style.display = '';
    });
    // 移除动态生成的系列 category
    document.querySelectorAll('.menu__list-item--series').forEach(function (el) {
      el.parentElement.removeChild(el);
    });
    // 清除标记
    document.querySelectorAll('[data-series-moved]').forEach(function (el) {
      el.removeAttribute('data-series-moved');
    });
    document.querySelectorAll('[data-series-child]').forEach(function (el) {
      el.removeAttribute('data-series-child');
    });
  }

  // ============ 初始化流程 ============

  function init() {
    loadSeriesData().then(function () {
      // 首次重组
      var retry = function () {
        if (document.querySelector('.theme-doc-sidebar-menu')) {
          resetSidebar();
          reorganizeSidebar();
        } else {
          setTimeout(retry, 300);
        }
      };
      retry();
    });
  }

  // ============ 监听 SPA 路由变化 ============

  function setupSPAObserver() {
    var bodyObserver = new MutationObserver(function () {
      if (mutationTimer) clearTimeout(mutationTimer);
      mutationTimer = setTimeout(function () {
        if (!document.querySelector('.theme-doc-sidebar-menu')) return;
        // 检查系列 category 是否已被 Docusaurus 还原
        var seriesSection = document.querySelector('.menu__list-item--series');
        var movedItems = document.querySelectorAll('[data-series-moved]');
        if (!seriesSection && movedItems.length === 0) {
          // 需要重新初始化
          init();
        }
      }, 200);
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true });
  }

  // ============ 启动 ============

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init();
      setupSPAObserver();
    });
  } else {
    init();
    setupSPAObserver();
  }
})();
