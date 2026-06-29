---
title: Redis Java 客户端
sidebar_position: 2
date: 2026-06-29
tags: [Redis, Java, Spring Boot, Jedis, Lettuce, Redisson]
description: 本系列全面覆盖Redis数据类型、持久化、高可用架构、高级特性及缓存异常治理，实现从原理认知到工程实战的全面技术进阶。
series: Redis
---

## 一、概述

Java 生态中有多种 Redis 客户端可供选择，常见的包括 **Jedis**、**Lettuce** 和 **Redisson**，以及 Spring Boot 封装的 **RedisTemplate**。

![image](/img/uploads/1782718884877-0.jpg)

| 客户端 | 特点 | 线程安全 | 性能 |
|-------|------|---------|------|
| Jedis | 轻量、直连、同步阻塞 | 否（需连接池） | 高 |
| Lettuce | Netty NIO、异步响应式 | 是 | 更高 |
| Redisson | 分布式数据结构/服务 | 是 | 中 |
| RedisTemplate | Spring 封装，底层可切换 | 是 | 取决于底层 |

## 二、Jedis

**Jedis** 是 Redis 官方推荐的 Java 客户端，以轻量、简洁著称。

### 1. 基本使用

```xml
<dependency>
    <groupId>redis.clients</groupId>
    <artifactId>jedis</artifactId>
    <version>5.0.0</version>
</dependency>
```

```java
// 直连方式（非线程安全，不推荐生产使用）
Jedis jedis = new Jedis("localhost", 6379);
jedis.set("key", "value");
String value = jedis.get("key");
jedis.close();

// 连接池方式（线程安全，推荐）
JedisPool pool = new JedisPool("localhost", 6379);
try (Jedis jedis = pool.getResource()) {
    jedis.set("name", "Redis");
    System.out.println(jedis.get("name"));
}
pool.close();
```

### 2. JedisPool 配置

```java
JedisPoolConfig config = new JedisPoolConfig();
config.setMaxTotal(8);          // 最大连接数
config.setMaxIdle(8);           // 最大空闲连接
config.setMinIdle(0);           // 最小空闲连接
config.setMaxWaitDuration(Duration.ofMillis(100)); // 获取连接超时

JedisPool pool = new JedisPool(config, "localhost", 6379, 2000, "password");
```

## 三、Lettuce

**Lettuce** 基于 Netty NIO 框架，支持同步、异步和响应式编程模型，Spring Boot 2.x 默认集成。

```xml
<dependency>
    <groupId>io.lettuce</groupId>
    <artifactId>lettuce-core</artifactId>
    <version>6.3.0</version>
</dependency>
```

```java
// 同步
RedisClient client = RedisClient.create("redis://localhost:6379");
StatefulRedisConnection<String, String> conn = client.connect();
RedisCommands<String, String> sync = conn.sync();
sync.set("key", "value");
System.out.println(sync.get("key"));

// 异步
RedisAsyncCommands<String, String> async = conn.async();
async.set("key", "value").thenAccept(r -> System.out.println("OK"));

// 响应式
RedisReactiveCommands<String, String> reactive = conn.reactive();
reactive.set("key", "value").subscribe();

conn.close();
client.shutdown();
```

## 四、Redisson

**Redisson** 不仅是一个 Redis 客户端，更是一个基于 Redis 的分布式对象与服务框架。

```xml
<dependency>
    <groupId>org.redisson</groupId>
    <artifactId>redisson</artifactId>
    <version>3.27.0</version>
</dependency>
```

```java
Config config = new Config();
config.useSingleServer().setAddress("redis://localhost:6379");

RedissonClient redisson = Redisson.create(config);

// 分布式锁
RLock lock = redisson.getLock("myLock");
lock.lock(10, TimeUnit.SECONDS);
try {
    // 业务逻辑
} finally {
    lock.unlock();
}

// 分布式集合
RMap<String, String> map = redisson.getMap("myMap");
map.put("key", "value");

redisson.shutdown();
```

## 五、Spring Boot RedisTemplate

Spring Boot 通过 `spring-boot-starter-data-redis` 提供 `RedisTemplate` 和 `StringRedisTemplate`，底层默认使用 Lettuce。

### 1. 依赖配置

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
      password: 
      timeout: 2000ms
      lettuce:
        pool:
          max-active: 8
          max-idle: 8
          min-idle: 0
```

### 2. 基本操作

```java
@Autowired
private RedisTemplate<String, Object> redisTemplate;
@Autowired
private StringRedisTemplate stringRedisTemplate;

// String 操作
stringRedisTemplate.opsForValue().set("key", "value");
String val = stringRedisTemplate.opsForValue().get("key");

// Hash 操作
stringRedisTemplate.opsForHash().put("user:1", "name", "张三");
Object name = stringRedisTemplate.opsForHash().get("user:1", "name");

// List 操作
stringRedisTemplate.opsForList().leftPush("list", "a");
List<String> list = stringRedisTemplate.opsForList().range("list", 0, -1);

// Set 操作
stringRedisTemplate.opsForSet().add("set", "a", "b", "c");
Set<String> set = stringRedisTemplate.opsForSet().members("set");

// 设置过期时间
stringRedisTemplate.expire("key", 60, TimeUnit.SECONDS);
```

### 3. RedisTemplate 序列化配置

```java
@Configuration
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);

        // JSON 序列化器
        GenericJackson2JsonRedisSerializer jsonSerializer =
            new GenericJackson2JsonRedisSerializer();

        // String 序列化器
        StringRedisSerializer stringSerializer = StringRedisSerializer.UTF_8;

        // key 使用 String 序列化
        template.setKeySerializer(stringSerializer);
        template.setHashKeySerializer(stringSerializer);

        // value 使用 JSON 序列化
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);

        template.afterPropertiesSet();
        return template;
    }
}
```

### 4. Spring Cache 整合

```java
// 开启缓存
@SpringBootApplication
@EnableCaching
public class Application {}

// 使用缓存注解
@Service
public class UserService {

    @Cacheable(value = "users", key = "#id")
    public User getById(Long id) {
        return userMapper.findById(id); // 仅首次查询 DB
    }

    @CacheEvict(value = "users", key = "#user.id")
    public void update(User user) {
        userMapper.update(user);
    }
}
```

```yaml
spring:
  cache:
    type: redis
    redis:
      time-to-live: 3600000  # 缓存过期时间 1 小时
      cache-null-values: true
```

## 六、客户端对比与选型

![image](/img/uploads/1782718887795-1.jpg)

| 场景 | 推荐客户端 |
|------|-----------|
| 简单缓存读写 | Jedis + 连接池 |
| Spring Boot 项目 | Lettuce（默认）/ RedisTemplate |
| 分布式锁/对象 | Redisson |
| 高并发异步场景 | Lettuce 响应式 API |
| 微服务集群 | Redisson 分布式服务 |

> **选型建议：** Spring Boot 项目使用默认的 Lettuce + RedisTemplate 即可满足大部分需求；需要分布式锁、公平锁、读写锁等高级特性时引入 Redisson；Jedis 适合对依赖体积敏感或需要极致精简的场景。
