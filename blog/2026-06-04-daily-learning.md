---
slug: daily-learning-2026-06-04
title: 学习日志 - 2026年6月4日
authors: [default]
tags: [每日一题, 学习日志, 算法]
---

## 今日学习内容

{/* truncate */}

### 算法学习

**题目：两数之和**

给定一个整数数组 `nums` 和一个整数目标值 `target`，请你在该数组中找出和为目标值的两个整数，并返回它们的数组下标。

**解题思路：**

1. 暴力解法：双重循环，时间复杂度 O(n²)
2. 哈希表：一次遍历，时间复杂度 O(n)

**代码实现：**

```python
def two_sum(nums, target):
    # 哈希表存储已遍历的数字和下标
    hash_map = {}
    
    for i, num in enumerate(nums):
        complement = target - num
        
        # 如果补数在哈希表中，返回结果
        if complement in hash_map:
            return [hash_map[complement], i]
        
        # 将当前数字和下标存入哈希表
        hash_map[num] = i
    
    return []

# 测试
nums = [2, 7, 11, 15]
target = 9
print(two_sum(nums, target))  # [0, 1]
```

**复杂度分析：**
- 时间复杂度：O(n)
- 空间复杂度：O(n)

### 前端学习

**React Hooks 复习**

今天复习了 `useState` 和 `useEffect` 的用法，重点理解了：

1. `useState` 的状态更新是异步的
2. `useEffect` 的依赖数组控制执行时机
3. 清理函数在组件卸载前执行

**代码示例：**

```jsx
import React, { useState, useEffect } from 'react';

function Timer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    // 清理函数
    return () => clearInterval(interval);
  }, []);

  return <div>已运行 {seconds} 秒</div>;
}
```

### 阅读笔记

**《JavaScript 高级程序设计》第 4 章**

- 变量、作用域和内存
- 基本类型和引用类型的区别
- 执行上下文和作用域链
- 闭包的原理和应用

## 今日总结

1. 完成了 LeetCode 第 1 题，掌握了哈希表解法
2. 复习了 React Hooks 的核心概念
3. 阅读了 JavaScript 高级程序设计的相关章节

## 明日计划

1. 继续刷 LeetCode 算法题
2. 学习 React 自定义 Hooks
3. 阅读 JavaScript 闭包相关内容
