---
title: SQL语句
sidebar_position: 202606122255
date: 2026-06-12
tags: [数据库, MySQL, DBMS]
description: 基于MySQL语言的数据库系统相关知识
series: 数据库
---

## 一、创建表，包含主键、外键

**说明** ：  
主键（PRIMARY KEY）用于唯一标识表中的每一行；外键（FOREIGN KEY）用于建立表之间的关联，引用另一张表的主键。  
**示例** ：创建学生表（主键为学号 sno）、课程表（主键为课程号 cno）、选课表（复合主键 (sno, cno)，且两个外键分别引用学生表和课程表）。

```sql
CREATE TABLE student (
    sno CHAR(8) PRIMARY KEY,
    sname VARCHAR(20) NOT NULL,
    gender CHAR(1),
    age INT,
    dept VARCHAR(30)
);

CREATE TABLE course (
    cno CHAR(5) PRIMARY KEY,
    cname VARCHAR(40) NOT NULL,
    credit INT
);

CREATE TABLE sc (
    sno CHAR(8),
    cno CHAR(5),
    grade INT,
    PRIMARY KEY (sno, cno),
    FOREIGN KEY (sno) REFERENCES student(sno),
    FOREIGN KEY (cno) REFERENCES course(cno)
);
```

* * *

## 二、为表增加 CHECK 约束

**说明** ：  
CHECK 约束用于限制列中数据的取值范围或条件，保证数据的合法性。可以在建表时添加，也可以使用 ALTER TABLE 后添加。  
**示例** ：为学生表的 gender 列增加只能取 'M' 或 'F' 的约束，为 age 列增加 15~30 岁的约束；为选课表的 grade 列增加 0~100 的约束。

```sql
-- 建表时添加
ALTER TABLE student ADD CONSTRAINT chk_gender CHECK (gender IN ('M', 'F'));
ALTER TABLE student ADD CONSTRAINT chk_age CHECK (age BETWEEN 15 AND 30);
ALTER TABLE sc ADD CONSTRAINT chk_grade CHECK (grade BETWEEN 0 AND 100);
```

或者建表时直接写在列定义后

```sql
-- 学生表：主键和 CHECK 直接跟在列定义后
CREATE TABLE student (
    sno CHAR(8) PRIMARY KEY,                     -- 列级主键
    sname VARCHAR(20) NOT NULL,
    gender CHAR(1) CHECK (gender IN ('M', 'F')), -- 列级 CHECK
    age INT CHECK (age >= 15 AND age <= 30),     -- 列级 CHECK
    dept VARCHAR(30)
);

-- 课程表
CREATE TABLE course (
    cno CHAR(5) PRIMARY KEY,
    cname VARCHAR(40) NOT NULL,
    credit INT CHECK (credit > 0)                -- 列级 CHECK
);

-- 选课表：复合主键需单独写，但外键也可以写在列定义后（列级外键）
CREATE TABLE sc (
    sno CHAR(8) REFERENCES student(sno),         -- 列级外键
    cno CHAR(5) REFERENCES course(cno),          -- 列级外键
    grade INT CHECK (grade BETWEEN 0 AND 100),   -- 列级 CHECK
    PRIMARY KEY (sno, cno)                       -- 复合主键仍需表级定义
);
```

* * *

## 三、LIKE, \_, % 的使用

**说明** ：

-   LIKE 用于字符串模糊匹配。
    
-   % 代表任意多个字符（包括0个）。
    
-   \_ 代表一个任意字符。
    

**示例** ：

-   查询姓“张”且名字为两个字的学生：WHERE sname LIKE '张\_'
    
-   查询姓“张”且名字为三个字的学生：WHERE sname LIKE '张\_\_'
    
-   查询名字中包含“华”的学生：WHERE sname LIKE '%华%'
    

