---
title: 交替合并字符串
sidebar_position: 202606190014
date: 2026-06-19
tags: [分离指针, 双指针, 序列]
description: 两个指针分别遍历不同序列的方法，通常用于在两个序列之间做匹配、合并、插入、交换。
series: 双指针：分离指针
---

## 一、题目描述

**题目：** 给你两个字符串 word1 和 word2 。请你从 word1 开始，通过交替添加字母来合并字符串。如果一个字符串比另一个字符串长，就将多出来的字母追加到合并后字符串的末尾。

**要求：** 返回 **合并后的字符串** 。

![屏幕截图 2026-06-20 000433](/img/uploads/1781885650492-0.jpg)
## 二、题解

### 思路：

1.  先建立一个新的数组，长度为两个字符串长度的总和
    
2.  依次插入字符到新数组，若有一方添加完，则将另一方直接追加到新数组上
    

### 代码：

```java
class Solution {
    public String mergeAlternately(String word1, String word2) {
        char[] cw1 = word1.toCharArray();
        char[] cw2 = word2.toCharArray();
        int l1 = 0,l2 = 0,t1 = 0;
        int tl = cw1.length + cw2.length;
        char[] tw= new char[tl];
        while(l1 < cw1.length && l2 < cw2.length){
            tw[t1++] = cw1[l1++];
            tw[t1++] = cw2[l2++];
        }
        while(l1 < cw1.length){
            tw[t1++] = cw1[l1++];
        }
        while(l2 < cw2.length){
            tw[t1++] = cw2[l2++];
        }

        return new String(tw);
        
    }
}
```
## 三、相关代码方法

**1\. length() 和 length 的区别**

特性

length (属性)

length() (方法)

适用对象

数组（int\[\]， String\[\]， char\[\] 等）

字符串（String 类的对象）

本质

成员变量（字段）

成员方法（函数）

调用方式

直接访问，不加括号

必须加 括号，因为要执行方法

代码示例

int\[\] arr = new int\[5\];int len = arr.length; // 结果是 5

String str = "Hello";int len = str.length(); // 结果是 5

**2\. 数组转字符串为什么不能用 toString()？**** 根本原因：** Java 中，数组（Array）的父类是 Object。数组类** 并没有重写（Override）** Object 类的 toString() 方法。

-   Object 类默认的 toString() 返回的是：**类名 + @ + 哈希码的无符号十六进制表示** 。
