---
sidebar_position: 2
---

# React Hooks 入门指南

React Hooks 是 React 16.8 引入的新特性，允许在函数组件中使用状态和其他 React 特性。

## useState

`useState` 是最基本的 Hook，用于在函数组件中添加状态。

```jsx
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>你点击了 {count} 次</p>
      <button onClick={() => setCount(count + 1)}>
        点击我
      </button>
    </div>
  );
}
```

## useEffect

`useState` 用于处理副作用，如数据获取、订阅等。

```jsx
import React, { useState, useEffect } from 'react';

function Example() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // 组件挂载后执行
    fetch('/api/data')
      .then(response => response.json())
      .then(data => setData(data));

    // 清理函数（可选）
    return () => {
      // 组件卸载前执行
    };
  }, []); // 空数组表示只在挂载时执行

  return <div>{data ? JSON.stringify(data) : '加载中...'}</div>;
}
```

## 自定义 Hook

可以将组件逻辑提取到可重用的函数中。

```jsx
import { useState, useEffect } from 'react';

function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then(response => response.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, [url]);

  return { data, loading };
}

// 使用自定义 Hook
function UserProfile({ userId }) {
  const { data, loading } = useFetch(`/api/users/${userId}`);

  if (loading) return <div>加载中...</div>;
  return <div>{data.name}</div>;
}
```

## 最佳实践

1. **只在顶层调用 Hook** - 不要在循环、条件或嵌套函数中调用
2. **只在 React 函数中调用** - 不要在普通 JavaScript 函数中调用
3. **使用多个 Hook** - 将不相关的逻辑分离到不同的 Hook 中
4. **自定义 Hook 以 "use" 开头** - 这样 React 才能检查 Hook 规则
