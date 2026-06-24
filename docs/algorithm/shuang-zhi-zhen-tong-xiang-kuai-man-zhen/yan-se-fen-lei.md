---
title: 颜色分类
sidebar_position: 202606242022
date: 2026-06-24
tags: [双指针, 快慢指针, 原地修改]
description: 两个指针同向遍历同一序列的算法，快针通常用于寻找目标，慢针通常用于记录写入位置，快慢针元素交换即将找到的目标按次序写入。这个算法通常用于对序列做原地修改。
series: 双指针：同向快慢针
---

## 一、题目描述

**题目：** 给定一个包含红色、白色和蓝色、共 n 个元素的数组 nums ，原地 对它们进行排序，使得相同颜色的元素相邻，并按照红色、白色、蓝色顺序排列。

**注意：**

-   我们使用整数 0、 1 和 2 分别表示红色、白色和蓝色。
    
-   必须在不使用库内置的 sort 函数的情况下解决这个问题。
    

**示例 1：**

输入：nums = \[2,0,2,1,1,0\]  
输出：\[0,0,1,1,2,2\]

**示例 2：**

输入：nums = \[2,0,1\]  
输出：\[0,1,2\]

## 二、题解

### 思路：

1.  设置快慢指针，快指针遍历数组，慢指针记录交换位置。
    
2.  若快指针所指值为0，则与慢指针所指值交换位置，并将慢指针向右移动一个单位。
    
3.  遍历完成后，将快指针指向与慢指针相同，后判断快指针所指值是否为1，若为1则与慢指针所指值交换位置，并将满指针向右移动一个单位。
    
4.  遍历完后，值为2的元素自然就排到最后了。
    

### 代码：

```java
class Solution {
    public void sortColors(int[] nums) {
        int slow = 0;
        int fast = 0;
        while(fast < nums.length){
            if(nums[fast] == 0){
                int temp = nums[fast];
                nums[fast] = nums[slow];
                nums[slow] = temp;
                slow++;
            }
            fast++;
        }
        fast = slow;
         while(fast < nums.length){
            if(nums[fast] == 1){
                int temp = nums[fast];
                nums[fast] = nums[slow];
                nums[slow] = temp;
                slow++;
            }
            fast++;
        }
    }
}
```
