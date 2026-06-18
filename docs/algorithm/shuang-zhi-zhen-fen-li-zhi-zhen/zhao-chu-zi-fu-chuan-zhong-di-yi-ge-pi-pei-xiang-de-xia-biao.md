---
title: 找出字符串中第一个匹配项的下标
sidebar_position: 202606182026
date: 2026-06-18
tags: [分离指针, 双指针, 序列]
description: 两个指针分别遍历不同序列的方法，通常用于在两个序列之间做匹配、合并、插入、交换。
series: 双指针：分离指针
---

## 一、题目描述

**题目：** 给你两个字符串 haystack 和 needle ，请你在 haystack 字符串中找出 needle 字符串的第一个匹配项的下标（下标从 0 开始）。如果 needle 不是 haystack 的一部分，则返回  -1 。

![屏幕截图 2026-06-18 201909](/img/uploads/1781785602920-0.jpg)
## 二、题解

### 思路：

1.  先将两个字符串分别转化为数组
    
2.  都从下标为 0 开始，通过 while 循环遍历。如果相等，则指针都向右移动 1 ，如果不相等，将长串指针回溯且将短串指针下标重置为 0 。
    
3.  若到最后短串指针遍历完成，则返回长串指针的初始匹配索引值，否则返回 -1 。
    

### 代码：

```java
class Solution {
    public int strStr(String haystack, String needle) {
        char[] chaystack = haystack.toCharArray();
        char[] cneedle = needle.toCharArray();
        int i = 0,j = 0;
        while(i < chaystack.length && j < cneedle.length){
          if(chaystack[i] == cneedle[j]){
            i++;
            j++;
          }else{
            i = i - j + 1;
            j = 0;
          }
        }

        if(j == cneedle.length){
            return i - j;
        }
        return -1;
    }
}
```
## 三、相关代码方法

> str.toCharArray()：将字符串转化为数组
