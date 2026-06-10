---
title: 三种完整性规则
sidebar_position: 1
date: 2026-06-10
tags: [数据库, MySQL, DBMS]
description: 基于MySQL语言的数据库系统相关知识
series: 数据库
---

## 一、基本概念

### 1.**实体完整性**

保证表中的每一行数据是唯一的、可识别的。通常通过**主键（Primary Key）**约束来实现，要求主键字段不能为空（NOT NULL）且值唯一。

### 2.参照完整性

维护表与表之间关联数据的一致性。通过**外键（Foreign Key）**约束实现，要求外键的值要么为空，要么必须等于被引用表中的某个主键值，避免出现“孤儿数据”。

### 3.用户定义完整性

针对特定业务场景制定的约束规则，如字段取值范围、格式等。通过**检查约束（CHECK）**、唯一约束（UNIQUE）、默认值（DEFAULT）或触发器（Trigger）等机制实现。

## 二、具体实例

### 场景描述

有三张表：

-   **学生表** (Student)
    
-   **课程表** (Course)
    
-   **选课表** (SC)
    

### 1.实体完整性

**规则**：表中的每一行必须能被唯一标识，且主键不能为空。  
**实例**：在 Student 表中，设置 Sno（学号）为主键。

```sql
CREATE TABLE Student (
    Sno CHAR(10) PRIMARY KEY,    -- 主键，唯一且非空
    Sname VARCHAR(20),
    Sage INT
);
```

-   **违反例子**：插入两条 Sno='2024001' 的记录，或插入一条 Sno=NULL 的记录，数据库会拒绝。
    

### 2.参照完整性

**规则**：外键的值要么为空，要么必须在被参照表的主键中存在。  
**实例**：SC 表中的 Sno 和 Cno 分别参照 Student.Sno 和 Course.Cno 。

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

-   **违反例子**：向 SC 表插入一条 Sno='9999999' 的记录，但 Student 表中没有该学号 → 插入失败。
    

### 3.用户定义完整性

**规则**：针对特定业务需求的约束，如取值范围、格式等。  
**实例**：

-   在 Student 表中，限制 Sage 在 15~40 岁之间。
    
-   在 SC 表中，限制 Score 在 0~100 之间。
    

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

-   **违反例子**：插入一条 Sage=10 的学生记录，或给某门课成绩赋 Score=105，数据库会报错。
    

### 总结

-   **实体完整性** → 保证每条学生/课程记录是唯一、可识别的。
    
-   **参照完整性** → 保证选课信息不会指向不存在的学生或课程。
    
-   **用户定义完整性** → 保证年龄、成绩等符合业务常识。
