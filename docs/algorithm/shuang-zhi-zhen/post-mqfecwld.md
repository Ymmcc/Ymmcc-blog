---
title: 接雨水
sidebar_position: 202606152357
date: 2026-06-15
tags: [双指针, 左右指针]
description: 掌握左右指针向中间移动，最终相会的解法。
series: 双指针：左右指针碰撞
---

## 一、题目描述

**题目：** 给定 n 个非负整数表示每个宽度为 1 的柱子的高度图，计算按此排列的柱子，下雨之后能接多少雨水。

**示例：**

![屏幕截图 2026-06-15 235213](/Ymmcc-blog/img/uploads/1781539056631-0.jpg)
## 二、题解

### 思路：

1.  **初始化** ：左指针 l 指向数组开头，右指针 r 指向末尾，waterLine 记录当前遇到的最大高度（即可能的水位线），sum 累计总雨水量。
    
2.  **循环条件** ：当 l < r 时执行：
    
    -   比较 height\[l\] 和 height\[r\]，**选择较矮的那一侧** ，将其高度赋值给 lower，并将对应指针向内移动一步（若左矮则 l++，右矮则 r--）。
        
    -   更新 waterLine 为 Math.max(waterLine, lower)，即维持从两侧扫描过程中出现的最高柱子高度。
        
    -   当前柱子能接的雨水量为 waterLine - lower（因为 lower 是当前柱子的高度，而 waterLine 是当前扫描区间内最高柱子的高度，差值即该柱子上方可蓄的水量）。将差值累加到 sum。
        
3.  **返回结果** ：循环结束返回 sum。
    

> **核心思想** ：利用“短板效应”，每次处理较矮的柱子，因为它决定了该位置的水位上限。通过不断更新水位线和移动指针，每个柱子只被计算一次，时间复杂度 O(n)，空间 O(1)。

### 代码：

```java
class Solution {
    public int trap(int[] height) {
    if(height == null ||height.length == 0) return 0;

    int l = 0,r = height.length - 1,waterLine = 0,sum = 0;
    while(l < r){
        int lower = height[height[l] <= height[r] ? l++ : r--];
        waterLine = Math.max(waterLine,lower);
        sum += waterLine - lower; 
    }
    return sum;
    }
}
```
