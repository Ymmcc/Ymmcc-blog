---
title: Redis的Java客户端
sidebar_position: 202606291513
date: 2026-06-29
tags: []
description: 
series: Redis
---

## 一、介绍

![image](/img/uploads/1782717235484-0.jpg)

> **Spring Data Redis是Spring框架提供的一站式解决方案，通过统一的RedisTemplate API抽象了底层Jedis、Lettuce等客户端的差异，让开发者能以极简配置和一致的方式操作Redis数据库。**

## 二、Spring Data Redis

### 1.介绍

SpringData是Spring中数据操作的模块，包含对各种数据库的集成，其中对Redis的集成模块就叫做SpringDataRedis，官网地址：[https://spring.io/projects/spring-data-redis](https://spring.io/projects/spring-data-redis)

-   提供了对不同Redis客户端的整合（Lettuce和Jedis）
    
-   提供了RedisTemplate统一API来操作Redis
    
-   支持Redis的发布订阅模型
    
-   支持Redis哨兵和Redis集群
    
-   支持基于Lettuce的响应式编程
    
-   支持基于JDK、JSON、字符串、Spring对象的数据序列化及反序列化
    
-   支持基于Redis的JDKCollection实现
    

### 2.快速入门

SpringDataRedis中提供了RedisTemplate工具类，其中封装了各种对Redis的操作。并且将不同数据类型的操作API封装到了不同的类型中：

![image](/img/uploads/1782717238002-1.jpg)
### 3.使用步骤

（1）引入依赖

```java
<!--Redis依赖-->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
<!--连接池依赖-->
<dependency>
  <groupId>org.apache.commons</groupId>
  <artifactId>commons-pool2</artifactId>
</dependency>

```

（2）配置文件

```java
spring:
  redis:
    host: localhost # Redis主机
    port: 6379 # Redis端口
    timeout: 10s # Redis超时时间
    password: Ymc060214@ # Redis密码
    lettuce: # Redis连接池配置
      pool:
        max-active: 10 # 最大连接数
        max-idle: 10 # 最大空闲连接数
        min-idle: 1 # 最小空闲连接数
        max-wait: 10s # 最大等待时间
        time-between-eviction-runs: 10s # 连接池扫描间隔

```

（3）注入RedisTemplate

```java
@Autowired
private RedisTemplate redisTemplate;

```

（4）编写测试

```java
@SpringBootTest
public class RedisTest {

    @Resource
    private StringRedisTemplate stringRedisTemplate;

    @Test
    void testString() {
        // 插入一条string类型数据
        stringRedisTemplate.opsForValue().set("name", "李四");
        // 读取一条string类型数据
        String name = stringRedisTemplate.opsForValue().get("name");
        System.out.println("name = " + name);
    }
}

```
### 4.序列化方式

推荐写法：

```java
@Bean
public RedisTemplate<String, User> redisTemplate(RedisConnectionFactory factory) {
    RedisTemplate<String, User> template = new RedisTemplate<>();
    template.setConnectionFactory(factory);

    // 1. Key用String（根除乱码）
    template.setKeySerializer(RedisSerializer.string());
    template.setHashKeySerializer(RedisSerializer.string());

    // 2. Value用普通Jackson，指定具体类型（去掉@class，省内存）
    ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());
    Jackson2JsonRedisSerializer<User> serializer = 
            new Jackson2JsonRedisSerializer<>(mapper, User.class);

    template.setValueSerializer(serializer);
    template.setHashValueSerializer(serializer);
    template.afterPropertiesSet();
    return template;
}

```

> 解读：
> 
> **1\. 泛型声明** `RedisTemplate<String, User>`
> 
> -   明确告诉Spring：这个模板**只处理User对象** 。
>     
> -   好处：取数据时直接返回`User`类型，无需手动强转。
>     
> 
> **2\. Key序列化** `RedisSerializer.string()`
> 
> -   强制Key存为纯文本（如`user:1001`），杜绝`\xac\xed`乱码，这是“治乱”的核心。
>     
> 
> **3\. Value序列化** `new Jackson2JsonRedisSerializer<>(mapper, User.class)`
> 
> -   **这里就是省内存的关键** ：因为构造方法里传入了`User.class`，序列化器已经知道目标类型，所以**JSON里不会再塞入**`"@class":"com.example.User"`。
>     
> -   对比`Generic`版本，每个Value省下几十个字节的包路径字符串，存亿级数据时效果显著。
>     
> 
> **4\. 日期模块** `registerModule(new JavaTimeModule())`
> 
> -   保证`LocalDateTime`存成`"2026-06-29"`，而不是`[2026,6,29]`这种难读的数组。
>     
> 
> **5\. HashKey 和 HashValue 同理**
> 
> -   Hash结构的字段名也走String序列化，字段值也走JSON序列化，保持统一规范。
>     
> 
> **一句话总结：** 这个写法通过**固定实体类型** 去掉了冗余的`@class`字段，在保持Key清晰、Value可读（JSON）的前提下，最大程度节省了内存。如果存多种对象，就复制这段代码分别建`UserTemplate`和`OrderTemplate`即可。
