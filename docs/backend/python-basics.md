---
sidebar_position: 2
---

# Python 基础语法

Python 是一种简洁、易读的编程语言，适合初学者学习。

## 变量和数据类型

```python
# 数字
age = 25
price = 19.99

# 字符串
name = "张三"
message = f"你好，{name}！"

# 列表
fruits = ["苹果", "香蕉", "橙子"]
fruits.append("葡萄")

# 字典
person = {
    "name": "张三",
    "age": 25,
    "city": "北京"
}

# 布尔值
is_student = True
```

## 控制流

```python
# if 语句
score = 85
if score >= 90:
    print("优秀")
elif score >= 80:
    print("良好")
elif score >= 60:
    print("及格")
else:
    print("不及格")

# for 循环
for fruit in fruits:
    print(fruit)

# while 循环
count = 0
while count < 5:
    print(count)
    count += 1
```

## 函数

```python
def greet(name, greeting="你好"):
    """问候函数"""
    return f"{greeting}，{name}！"

# 调用函数
message = greet("张三")
print(message)  # 你好，张三！

# 带默认参数
message = greet("李四", "早上好")
print(message)  # 早上好，李四！
```

## 列表推导式

```python
# 生成平方数列表
squares = [x**2 for x in range(10)]
print(squares)  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

# 带条件的列表推导式
even_squares = [x**2 for x in range(10) if x % 2 == 0]
print(even_squares)  # [0, 4, 16, 36, 64]

# 字典推导式
square_dict = {x: x**2 for x in range(5)}
print(square_dict)  # {0: 0, 1: 1, 2: 4, 3: 9, 4: 16}
```

## 文件操作

```python
# 写入文件
with open("output.txt", "w", encoding="utf-8") as f:
    f.write("Hello, World!\n")
    f.write("这是第二行\n")

# 读取文件
with open("output.txt", "r", encoding="utf-8") as f:
    content = f.read()
    print(content)

# 逐行读取
with open("output.txt", "r", encoding="utf-8") as f:
    for line in f:
        print(line.strip())
```

## 异常处理

```python
try:
    result = 10 / 0
except ZeroDivisionError:
    print("不能除以零！")
except Exception as e:
    print(f"发生错误：{e}")
else:
    print("没有发生错误")
finally:
    print("无论如何都会执行")
```

## 模块和包

```python
# 导入模块
import math
print(math.sqrt(16))  # 4.0

# 从模块导入特定函数
from math import sqrt, pi
print(sqrt(16))  # 4.0
print(pi)  # 3.141592653589793

# 导入别名
import numpy as np
```
