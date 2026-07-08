---
title: 缓存工具封装
sidebar_position: 202607080000
date: 2026-07-08
tags: [Redis, 缓存架构, 性能调优]
description: 本系列全面覆盖Redis数据类型、持久化、高可用架构、高级特性及缓存异常治理，实现从原理认知到工程实战的全面技术进阶。
series: Redis
---

## 一、介绍

由于经常用到缓存工具来解决缓存问题，我们可以基于StringRedisTemplate封装一个缓存工具类。

## 二、具体实现

### 1.缓存穿透的全套解决方案

```java
public void set(String key, Object value, Long time, TimeUnit unit) {
        stringRedisTemplate.opsForValue().set(key, JSONUtil.toJsonStr(value), time, unit);
    }

public <R,ID> R queryWithPassThrough(
            String keyPrefix, ID id, Class<R> type, Function<ID,R> dbFallback,Long time, TimeUnit unit) {
        //1.从redis查询商铺缓存
        String key = keyPrefix + id;
        String json = stringRedisTemplate.opsForValue().get(key);

        //2.判断是否存在
        if(StrUtil.isNotBlank(json)){
            //3.如果存贮器，直接返回
            return JSONUtil.toBean(json,type);
        }

        if(json != null){
            //返回错误信息
            return null;
        }

        //4.不存在，根据id查询数据库
        R r = dbFallback.apply(id);

        //5.如果数据库中不存在，返回错误
        if(r == null){
            //将空值返回redis
            stringRedisTemplate.opsForValue().set(key,"",CACHE_NULL_TTL, TimeUnit.MINUTES);
            //返回错误信息
            return null;
        }

        //6.如果数据库中存在，写入redis
        this.set(key,r,time,unit);

        //7.返回
        return r;
    }
```

> 这个方法实现了**缓存穿透的全套解决方案** ：先查缓存，缓存有则返回；缓存命中空值则直接返回 null（防止穿透）；缓存未命中则查数据库，数据库有就写入缓存，数据库没有就写入空字符串占位。整个流程通过一个方法调用完成，调用方只需传入 key 前缀、ID 和查库函数即可。

### 2.通过"逻辑过期 + 互斥锁"策略解决缓存击穿问题。

```java
public void setWithLogicalExpire(String key, Object value, Long time, TimeUnit unit) {
        //设置逻辑过期
        RedisData redisData = new RedisData();
        redisData.setData(value);
        redisData.setExpireTime(LocalDateTime.now().plusSeconds(unit.toSeconds(time)));
        //写入redis
        stringRedisTemplate.opsForValue().set(key, JSONUtil.toJsonStr(redisData));
    }

/**
     * 尝试获取锁
     * @param key 锁的key
     * @return 是否获取成功
     */
    private boolean tryLock(String key){
        Boolean flag = stringRedisTemplate.opsForValue().setIfAbsent(key,"1",LOCK_SHOP_TTL, TimeUnit.SECONDS);
        return BooleanUtil.isTrue(flag);
    }

    /**
     * 释放锁
     * @param key 锁的key
     */
    private void unLock(String key){
        stringRedisTemplate.delete(key);
    }
```
```
private static final ExecutorService CACHE_REBUILD_EXECUTOR = Executors.newFixedThreadPool(10);
    //逻辑过期解决缓存击穿
    public <R,ID> R queryWithLogicalExpire(String keyPrefix, ID id, Class<R> type,Function<ID,R> dbFallback,Long time, TimeUnit unit) {
        //1.从redis查询商铺缓存
        String key = keyPrefix + id;
        String json = stringRedisTemplate.opsForValue().get(key);

        //2.判断是否存在
        if(StrUtil.isBlank(json)){
            //3.存在，直接返回
            return null;
        }
        //4.命中，需要先把json反序列化为对象
        RedisData redisData = JSONUtil.toBean(json,RedisData.class);
        R r = JSONUtil.toBean((JSONObject) redisData.getData(),type);
        LocalDateTime expireTime = redisData.getExpireTime();
        //5.判断是否过期
        if(expireTime.isAfter(LocalDateTime.now())) {
            //5.1.未过期，直接返回店铺信息
            return r;
        }
        //5.2.过期，已过期，需要缓存重建
        //6.缓存重建
        //6.1.获取互斥锁
        String lockKey = LOCK_SHOP_KEY + id;
        boolean isLock = tryLock(lockKey);
        //6.2.判断获取互斥锁是否成功
        if(isLock) {
            //6.3.成功，开启独立线程，实现缓存重建
            CACHE_REBUILD_EXECUTOR.submit(() -> {
                try {
                    //查询数据库
                    R r1 = dbFallback.apply(id);
                    //写入redis
                    this.setWithLogicalExpire(key,r1,time,unit);
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }finally {
                    //释放锁
                    unLock(lockKey);
                }
            });
        }
        //6.4.失败，返回过期的店铺信息
        return r;
    }
```
### 执行流程图

![deepseek\_mermaid\_20260708\_5a3296](/img/uploads/1783526433570-0.jpg)

> 这个方法的核心思想是**永远不删缓存，只更新它** 。当数据逻辑过期时，互斥锁保证只有一个线程去查数据库重建缓存，其他线程直接返回旧数据。用户始终能拿到数据（可能是旧的），系统始终保持高可用，不会因为热点 key 过期导致大量请求击穿到数据库。
