---
slug: javascript-debounce
title: JavaScript 防抖函数实现
authors: [default]
tags: [javascript, 前端, 性能优化]
---

防抖（Debounce）是前端开发中常用的性能优化技术，用于限制函数的执行频率。

## 什么是防抖

防抖是指在事件被触发 n 秒后再执行回调，如果在这 n 秒内又被触发，则重新计时。

## 应用场景

- 搜索框输入联想
- 窗口 resize
- 滚动事件
- 按钮防重复点击

{/* truncate */}

## 实现代码

```javascript
/**
 * 防抖函数
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} - 防抖后的函数
 */
function debounce(fn, delay) {
  let timer = null;
  
  return function (...args) {
    // 如果已有定时器，清除它
    if (timer) {
      clearTimeout(timer);
    }
    
    // 设置新的定时器
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay);
  };
}
```

## 使用示例

```javascript
// 搜索框输入联想
const searchInput = document.getElementById('search');
const searchHandler = debounce((value) => {
  console.log('搜索：', value);
  // 这里调用搜索 API
}, 300);

searchInput.addEventListener('input', (e) => {
  searchHandler(e.target.value);
});

// 窗口 resize
const resizeHandler = debounce(() => {
  console.log('窗口大小改变');
  // 这里处理窗口大小改变
}, 200);

window.addEventListener('resize', resizeHandler);
```

## 进阶版本

带立即执行参数的防抖函数：

```javascript
function debounce(fn, delay, immediate = false) {
  let timer = null;
  
  return function (...args) {
    const callNow = immediate && !timer;
    
    if (timer) {
      clearTimeout(timer);
    }
    
    timer = setTimeout(() => {
      timer = null;
      if (!immediate) {
        fn.apply(this, args);
      }
    }, delay);
    
    if (callNow) {
      fn.apply(this, args);
    }
  };
}

// 使用立即执行版本
const handler = debounce(() => {
  console.log('立即执行');
}, 1000, true);
```

## 与节流的区别

- **防抖**：在事件被触发 n 秒后再执行回调，如果在这 n 秒内又被触发，则重新计时
- **节流**：在 n 秒内只执行一次回调

选择使用哪个取决于具体场景：
- 搜索框输入联想 → 防抖
- 滚动加载 → 节流
- 按钮防重复点击 → 防抖
