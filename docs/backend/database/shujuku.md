---
title: 备份数据库/表
sidebar_position: 20260610
date: 2026-06-10
tags: [数据库, MySQL, DBMS]
description: 基于MySQL语言的数据库系统相关知识
series: 数据库
---

## 一、备份整个数据库

**命令格式**：

```sql
mysqldump -u 用户名 -p 数据库名 > 备份文件.sql
```

**示例**：备份名为 mydb 的数据库到 mydb\_backup.sql

```sql
mysqldump -u root -p mydb > mydb_backup.sql
```

-   执行后会提示输入密码，验证后开始备份。
    
-   生成的 .sql 文件包含建库（默认不含 CREATE DATABASE ，若需要可加 --database 选项）、建表和数据插入语句。
    

**带更多选项的完整备份示例**（包含建库语句、锁表、单事务等）：

```sql
mysqldump -u root -p --databases mydb --single-transaction --routines --triggers > mydb_full.sql
```
## 二、备份数据库中的指定表

**命令格式**：

```sql
mysqldump -u 用户名 -p 数据库名 表名1 表名2 ... > 备份文件.sql
```

**示例**：备份 mydb 数据库中的 users 和 orders 表

```sql
mysqldump -u root -p mydb users orders > tables_backup.sql
```

**备份单表示例**：

```sql
mysqldump -u root -p mydb employees > employees_backup.sql
```

**注：常用附加选项**

-   \--single-transaction：对 InnoDB 表进行一致性备份，不锁表（适合在线环境）。
    
-   \--lock-tables：锁定 MyISAM 表（默认行为，会影响写入）。
    
-   \--no-data：仅备份表结构，不包含数据。
    
-   \--where="条件"：备份表中满足条件的数据行。
    

## 三、恢复备份

恢复时使用 mysql 命令：

```sql
mysql -u 用户名 -p 目标数据库名 < 备份文件.sql
```

**示例**：恢复整个数据库备份

```sql
mysql -u root -p mydb < mydb_backup.sql
```

如果备份文件中已包含 CREATE DATABASE ，可直接：

```sql
mysql -u root -p < mydb_full.sql
```
