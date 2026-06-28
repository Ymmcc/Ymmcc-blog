---
title: Tlias 教学管理系统
sidebar_position: 1
date: 2026-06-28
tags: [Java, Spring Boot, MyBatis, Vue, 前后端分离]
description: 基于 Spring Boot 3 + Vue 3 的前后端分离教学管理系统，涵盖部门、员工、班级、学员等核心业务模块。
---

## 项目简介

Tlias 教学管理系统是一个面向培训机构的后台管理平台，采用前后端分离架构，主要用于管理班级、学员、员工、部门等核心业务数据。

**在线演示地址**：`暂无`

**项目源码**：

- 后端：[tlias-web-management](https://github.com/Ymmcc/tlias-web-management)
- 前端：[vue-tlias-management](https://github.com/Ymmcc/vue-tlias-management)

---

## 技术栈

### 后端技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Spring Boot | 3.4.1 | 核心框架 |
| MyBatis | 3.0.3 | ORM 持久层框架 |
| MySQL | 8.x | 关系型数据库 |
| PageHelper | 1.4.7 | MyBatis 分页插件 |
| JJWT | 0.9.1 | JWT 令牌生成与解析 |
| 阿里云 OSS | 3.17.4 | 对象存储服务 |
| Lombok | - | 简化 POJO 代码 |
| Java | 21 | 开发语言 |

### 前端技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.x | 前端框架（Composition API） |
| Vite | 3.0.9 | 构建工具 |
| Vue Router | 4.x | 路由管理 |
| Element Plus | 2.4.4 | UI 组件库 |
| Axios | 1.7.2 | HTTP 请求库 |

---

## 数据库设计

数据库共包含 7 张表，核心业务围绕「部门 → 员工 → 班级 → 学员」这条主线展开。

### 表结构概览

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| `dept` | 部门表 | id, name |
| `emp` | 员工表 | id, username, password, name, gender, phone, job, salary, dept_id |
| `emp_expr` | 工作经历表 | id, emp_id, begin, end, company, job |
| `clazz` | 班级表 | id, name, room, begin_date, end_date, master_id, subject |
| `student` | 学员表 | id, name, no, gender, phone, id_card, degree, clazz_id |
| `emp_log` | 员工日志表 | id, operate_time, info |
| `operate_log` | 操作日志表 | id, operate_emp_id, class_name, method_name, cost_time |

### 表间关系

```
dept (1) ──< emp (N)          一个部门有多名员工
emp  (1) ──< emp_expr (N)     一名员工有多条工作经历
emp  (1) ──< clazz (N)        一名员工可以是多个班级的班主任
clazz (1) ──< student (N)     一个班级有多名学员
emp  (1) ──< operate_log (N)  一名员工产生多条操作日志
```

### 核心表建表语句

```sql
-- 部门表
CREATE TABLE dept (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(10) NOT NULL UNIQUE,
    create_time DATETIME,
    update_time DATETIME
);

-- 员工表
CREATE TABLE emp (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(20) NOT NULL UNIQUE,
    password    VARCHAR(50) DEFAULT '123456',
    name        VARCHAR(10) NOT NULL,
    gender      TINYINT UNSIGNED NOT NULL COMMENT '1=男, 2=女',
    phone       CHAR(11) NOT NULL UNIQUE,
    job         TINYINT UNSIGNED COMMENT '1=班主任, 2=讲师, 3=学工主管, 4=教研主管, 5=咨询师',
    salary      INT UNSIGNED,
    image       VARCHAR(300),
    entry_date  DATE,
    dept_id     INT UNSIGNED,
    create_time DATETIME,
    update_time DATETIME
);

-- 班级表
CREATE TABLE clazz (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(30) NOT NULL UNIQUE,
    room        VARCHAR(20),
    begin_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    master_id   INT UNSIGNED COMMENT '班主任ID',
    subject     TINYINT UNSIGNED NOT NULL COMMENT '1=Java, 2=前端, 3=大数据, 4=Python, 5=Go, 6=嵌入式',
    create_time DATETIME,
    update_time DATETIME
);

-- 学员表
CREATE TABLE student (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name             VARCHAR(10) NOT NULL,
    no               CHAR(10) NOT NULL UNIQUE,
    gender           TINYINT UNSIGNED NOT NULL COMMENT '1=男, 2=女',
    phone            VARCHAR(11) NOT NULL UNIQUE,
    id_card          CHAR(18) NOT NULL UNIQUE,
    is_college       TINYINT UNSIGNED NOT NULL COMMENT '1=是, 0=否',
    address          VARCHAR(100),
    degree           TINYINT UNSIGNED COMMENT '1=初中, 2=高中, 3=大专, 4=本科, 5=硕士, 6=博士',
    graduation_date  DATE,
    clazz_id         INT UNSIGNED NOT NULL,
    violation_count  TINYINT UNSIGNED DEFAULT 0,
    violation_score  TINYINT UNSIGNED DEFAULT 0,
    create_time      DATETIME,
    update_time      DATETIME
);
```

---

## 后端架构设计

### 项目结构

```
com.ymmcc
├── TliasWebManagementApplication.java    -- 启动类
├── anno/
│   └── Log.java                          -- 自定义操作日志注解
├── aop/
│   └── OperationLogAspect.java           -- AOP 切面（操作日志记录）
├── config/
│   └── WebConfig.java                    -- Web MVC 配置
├── controller/                           -- 控制器层
│   ├── LoginController.java
│   ├── DeptController.java
│   ├── EmpController.java
│   ├── ClazzController.java
│   ├── StudentController.java
│   ├── ReportController.java
│   └── UpLoadController.java
├── exception/                            -- 全局异常处理
│   └── GlobalExceptionHandler.java
├── filter/
│   └── TokenFilter.java                  -- JWT 鉴权过滤器
├── mapper/                               -- MyBatis Mapper 接口层
├── pojo/                                 -- 实体/DTO 类
│   ├── Result.java                       -- 统一返回结果
│   ├── PageResult.java                   -- 分页结果
│   └── 各业务实体类...
├── service/                              -- 业务逻辑层
│   └── impl/
└── utils/
    ├── JwtUtils.java                     -- JWT 工具类
    ├── CurrentHolder.java                -- ThreadLocal 存储当前用户
    └── AliyunOSSOperator.java            -- 阿里云 OSS 工具
```

### 三层架构

项目采用经典的三层架构设计：

```
┌─────────────────────────────────────────────────────────┐
│                    Controller 层                         │
│  接收请求、参数校验、调用 Service、返回统一结果            │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                    Service 层                            │
│  业务逻辑处理、事务管理、组合调用 Mapper                   │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                    Mapper 层                             │
│  数据访问层，使用 MyBatis 操作数据库                      │
└─────────────────────────────────────────────────────────┘
```

### 统一返回结果

所有接口统一返回 `Result` 对象：

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Result {
    private Integer code;  // 1=成功, 0=失败
    private String msg;    // 提示信息
    private Object data;   // 响应数据

    public static Result success() {
        return new Result(1, "success", null);
    }

    public static Result success(Object data) {
        return new Result(1, "success", data);
    }

    public static Result error(String msg) {
        return new Result(0, msg, null);
    }
}
```

### 分页封装

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PageResult {
    private Long total;  // 总记录数
    private List rows;   // 当前页数据
}
```

---

## 核心功能实现

### 1. 登录认证（JWT）

采用 JWT（JSON Web Token）实现无状态认证：

```java
// 生成令牌
public static String generateJwt(Map<String, Object> claims) {
    return Jwts.builder()
        .setClaims(claims)
        .signWith(SignatureAlgorithm.HS256, SECRET_KEY)
        .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION))
        .compact();
}
```

**认证流程：**

1. 用户提交用户名密码 → 后端校验
2. 校验通过 → 生成 JWT 令牌返回
3. 前端存储 token 到 localStorage
4. 后续请求携带 token 到请求头
5. `TokenFilter` 拦截请求，校验 token 有效性

**TokenFilter 核心逻辑：**

```java
@WebFilter("/*")
public class TokenFilter implements Filter {
    @Override
    public void doFilter(ServletRequest req, ServletResponse resp, FilterChain chain) {
        HttpServletRequest request = (HttpServletRequest) req;
        String url = request.getRequestURI();

        // 登录接口放行
        if (url.contains("/login")) {
            chain.doFilter(req, resp);
            return;
        }

        // 获取 token
        String token = request.getHeader("token");

        // 校验 token
        if (!StringUtils.hasLength(token)) {
            // 返回 401 错误
            return;
        }

        try {
            Claims claims = JwtUtils.parseJWT(token);
            // 将用户ID存入 ThreadLocal
            CurrentHolder.setCurrentId((Integer) claims.get("id"));
            chain.doFilter(req, resp);
        } catch (Exception e) {
            // token 无效，返回 401
        } finally {
            CurrentHolder.remove();
        }
    }
}
```

### 2. 员工管理（CRUD + 工作经历子表）

员工管理是最复杂的模块，涉及多表操作：

**新增员工（事务）：**

```java
@Transactional(rollbackFor = Exception.class)
public void save(Emp emp) {
    // 1. 补全基础属性
    emp.setCreateTime(LocalDateTime.now());
    emp.setUpdateTime(LocalDateTime.now());
    emp.setPassword("123456"); // 默认密码

    // 2. 保存员工基本信息
    empMapper.insert(emp);

    // 3. 保存工作经历（批量插入）
    List<EmpExpr> exprList = emp.getExprList();
    if (exprList != null && !exprList.isEmpty()) {
        empExprMapper.insertBatch(emp.getId(), exprList);
    }
}
```

**分页条件查询：**

```java
public PageResult<Emp> page(EmpQueryParam param) {
    // 开启分页
    PageHelper.startPage(param.getPage(), param.getPageSize());

    // 执行查询
    List<Emp> empList = empMapper.list(param);

    // 封装结果
    Page<Emp> page = (Page<Emp>) empList;
    return new PageResult<>(page.getTotal(), page.getResult());
}
```

**MyBatis 动态 SQL（XML）：**

```xml
<select id="list" resultType="com.ymmcc.pojo.Emp">
    select * from emp
    <where>
        <if test="name != null and name != ''">
            and name like concat('%', #{name}, '%')
        </if>
        <if test="gender != null">
            and gender = #{gender}
        </if>
        <if test="begin != null and begin != ''">
            and entry_date >= #{begin}
        </if>
        <if test="end != null and end != ''">
            and entry_date &lt;= #{end}
        </if>
    </where>
    order by update_time desc
</select>
```

### 3. 班级管理（动态状态计算）

班级状态根据日期动态计算：

```java
// 查询班级列表时，动态设置状态
for (Clazz clazz : clazzList) {
    LocalDate now = LocalDate.now();
    LocalDate beginDate = clazz.getBeginDate();
    LocalDate endDate = clazz.getEndDate();

    if (now.isBefore(beginDate)) {
        clazz.setStatus("未开班");
    } else if (now.isAfter(endDate)) {
        clazz.setStatus("已结课");
    } else {
        clazz.setStatus("在读");
    }
}
```

**删除班级前检查约束：**

```java
public void deleteById(Integer id) {
    // 检查班级下是否有学员
    Integer count = studentMapper.countByClazzId(id);
    if (count > 0) {
        throw new ClazzCannotDeleteException("该班级下有 " + count + " 名学员，无法删除");
    }
    clazzMapper.deleteById(id);
}
```

### 4. 学员管理（违纪处理）

学员违纪扣分直接在数据库层面操作：

```java
// Mapper 接口
@Update("update student set violation_count = violation_count + 1, " +
        "violation_score = violation_score + #{score} where id = #{id}")
void updateViolation(Integer id, Integer score);
```

### 5. 文件上传（阿里云 OSS）

```java
public String upload(MultipartFile file) throws IOException {
    // 生成唯一文件名
    String originalFilename = file.getFilename();
    String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
    String objectName = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM"))
        + "/" + UUID.randomUUID() + extension;

    // 上传到 OSS
    ossClient.putObject(bucketName, objectName, file.getInputStream());

    // 返回访问 URL
    return "https://" + bucketName + "." + endpoint + "/" + objectName;
}
```

### 6. 操作日志（AOP）

通过自定义注解 + AOP 切面实现操作日志记录：

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Log {
}
```

```java
@Aspect
@Component
public class OperationLogAspect {
    @Around("@annotation(com.ymmcc.anno.Log)")
    public Object recordLog(ProceedingJoinPoint joinPoint) throws Throwable {
        // 记录开始时间
        long begin = System.currentTimeMillis();

        // 执行目标方法
        Object result = joinPoint.proceed();

        // 计算耗时
        long costTime = System.currentTimeMillis() - begin;

        // 记录操作日志
        OperateLog operateLog = new OperateLog();
        operateLog.setOperateEmpId(CurrentHolder.getCurrentId());
        operateLog.setOperateTime(LocalDateTime.now());
        operateLog.setClassName(joinPoint.getTarget().getClass().getName());
        operateLog.setMethodName(joinPoint.getSignature().getName());
        operateLog.setCostTime((int) costTime);

        operateLogMapper.insert(operateLog);

        return result;
    }
}
```

### 7. 数据报表

提供多维度数据统计接口：

```java
@GetMapping("/empJobData")
public Result empJobData() {
    // 统计各职位员工人数
    List<Map<String, Object>> jobList = reportService.getEmpJobData();
    return Result.success(jobList);
}

@GetMapping("/studentDegreeData")
public Result studentDegreeData() {
    // 统计学员学历分布
    List<Map<String, Object>> degreeList = reportService.getStudentDegreeData();
    return Result.success(degreeList);
}
```

---

## 前端架构设计

### 目录结构

```
src/
├── api/              -- API 接口层
│   ├── login.js
│   ├── emp.js
│   ├── dept.js
│   ├── clazz.js
│   └── stu.js
├── router/
│   └── index.js      -- 路由配置
├── utils/
│   └── request.js    -- Axios 封装
├── views/            -- 页面视图
│   ├── login/        -- 登录页
│   ├── layout/       -- 主布局
│   ├── index/        -- 首页
│   ├── emp/          -- 员工管理
│   ├── dept/         -- 部门管理
│   ├── clazz/        -- 班级管理
│   ├── stu/          -- 学员管理
│   └── report/       -- 数据统计
└── App.vue
```

### Axios 请求封装

```javascript
// 请求拦截器：自动携带 token
request.interceptors.request.use(config => {
    const loginUser = JSON.parse(localStorage.getItem('loginUser'));
    if (loginUser && loginUser.token) {
        config.headers.token = loginUser.token;
    }
    return config;
});

// 响应拦截器：统一处理错误
request.interceptors.response.use(
    response => response.data,
    error => {
        if (error.response?.status === 401) {
            router.push('/login');
        }
        ElMessage.error(error.response?.data?.msg || '请求异常');
        return Promise.reject(error);
    }
);
```

---

## 项目特点

1. **前后端分离架构**：前端 Vue 3 + Vite，后端 Spring Boot 3，通过 RESTful API 通信
2. **JWT 无状态认证**：无需服务端存储会话，支持分布式部署
3. **统一异常处理**：全局异常处理器，统一返回格式
4. **事务管理**：涉及多表操作的方法使用 `@Transactional` 注解
5. **动态 SQL**：MyBatis XML 映射文件实现复杂条件查询
6. **AOP 日志记录**：自定义注解 + 切面实现操作日志自动记录
7. **分页查询**：PageHelper 插件实现物理分页
8. **文件上传**：阿里云 OSS 对象存储，支持图片上传

---

## 开发环境

| 工具 | 版本 |
|------|------|
| JDK | 21 |
| Maven | 3.9.x |
| Node.js | 20.x |
| MySQL | 8.x |
| IntelliJ IDEA | 2024.x |
| VS Code | 最新版 |

---

## 总结

Tlias 教学管理系统是一个典型的前后端分离项目，涵盖了 Web 开发的核心知识点：

- **后端**：Spring Boot 三层架构、MyBatis 动态 SQL、JWT 认证、AOP 日志、事务管理、文件上传
- **前端**：Vue 3 Composition API、Element Plus 组件库、Axios 请求封装、路由管理
- **数据库**：多表关联、分页查询、条件筛选

适合 Java Web 初学者学习前后端分离项目的完整开发流程。
