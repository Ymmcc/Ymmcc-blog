---
title: 三数之和
sidebar_position: 202606132328
date: 2026-06-13
tags: [双指针, 左右指针]
description: 掌握左右指针向中间移动，最终相会的解法。
series: 双指针：左右指针碰撞
---

## 一、题目描述

给你一个整数数组 nums ，判断是否存在三元组 \[nums\[i\], nums\[j\], nums\[k\]\] 满足 i != j、i != k 且 j != k ，同时还满足 nums\[i\] + nums\[j\] + nums\[k\] == 0 。请你返回所有和为 0 且不重复的三元组。

**注意：** 答案中不可以包含重复的三元组。

**示例 ：**

> 输入：nums = \[-1,0,1,2,-1,-4\]
> 
> 输出：\[\[-1,-1,2\],\[-1,0,1\]\]
> 
> 解释：
> 
> nums\[0\] + nums\[1\] + nums\[2\] = (-1) + 0 + 1 = 0 。
> 
> nums\[1\] + nums\[2\] + nums\[4\] = 0 + 1 + (-1) = 0 。
> 
> nums\[0\] + nums\[3\] + nums\[4\] = (-1) + 2 + (-1) = 0 。
> 
> 不同的三元组是 \[-1,0,1\] 和 \[-1,-1,2\] 。
> 
> 注意，输出的顺序和三元组的顺序并不重要。

* * *

## 二、题解

### 思路：

1.  **排序** ：升序排列，为双指针和去重做准备。
    
2.  **固定第一个数nums\[i\]：** 若 nums\[i\] > 0 → 直接结束（后面都为正，和不可能为0）；若 i > 0 且 nums\[i\] == nums\[i-1\] → 跳过（避免重复三元组）。
    
3.  **双指针查找** ：left = i+1，right = n-1。计算 sum = nums\[i\] + nums\[left\] + nums\[right\]；sum == 0：记录结果，然后跳过重复的 left 和 right，再 left++、right--；sum < 0：left++；sum > 0：right--。
    
4.  **返回结果集**
    

### 代码：

```java
class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        //排序
        Arrays.sort(nums);
        int n = nums.length;

        //先固定第一个数
        for(int i = 0;i < n - 2;i++){
            //如果第一个数为整数那不会和为0
            if(nums[i] > 0) break;
            //跳过第一个重复的数
            if(i > 0 && nums[i] == nums[i - 1]) continue;

            int left = i + 1;
            int right = n - 1;

            //双指针查找
            while(left < right){
                int sum = nums[i] + nums[left] + nums[right];
                if(sum == 0){
                    result.add(Arrays.asList(nums[i],nums[left],nums[right]));
                    
                    //跳过重复的left和right索引
                    while(left < right && nums[left] == nums[left + 1]) left++;
                    while(left < right && nums[right] == nums[right - 1]) right--;
                    left++;
                    right--;
                }else if(sum < 0){
                    left ++;
                }else{
                    right--;
                }
            }
        }
        return result;
    }
}
```

* * *

## 三、相关代码方法

> -   Arrays.sort(nums)：对数组进行升序排序。
>     
> -   Arrays.asList(a, b, c)：将三个元素转换为固定长度的 List。
>     
> -   result.add(...)：向结果集合中添加一个三元组列表。
>     
> -   continue：跳过当前循环的剩余部分，进入下一次迭代。
>     
> -   break：终止整个循环。
>     
> -   left++ / right--：移动双指针以调整三数之和的大小。
>
