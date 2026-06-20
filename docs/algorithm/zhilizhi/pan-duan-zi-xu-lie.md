---
title: 判断子序列
sidebar_position: 202606200031
date: 2026-06-20
tags: [分离指针, 双指针, 序列]
description: 两个指针分别遍历不同序列的方法，通常用于在两个序列之间做匹配、合并、插入、交换。
series: 双指针：分离指针
---

## 一、题目描述

**题目·：** 给定字符串 **s** 和**t** ，判断**s** 是否为**t** 的子序列。**注意：** 字符串的一个子序列是原始字符串删除一些（也可以不删除）字符而不改变剩余字符相对位置形成的新字符串。（例如，"ace"是"abcde"的一个子序列，而"aec"不是）。

![屏幕截图 2026-06-21 002540](/img/uploads/1781973094862-0.jpg)
## 二、题解

### 思路：

1.  将字符串分别转为数组
    
2.  从最左边起始位置分别循环比较两数组的相应位置元素值是否相等。若相等，则两个数组指针都向右移，若不相等，则长串指针右移，短串指针不变，直到遍历完。
    
3.  若循环遍历完后短串指针遍历完，则为子序列，返回true，否则返回false。
    

### 代码：

```java
class Solution {
    public boolean isSubsequence(String s, String t) {
        char[] cs = s.toCharArray();
        char[] ct = t.toCharArray();
        int left1 = 0,left2 = 0;
        while(left1 < cs.length && left2 < ct.length){
            if(cs[left1] == ct[left2]){
                left1++;
                left2++;
            }else{
                left2++;
            }
        }
        if(left1 == cs.length){
            return true;
        }else{
            return false;
        }
    }
}
```
