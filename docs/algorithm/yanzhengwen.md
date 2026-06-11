---
title: 验证回文串
sidebar_position: 202606112343
date: 2026-06-11
tags: [双指针, 左右指针]
description: 掌握左右指针向中间移动，最终相会的解法。
series: 双指针：左右指针碰撞
---

## 一、题目描述

**题目：** 如果在将所有大写字符转换为小写字符、并移除所有非字母数字字符之后，短语正着读和反着读都一样。则可以认为该短语是一个 **回文串** 。

**要求：** 给你一个字符串 s ，如果它是 **回文串** ，返回 true ；否则，返回 false 。

## 二、题解

### 思路：

1.  将字符串进行基本字符处理，去除非字母数字字符（或先不处理，在双指针对比时来判断）
    
2.  通过左右双指针来依次比较左右对应位置的字符是否相同
    

### 代码：

```java
class Solution {
    public boolean isPalindrome(String s) {
        int left = 0;//左指针
        int right = s.length() - 1;//右指针

        while(left < right){
            //如果为非字母数字 则直接跳过
            if(!Character.isLetterOrDigit(s.charAt(left))) left++;
            else if(!Character.isLetterOrDigit(s.charAt(right))) right--;
            else if(Character.toLowerCase(s.charAt(left)) == Character.toLowerCase(s.charAt(right))){
                left++;
                right--;
            }else {
                return false;
            }
        }
        return true;
    }
}
```
## 三、相关代码方法

> -   String.length()：返回字符串长度
>     
> -   String.charAt(int index)：返回指定索引的字符
>     
> -   Character.isLetterOrDigit(char ch)：判断字符是否为字母或数字
>     
> -   Character.toLowerCase(char ch)：将字符转换为小写
>     
> -   String.replaceAll(String regex, String replacement)：用正则表达式替换所有匹配的子串
>
