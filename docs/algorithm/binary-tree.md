---
sidebar_position: 2
---

# 二叉树遍历算法

二叉树是计算机科学中最重要的数据结构之一，遍历是其基本操作。

## 二叉树定义

```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
```

## 前序遍历（Pre-order）

根节点 → 左子树 → 右子树

```python
def preorder(root):
    if not root:
        return []
    return [root.val] + preorder(root.left) + preorder(root.right)

# 迭代实现
def preorder_iterative(root):
    if not root:
        return []
    result = []
    stack = [root]
    while stack:
        node = stack.pop()
        result.append(node.val)
        if node.right:
            stack.append(node.right)
        if node.left:
            stack.append(node.left)
    return result
```

## 中序遍历（In-order）

左子树 → 根节点 → 右子树

```python
def inorder(root):
    if not root:
        return []
    return inorder(root.left) + [root.val] + inorder(root.right)

# 迭代实现
def inorder_iterative(root):
    result = []
    stack = []
    current = root
    while current or stack:
        while current:
            stack.append(current)
            current = current.left
        current = stack.pop()
        result.append(current.val)
        current = current.right
    return result
```

## 后序遍历（Post-order）

左子树 → 右子树 → 根节点

```python
def postorder(root):
    if not root:
        return []
    return postorder(root.left) + postorder(root.right) + [root.val]

# 迭代实现
def postorder_iterative(root):
    if not root:
        return []
    result = []
    stack = [root]
    while stack:
        node = stack.pop()
        result.append(node.val)
        if node.left:
            stack.append(node.left)
        if node.right:
            stack.append(node.right)
    return result[::-1]
```

## 层序遍历（Level-order）

逐层从左到右遍历

```python
from collections import deque

def levelorder(root):
    if not root:
        return []
    result = []
    queue = deque([root])
    while queue:
        level = []
        for _ in range(len(queue)):
            node = queue.popleft()
            level.append(node.val)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        result.append(level)
    return result
```

## 复杂度分析

| 遍历方式 | 时间复杂度 | 空间复杂度 |
|---------|-----------|-----------|
| 前序遍历 | O(n) | O(h) |
| 中序遍历 | O(n) | O(h) |
| 后序遍历 | O(n) | O(h) |
| 层序遍历 | O(n) | O(w) |

其中：
- n 是节点数量
- h 是树的高度
- w 是树的最大宽度

## 应用场景

1. **前序遍历**：用于复制二叉树、序列化
2. **中序遍历**：BST 的有序输出
3. **后序遍历**：用于计算目录大小、释放资源
4. **层序遍历**：用于逐层处理、找最短路径
