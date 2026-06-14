---
title: 盛最多水的容器
sidebar_position: 202606142326
date: 2026-06-14
tags: [双指针, 左右指针]
description: 掌握左右指针向中间移动，最终相会的解法。
series: 双指针：左右指针碰撞
---

## 一、题目描述

**题目：** 给定一个长度为 n 的整数数组 height 。有 n 条垂线，第 i 条线的两个端点是 (i, 0) 和 (i, height\[i\]) 。

**要求：** 找出其中的两条线，使得它们与 x 轴共同构成的容器可以容纳最多的水，并返回容器可以储存的最大水量。

**示例：**

![屏幕截图 2026-06-14 232107](/img/uploads/1781450478060-_____2026-06-14_232107.jpg)
## 二、题解

### 思路：

1.  左右指针指向数组两端，计算当前面积 = 短边高度 × 宽度，更新最大值。
    
2.  **每次移动较短的那一侧指针** （因为长边移动只会让面积变小）。
    
3.  重复直到两指针相遇，返回最大值。
    

### 代码：

```java
class Solution {
    public int maxArea(int[] height) {
        int left = 0;
        int right = height.length - 1;
        int maxArea = 0;

        while(left < right){
            int minHeight = Math.min(height[left],height[right]);//取较小高度
            int Area = minHeight * (right - left);//计算面积
            maxArea = Math.max(Area,maxArea);

            //移动较矮的一侧
            if(height[left] < height[right]){
                left++;
            }else{
                right--;
            }
        }

        return maxArea;
        
    }
}
```
## 三、相关代码方法

> Math.min(int a, int b)：返回两个整数中的较小值
> 
> Math.max(int a, int b)：返回两个整数中的较大值
