---
title: 关系代数
sidebar_position: 20260611
date: 2026-06-11
tags: [数据库, MySQL, DBMS]
description: 基于MySQL语言的数据库系统相关知识
series: 数据库
---

## 一、选择 Selection（σ）—— “横向切行”

**定义**：给定关系 R与谓词 P，σP​(R)返回 R中所有满足 P的元组。

**形式**：σP​(R)

**谓词构成**：原子比较（属性 vs 常量 或 属性 vs 属性）通过逻辑连接词 ∧（合取）、∨（析取）、¬（否定）组合而成。

**对应 SQL**：SELECT \* FROM R WHERE P;

**示例**：

σAge>18​(Student)等价于 SQL：

```sql
SELECT * FROM Student WHERE Age > 18;
```
## 二、投影 Projection（π）—— “纵向取列（并去重）”

**定义**：给定关系 R与属性列表 A1​,A2​,…,Ak​，πA1​,…,Ak​​(R)返回仅包含这些属性的元组，并去除重复元组。

**形式**：πL​(R)，其中 L为属性列表。

**对应 SQL**：SELECT DISTINCT L FROM R;（严格语义下需使用 DISTINCT）。

**示例**：

πName, Age​(Student)等价于 SQL：

```sql
SELECT DISTINCT Name, Age FROM Student;
```
## 三、连接 Join（⋈）—— “先配对，再挑对：把两张表拼成宽行”

### 1\. θ-连接（Theta Join）

**定义**：R⋈θ​S≡σθ​(R×S)，其中 θ是比较谓词。

**形式**：R⋈θ​S

**特例**：当 θ中所有比较均为等号时，称为等值连接。

**对应 SQL**：SELECT \* FROM R JOIN S ON θ;

### 2.自然连接（Natural Join）

**定义**：R⋈S自动在 R与 S的同名属性上执行等值连接，并在结果中仅保留同名属性的一份副本。

**形式**：R⋈S

**性质**：无需显式指定连接条件，依赖属性名的语义一致性。

**对应 SQL**：SELECT \* FROM R NATURAL JOIN S;或使用显式 ON子句（推荐）。

**示例**：

关系 Student(SID,Name)与 Enroll(SID,CourseID)的自然连接：

Student⋈Enroll

等价 SQL：

```sql
SELECT * FROM Student NATURAL JOIN Enroll;
```

或更可控的显式写法：

```sql
SELECT * FROM Student JOIN Enroll ON Student.SID = Enroll.SID;
```
## 四、除法 Division（÷）—— “全覆盖 / 包含全部”的利器

**定义**：设关系 R(X,Y)与 S(Y)，其中 X与 Y为属性组。R÷S返回所有 X值，使得该 X在 R中出现的 Y值集合包含 S中的所有 Y值。

**形式**：R÷S

**代数等价式**：

```
R÷S=πX​(R)−πX​((πX​(R)×S)−R)
```

**计算步骤**：

1.  计算候选 X：πX​(R)。
    
2.  生成理论全集：πX​(R)×S。
    
3.  找出缺失配对：理论全集减去实际配对 R。
    
4.  剔除有缺失的 X：从候选集中移除出现在缺失配对中的 X。
    
    **对应 SQL**：无直接关键字，通常使用双重 NOT EXISTS 实现。
    

**示例**：

设 R(StudentID,CourseID)为选课记录，S(CourseID)为必修课集合。

查询“选修了全部必修课的学生”：

πStudentID,CourseID​(R)÷πCourseID​(S)

等价 SQL：

```sql
SELECT DISTINCT e.StudentID
FROM Enroll e
WHERE NOT EXISTS (
    SELECT 1 FROM Required r
    WHERE NOT EXISTS (
        SELECT 1 FROM Enroll e2
        WHERE e2.StudentID = e.StudentID
          AND e2.CourseID = r.CourseID
    )
);
```
## 总结

![Sheet\_20260611](https://cdn.jsdelivr.net/gh/Ymmcc/Ymmcc-blog@main/static/img/uploads/1781155985274-Sheet_20260611.png)
