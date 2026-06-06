---
slug: python-list-comprehension
title: Python 列表推导式技巧
authors: [default]
tags: [python, 后端, 语法]
---

列表推导式是 Python 中非常强大的特性，可以让代码更简洁、更 Pythonic。

{/* truncate */}

## 基本语法

```python
# 语法：[expression for item in iterable]
squares = [x**2 for x in range(10)]
print(squares)  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
```

## 带条件的推导式

```python
# 语法：[expression for item in iterable if condition]
even_squares = [x**2 for x in range(10) if x % 2 == 0]
print(even_squares)  # [0, 4, 16, 36, 64]

# 多个条件
special_numbers = [x for x in range(100) if x % 3 == 0 if x % 5 == 0]
print(special_numbers)  # [0, 15, 30, 45, 60, 75, 90]
```

## 嵌套推导式

```python
# 二维数组展平
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
flattened = [x for row in matrix for x in row]
print(flattened)  # [1, 2, 3, 4, 5, 6, 7, 8, 9]

# 生成坐标对
coordinates = [(x, y) for x in range(3) for y in range(3)]
print(coordinates)
# [(0, 0), (0, 1), (0, 2), (1, 0), (1, 1), (1, 2), (2, 0), (2, 1), (2, 2)]
```

## 字典推导式

```python
# 基本语法：{key_expression: value_expression for item in iterable}
square_dict = {x: x**2 for x in range(5)}
print(square_dict)  # {0: 0, 1: 1, 2: 4, 3: 9, 4: 16}

# 带条件的字典推导式
even_square_dict = {x: x**2 for x in range(10) if x % 2 == 0}
print(even_square_dict)  # {0: 0, 2: 4, 4: 16, 6: 36, 8: 64}

# 交换字典的键和值
original = {'a': 1, 'b': 2, 'c': 3}
swapped = {v: k for k, v in original.items()}
print(swapped)  # {1: 'a', 2: 'b', 3: 'c'}
```

## 集合推导式

```python
# 基本语法：{expression for item in iterable}
unique_lengths = {len(word) for word in ['hello', 'world', 'python', 'code']}
print(unique_lengths)  # {4, 5, 6}

# 去重
numbers = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4]
unique_numbers = {x for x in numbers}
print(unique_numbers)  # {1, 2, 3, 4}
```

## 生成器表达式

```python
# 语法：(expression for item in iterable)
# 注意：生成器表达式使用圆括号，不是方括号
sum_of_squares = sum(x**2 for x in range(10))
print(sum_of_squares)  # 285

# 生成器表达式是惰性求值的，节省内存
large_list = (x**2 for x in range(1000000))
print(next(large_list))  # 0
print(next(large_list))  # 1
```

## 实际应用示例

### 1. 数据清洗

```python
# 清理字符串列表
raw_data = ['  hello  ', '  world  ', '  python  ']
cleaned = [s.strip() for s in raw_data]
print(cleaned)  # ['hello', 'world', 'python']

# 过滤空值
data = [1, None, 2, None, 3, None, 4]
filtered = [x for x in data if x is not None]
print(filtered)  # [1, 2, 3, 4]
```

### 2. 数据转换

```python
# 字符串转数字
str_numbers = ['1', '2', '3', '4', '5']
numbers = [int(x) for x in str_numbers]
print(numbers)  # [1, 2, 3, 4, 5]

# 温度转换
celsius = [0, 10, 20, 30, 40]
fahrenheit = [(9/5) * c + 32 for c in celsius]
print(fahrenheit)  # [32.0, 50.0, 68.0, 86.0, 104.0]
```

### 3. 矩阵操作

```python
# 矩阵转置
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
transposed = [[row[i] for row in matrix] for i in range(3)]
print(transposed)
# [[1, 4, 7], [2, 5, 8], [3, 6, 9]]

# 矩阵加法
matrix1 = [[1, 2], [3, 4]]
matrix2 = [[5, 6], [7, 8]]
result = [[matrix1[i][j] + matrix2[i][j] for j in range(2)] for i in range(2)]
print(result)  # [[6, 8], [10, 12]]
```

## 性能考虑

列表推导式通常比等价的 for 循环快，因为：

1. Python 解释器对列表推导式有优化
2. 减少了函数调用的开销
3. 内存分配更高效

但是，对于非常复杂的逻辑，使用普通的 for 循环可能更清晰。

## 最佳实践

1. **保持简洁** - 如果推导式太复杂，使用普通循环
2. **避免副作用** - 推导式应该用于创建新列表，不是执行操作
3. **使用有意义的变量名** - 避免使用单字母变量
4. **注意内存** - 对于大数据集，考虑使用生成器表达式