```sql
-- 查询所有姓“王”且名字只有两个字的学生
SELECT * FROM student WHERE sname LIKE '王_';

-- 查询所有邮箱（假设有email列）以“@qq.com”结尾的学生
SELECT * FROM student WHERE email LIKE '%@qq.com';

-- 查询学号倒数第二位是‘1’的学生（如 2021001X）
SELECT * FROM student WHERE sno LIKE '%1_';
```

* * *

## 四、COUNT 的使用

**说明** ：  
COUNT(\*) 统计行数；COUNT(列名) 统计该列非空值的个数；常与 DISTINCT 配合去重统计。  
**示例** ：统计学生总数、选课记录数、选修了课程的学生人数（去重）。

```sql
-- 学生总数
SELECT COUNT(*) AS total_students FROM student;

-- 有成绩的选课记录数（grade不为NULL）
SELECT COUNT(grade) FROM sc;

-- 选修了课程的学生人数（去重）
SELECT COUNT(DISTINCT sno) FROM sc;
```

* * *

## 五、GROUP BY 的使用

**说明** ：  
GROUP BY 将数据按一个或多个列分组，常与聚合函数（COUNT, SUM, AVG, MAX, MIN）一起使用，用于分组统计。  
**示例** ：按院系统计学生平均年龄；按课程号统计选课人数、平均成绩。

```sql
-- 按院系统计平均年龄，并只显示平均年龄大于20的院系
SELECT dept, AVG(age) AS avg_age
FROM student
GROUP BY dept
HAVING AVG(age) > 20;

-- 按课程统计选课人数、最高分、最低分
SELECT cno, COUNT(*) AS student_cnt, MAX(grade) AS max_grade, MIN(grade) AS min_grade
FROM sc
WHERE grade IS NOT NULL
GROUP BY cno;
```

* * *

## 六、带子查询的 UPDATE、DELETE 语句

**说明** ：  
子查询可以嵌套在 UPDATE / DELETE 的 WHERE 条件中，用于动态确定要修改或删除的行。  
**UPDATE 示例** ：将“数据库”课程中不及格的成绩每人上调 5 分。  
**DELETE 示例** ：删除没有选修任何课程的学生。

```sql
-- UPDATE：子查询找到课程号为'DB101'的课程（假设数据库课程cno为DB101）
UPDATE sc
SET grade = grade + 5
WHERE cno = (SELECT cno FROM course WHERE cname = '数据库')
  AND grade < 60;

-- DELETE：删除从未选课的学生
DELETE FROM student
WHERE sno NOT IN (SELECT DISTINCT sno FROM sc);
```

* * *

## 七、自身连接、嵌套查询、NOT EXISTS 实现“全部”

### 1.自身连接

**说明** ：一张表与其自身进行连接，必须使用**别名** 来区分不同实例。  
**示例** ：查询与“张三”同院系的其他学生。

```sql
SELECT s2.*
FROM student s1, student s2
WHERE s1.sname = '张三'
  AND s1.dept = s2.dept
  AND s1.sno <> s2.sno;
```
### 2.嵌套查询

**说明** ：一个查询语句中再包含另一个 SELECT 子句。  
**示例** ：查询选修了“数据库”课程且成绩大于90分的学生姓名。

```sql
SELECT sname
FROM student
WHERE sno IN (
    SELECT sno
    FROM sc
    WHERE cno = (SELECT cno FROM course WHERE cname = '数据库')
      AND grade > 90
);
```
### 3.NOT EXISTS 实现“全部”

**说明** ：  
通过双重 NOT EXISTS 表达“不存在一门课程该学生没有选”，即该学生选修了所有课程。  
**示例** ：查询选修了全部课程的学生。

```sql
SELECT sno, sname
FROM student s
WHERE NOT EXISTS (
    SELECT 1
    FROM course c
    WHERE NOT EXISTS (
        SELECT 1
        FROM sc
        WHERE sc.sno = s.sno AND sc.cno = c.cno
    )
);
```
