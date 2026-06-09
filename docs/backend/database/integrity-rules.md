---
title: 三种完整性规则
sidebar_position: 2
date: 2026-06-10
tags: [数据库, MySQL, DBMS]
description: 数据库的实体完整性、参照完整性和用户定义完整性
---

## 一、基本概念

场景描述：有三张表

- 学生表 (Student)
- 课程表 (Course)
- 选课表 (SC)

### 1.实体完整性

**规则**：表中的每一行必须能被唯一标识，且主键不能为空。

**实例**：
在 Student 表中，设置 Sno（学号）为主键。

```sql
CREATE TABLE Student (
    Sno CHAR(10) PRIMARY KEY,    -- 主键，唯一且非空
    Sname VARCHAR(20),
    Sage INT
);
```

**违反例子**：插入两条 `Sno='2024001'` 的记录，或插入一条 `Sno=NULL` 的记录，数据库会拒绝。

### 2.参照完整性

**规则**：外键的值要么为空，要么必须在被参照表的主键中存在。

**实例**：
SC 表中的 Sno 和 Cno 分别参照 Student.Sno 和 Course.Cno。

```sql
CREATE TABLE SC (
    Sno CHAR(10),
    Cno CHAR(6),
    Score INT,
    PRIMARY KEY (Sno, Cno),
    FOREIGN KEY (Sno) REFERENCES Student(Sno),   -- 参照完整性
    FOREIGN KEY (Cno) REFERENCES Course(Cno)
);
```

**违反例子**：向 SC 表插入一条 `Sno='9999999'` 的记录，但 Student 表中没有该学号 → 插入失败。

### 3.用户定义完整性

**规则**：针对特定业务需求的约束，如取值范围、格式等。

**实例**：

- 在 Student 表中，限制 Sage 在 15~40 岁之间。
- 在 SC 表中，限制 Score 在 0~100 之间。

```sql
CREATE TABLE Student (
    Sno CHAR(10) PRIMARY KEY,
    Sname VARCHAR(20),
    Sage INT CHECK (Sage BETWEEN 15 AND 40)   -- 用户定义完整性
);

CREATE TABLE SC (
    Sno CHAR(10),
    Cno CHAR(6),
    Score INT CHECK (Score >= 0 AND Score <= 100),  -- 成绩范围
    PRIMARY KEY (Sno, Cno),
    FOREIGN KEY (Sno) REFERENCES Student(Sno),
    FOREIGN KEY (Cno) REFERENCES Course(Cno)
);
```

**违反例子**：插入一条 `Sage=10` 的学生记录，或给某门课成绩赋 `Score=105`，数据库会报错。

## 二、具体实例

-   **实体完整性**：向学生表插入一条新记录时，学号不能为空，也不能与已存在的学号重复。
-   **参照完整性**：在选课表中插入选课记录时，学号必须在学生表中存在，课程号必须在课程表中存在。
-   **用户定义完整性**：学生表的年龄字段，插入时检查是否在合理范围内（15~40 岁）。
