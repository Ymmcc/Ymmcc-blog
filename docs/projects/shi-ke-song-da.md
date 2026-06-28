---
title: 食刻送达 — 外卖点餐系统
sidebar_position: 2
date: 2026-06-28
tags: [Java, Spring Boot, MyBatis, Redis, 微信小程序, 微信支付, WebSocket]
description: 基于 Spring Boot 2.7 + MyBatis 的外卖点餐系统，包含微信小程序用户端和管理端，支持微信支付、实时通知、数据报表等完整业务功能。
---

## 项目简介

「食刻送达」是一个功能完整的外卖点餐系统，采用前后端分离架构，包含微信小程序（用户端）、管理后台和后端服务三大模块。

系统实现了从用户微信登录、浏览菜品/套餐、加购物车、下单支付、订单状态流转到商家管理的完整业务闭环。

**项目源码**：

- 后端：`sky-take-out`（Spring Boot 多模块）
- 用户端：微信小程序
- 管理端：Vue + Element UI

---

## 技术栈

### 后端技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Spring Boot | 2.7.3 | 核心框架 |
| MyBatis | 2.2.0 | ORM 持久层框架 |
| MySQL | 8.x | 关系型数据库 |
| Redis | - | 缓存 + 店铺状态存储 |
| Spring Cache | - | 声明式缓存 |
| Druid | 1.2.1 | 数据库连接池 |
| PageHelper | 1.3.0 | MyBatis 分页插件 |
| JWT (jjwt) | 0.9.1 | 令牌生成与解析 |
| 微信支付 SDK | 0.4.8 | 微信支付集成 |
| 阿里云 OSS | 3.10.2 | 对象存储服务 |
| WebSocket | - | 实时消息推送 |
| Knife4j | 3.0.2 | API 文档（Swagger 增强） |
| Apache POI | 3.16 | Excel 报表导出 |
| Lombok | 1.18.36 | 简化 POJO 代码 |

### 前端技术栈

| 技术 | 说明 |
|------|------|
| 微信小程序 | 用户端（C端） |
| Vue 2 + Element UI | 管理端（B端） |
| Nginx | 静态资源服务 + 反向代理 |

---

## 数据库设计

数据库共包含 **11 张表**，核心业务围绕「用户 → 菜品/套餐 → 购物车 → 订单」这条主线展开。

### 表结构概览

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| `user` | C端用户 | id, openid, name, phone |
| `employee` | 员工信息 | id, username, password, status |
| `category` | 分类 | id, type(1菜品/2套餐), name, status |
| `dish` | 菜品 | id, category_id, name, price, image, status |
| `dish_flavor` | 菜品口味 | id, dish_id, name, value(JSON) |
| `setmeal` | 套餐 | id, category_id, name, price, status |
| `setmeal_dish` | 套餐菜品关系 | id, setmeal_id, dish_id, copies |
| `shopping_cart` | 购物车 | id, user_id, dish_id/setmeal_id, number |
| `orders` | 订单 | id, number, status, user_id, amount |
| `order_detail` | 订单明细 | id, order_id, dish_id/setmeal_id, number |
| `address_book` | 地址簿 | id, user_id, consignee, phone, detail |

### 表间关系

```
user (1) ──< address_book (N)      一个用户有多个收货地址
user (1) ──< orders (N)            一个用户有多个订单
user (1) ──< shopping_cart (N)     一个用户有多个购物车项

category (1) ──< dish (N)          一个分类有多个菜品
category (1) ──< setmeal (N)       一个分类有多个套餐

dish (1) ──< dish_flavor (N)       一个菜品有多种口味
dish (1) ──< setmeal_dish (N)      一个菜品属于多个套餐
dish (1) ──< order_detail (N)      一个菜品出现在多个订单明细
dish (1) ──< shopping_cart (N)     一个菜品在多个购物车中

setmeal (1) ──< setmeal_dish (N)   一个套餐包含多个菜品
setmeal (1) ──< order_detail (N)   一个套餐出现在多个订单明细
setmeal (1) ──< shopping_cart (N)  一个套餐在多个购物车中

orders (1) ──< order_detail (N)    一个订单有多个明细
address_book (1) ──< orders (N)    一个地址对应多个订单
```

### 订单状态流转

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ 待付款(1) │────▶│ 待接单(2) │────▶│ 已接单(3) │────▶│ 派送中(4) │────▶│ 已完成(5) │
└──────────┘     └──────────┘     └──────────┘     └──────────┘     └──────────┘
      │                │                │                │
      │                │                │                │
      └────────────────┴────────────────┴────────────────┘
                            ▼
                      ┌──────────┐
                      │ 已取消(6) │
                      └──────────┘
```

### 数据库设计亮点

1. **分类表复用**：`category` 表通过 `type` 字段区分菜品分类和套餐分类，减少表数量
2. **口味数据灵活存储**：`dish_flavor.value` 使用 JSON 格式存储口味数据，支持动态配置
3. **订单快照设计**：订单表冗余存储地址信息，历史订单不受地址修改影响
4. **无外键约束**：应用层维护关联关系，避免外键带来的性能开销

---

## 后端架构设计

### Maven 多模块结构

项目采用 Maven 多模块架构，职责清晰：

```
sky-take-out/                  (父 POM)
├── sky-common/                (公共模块)
│   └── com.sky
│       ├── constant/          -- 常量类
│       ├── context/           -- ThreadLocal 上下文
│       ├── enumeration/       -- 枚举类
│       ├── exception/         -- 异常体系
│       ├── json/              -- JSON 配置
│       ├── properties/        -- 配置属性
│       ├── result/            -- 统一返回结果
│       └── utils/             -- 工具类
│
├── sky-pojo/                  (数据模型层)
│   └── com.sky
│       ├── dto/               -- 请求参数对象
│       ├── entity/            -- 数据库实体
│       └── vo/                -- 响应视图对象
│
└── sky-server/                (业务服务层)
    └── com.sky
        ├── annotation/        -- 自定义注解
        ├── aspect/            -- AOP 切面
        ├── config/            -- 配置类
        ├── controller/        -- 控制器
        │   ├── admin/         -- 管理端接口
        │   ├── user/          -- 用户端接口
        │   └── notify/        -- 支付回调
        ├── handler/           -- 全局异常处理
        ├── interceptor/       -- 拦截器
        ├── mapper/            -- MyBatis Mapper
        ├── service/           -- 业务逻辑层
        ├── task/              -- 定时任务
        └── websocket/         -- WebSocket 服务
```

### 三层架构

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

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Result<T> implements Serializable {
    private Integer code; // 1=成功, 0=失败
    private String msg;   // 提示信息
    private T data;       // 响应数据

    public static <T> Result<T> success() {
        return new Result<>(1, "success", null);
    }

    public static <T> Result<T> success(T data) {
        return new Result<>(1, "success", data);
    }

    public static <T> Result<T> error(String msg) {
        return new Result<>(0, msg, null);
    }
}
```

---

## 核心功能实现

### 1. 双端隔离的 JWT 认证

系统采用两套独立的 JWT 认证体系，管理端和用户端互不干扰：

```java
// 管理端拦截器
public class JwtTokenAdminInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request, 
                            HttpServletResponse response, 
                            Object handler) {
        // 1. 获取 token
        String token = request.getHeader("token");
        
        // 2. 校验 token
        try {
            Claims claims = JwtUtil.parseJWT(
                jwtProperties.getAdminSecretKey(), token
            );
            // 3. 将用户ID存入 ThreadLocal
            BaseContext.setCurrentId(Long.parseLong(claims.get("id").toString()));
            return true;
        } catch (Exception e) {
            response.setStatus(401);
            return false;
        }
    }
}
```

**认证流程：**

1. 用户/管理员登录 → 后端校验账密
2. 校验通过 → 生成 JWT 令牌返回（不同端使用不同密钥）
3. 前端存储 token
4. 后续请求携带 token 到请求头
5. 对应拦截器校验 token，解析用户ID存入 ThreadLocal

### 2. AOP 自动填充公共字段

通过自定义注解 + AOP 切面，优雅地解决审计字段自动赋值问题：

```java
// 自定义注解
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface AutoFill {
    OperationType value(); // INSERT 或 UPDATE
}

// AOP 切面
@Aspect
@Component
public class AutoFillAspect {
    
    @Pointcut("execution(* com.sky.mapper.*.*(..)) && @annotation(com.sky.annotation.AutoFill)")
    public void autoFillPointCut() {}
    
    @Before("autoFillPointCut()")
    public void autoFill(JoinPoint joinPoint) {
        // 获取操作类型
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        AutoFill autoFill = signature.getMethod().getAnnotation(AutoFill.class);
        OperationType operationType = autoFill.value();
        
        // 获取实体参数
        Object entity = joinPoint.getArgs()[0];
        
        // 获取当前时间
        LocalDateTime now = LocalDateTime.now();
        // 获取当前用户ID
        Long currentId = BaseContext.getCurrentId();
        
        // 通过反射填充字段
        if (operationType == OperationType.INSERT) {
            Method setCreateTime = entity.getClass().getDeclaredMethod("setCreateTime", LocalDateTime.class);
            Method setCreateUser = entity.getClass().getDeclaredMethod("setCreateUser", Long.class);
            setCreateTime.invoke(entity, now);
            setCreateUser.invoke(entity, currentId);
        }
        
        Method setUpdateTime = entity.getClass().getDeclaredMethod("setUpdateTime", LocalDateTime.class);
        Method setUpdateUser = entity.getClass().getDeclaredMethod("setUpdateUser", Long.class);
        setUpdateTime.invoke(entity, now);
        setUpdateUser.invoke(entity, currentId);
    }
}
```

**使用方式：**

```java
@AutoFill(OperationType.INSERT)
@Insert("insert into dish(name, category_id, price, image, description, status) " +
        "values(#{name}, #{categoryId}, #{price}, #{image}, #{description}, #{status})")
void insert(Dish dish);
```

### 3. Redis 双缓存策略

系统同时使用编程式缓存和声明式缓存两种方式：

**方式一：编程式缓存（菜品）**

```java
@Service
public class DishServiceImpl implements DishService {
    
    @Autowired
    private RedisTemplate redisTemplate;
    
    @Override
    public List<DishVO> listWithFlavor(Dish dish) {
        String key = "dish_" + dish.getCategoryId();
        
        // 1. 先查缓存
        List<DishVO> dishVOList = (List<DishVO>) redisTemplate.opsForValue().get(key);
        if (dishVOList != null) {
            return dishVOList;
        }
        
        // 2. 缓存未命中，查数据库
        dishVOList = dishMapper.listWithFlavor(dish);
        
        // 3. 写入缓存
        redisTemplate.opsForValue().set(key, dishVOList, 60, TimeUnit.MINUTES);
        
        return dishVOList;
    }
    
    @Override
    public void delete(Long[] ids) {
        // 删除菜品...
        
        // 清理缓存（模式匹配删除）
        Set keys = redisTemplate.keys("dish_*");
        redisTemplate.delete(keys);
    }
}
```

**方式二：声明式缓存（套餐）**

```java
@Service
public class SetmealServiceImpl implements SetmealService {
    
    @Override
    @Cacheable(cacheNames = "setmealCache", key = "#categoryId")
    public List<Setmeal> list(Long categoryId) {
        return setmealMapper.list(categoryId);
    }
    
    @Override
    @CacheEvict(cacheNames = "setmealCache", key = "#setmeal.categoryId")
    public void update(Setmeal setmeal) {
        setmealMapper.update(setmeal);
    }
}
```

### 4. WebSocket 实时通知

支付成功后推送来单提醒，用户催单实时到达：

```java
@ServerEndpoint("/ws/{sid}")
@Component
public class WebSocketServer {
    
    // 存放会话对象
    private static Map<String, Session> sessionMap = new HashMap();
    
    @OnOpen
    public void onOpen(Session session, @PathParam("sid") String sid) {
        sessionMap.put(sid, session);
    }
    
    @OnMessage
    public void onMessage(String message, @PathParam("sid") String sid) {
        // 处理消息...
    }
    
    @OnClose
    public void onClose(@PathParam("sid") String sid) {
        sessionMap.remove(sid);
    }
    
    // 群发消息
    public static void sendToAllClient(String message) {
        for (Map.Entry<String, Session> entry : sessionMap.entrySet()) {
            entry.getValue().getAsyncRemote().sendText(message);
        }
    }
}

// 支付回调中使用
@RestController
@RequestMapping("/notify")
public class PayNotifyController {
    
    @PostMapping("/paySuccess")
    public void paySuccess(@RequestBody String body) {
        // 1. 解密、验签
        // 2. 更新订单状态
        ordersMapper.updateStatus(orderId, Orders.PAID);
        
        // 3. WebSocket 推送来单提醒
        Map map = new HashMap();
        map.put("type", 1); // 1=来单提醒, 2=催单
        map.put("orderId", orderId);
        map.put("content", "订单号：" + orderNumber);
        
        WebSocketServer.sendToAllClient(JSON.toJSONString(map));
    }
}
```

### 5. 微信支付集成

完整的微信支付流程，包含下单、二次签名、支付回调：

```java
@Service
public class OrderServiceImpl implements OrderService {
    
    @Autowired
    private WeChatPayUtil weChatPayUtil;
    
    @Override
    public OrderPaymentVO payment(OrdersSubmitDTO ordersSubmitDTO) {
        // 1. 生成订单号
        String orderNumber = String.valueOf(System.currentTimeMillis());
        
        // 2. 调用微信支付接口
        JSONObject jsonObject = weChatPayUtil.pay(
            "食刻送达-订单",
            orderNumber,
            new BigDecimal("0.01"), // 测试金额
            openid
        );
        
        // 3. 返回支付参数给小程序
        OrderPaymentVO vo = new OrderPaymentVO();
        vo.setNonceStr(jsonObject.getString("nonceStr"));
        vo.setPaySign(jsonObject.getString("paySign"));
        vo.setTimeStamp(jsonObject.getString("timeStamp"));
        vo.setSignType(jsonObject.getString("signType"));
        vo.setPackageStr(jsonObject.getString("package"));
        
        return vo;
    }
}
```

### 6. 定时任务处理异常订单

```java
@Component
@Slf4j
public class OrderTask {
    
    @Autowired
    private OrderMapper orderMapper;
    
    /**
     * 处理超时未支付订单（每分钟执行）
     * 订单超过15分钟未支付，自动取消
     */
    @Scheduled(cron = "0 * * * * ?")
    public void processTimeoutOrder() {
        log.info("处理超时订单：{}", LocalDateTime.now());
        
        // 查询超时订单
        LocalDateTime time = LocalDateTime.now().plusMinutes(-15);
        List<Orders> ordersList = orderMapper.getByStatusAndOrderTimeLT(
            Orders.PENDING_PAYMENT, time
        );
        
        // 批量取消
        if (ordersList != null && ordersList.size() > 0) {
            for (Orders orders : ordersList) {
                orders.setStatus(Orders.CANCELLED);
                orders.setCancelReason("订单超时，自动取消");
                orderMapper.update(orders);
            }
        }
    }
    
    /**
     * 处理派送中订单（每天凌晨1点执行）
     * 订单超过60分钟仍派送中，自动完成
     */
    @Scheduled(cron = "0 0 1 * * ?")
    public void processDeliveryOrder() {
        log.info("处理派送中订单：{}", LocalDateTime.now());
        
        LocalDateTime time = LocalDateTime.now().plusMinutes(-60);
        List<Orders> ordersList = orderMapper.getByStatusAndOrderTimeLT(
            Orders.DELIVERY_IN_PROGRESS, time
        );
        
        if (ordersList != null && ordersList.size() > 0) {
            for (Orders orders : ordersList) {
                orders.setStatus(Orders.COMPLETED);
                orderMapper.update(orders);
            }
        }
    }
}
```

### 7. 运营数据报表

支持多维度数据统计，并可导出 Excel：

```java
@Service
public class ReportServiceImpl implements ReportService {
    
    @Autowired
    private OrderMapper orderMapper;
    
    @Override
    public BusinessDataVO getBusinessData(LocalDateTime begin, LocalDateTime end) {
        // 查询订单数据
        Map map = new HashMap();
        map.put("begin", begin);
        map.put("end", end);
        
        // 营业额
        Double turnover = orderMapper.sumByMap(map);
        // 有效订单数
        Integer validOrderCount = orderMapper.countByMap(map);
        // 订单完成率
        Double orderCompletionRate = validOrderCount.doubleValue() / totalOrderCount;
        // 平均客单价
        Double unitPrice = turnover / validOrderCount;
        // 新增用户数
        Integer newUsers = userMapper.countByMap(map);
        
        return new BusinessDataVO(turnover, validOrderCount, 
                                  orderCompletionRate, unitPrice, newUsers);
    }
    
    @Override
    public void exportBusinessData(HttpServletResponse response) {
        // 1. 查询最近30天数据
        // 2. 使用 POI 写入 Excel 模板
        // 3. 输出到响应流
    }
}
```

---

## 管理端接口概览

| 模块 | 核心接口 | 说明 |
|------|----------|------|
| 员工管理 | CRUD + 启停用 | 员工登录、新增、分页查询 |
| 分类管理 | CRUD + 启停用 | 菜品分类、套餐分类 |
| 菜品管理 | CRUD + 口味管理 | 批量删除、起售停售 |
| 套餐管理 | CRUD + 关联菜品 | 批量删除、起售停售 |
| 订单管理 | 搜索、接单、拒单、派送 | 订单状态流转 |
| 工作台 | 今日数据、总览 | 营业额、订单量统计 |
| 数据报表 | 营业额、用户、销量Top10 | Excel 导出 |

---

## 用户端接口概览

| 模块 | 核心接口 | 说明 |
|------|----------|------|
| 微信登录 | code换openid | 自动注册新用户 |
| 分类浏览 | 分类列表 | 菜品分类、套餐分类 |
| 菜品浏览 | 列表 + 口味 | Redis 缓存 |
| 套餐浏览 | 列表 + 内含菜品 | Spring Cache 缓存 |
| 购物车 | 增/减/清空 | 实时计算金额 |
| 订单 | 下单、支付、取消 | 微信支付集成 |
| 地址簿 | CRUD + 默认地址 | 三级行政区划 |

---

## 项目特点

1. **完整的外卖业务闭环**：从用户微信登录到订单完成，业务链路完整
2. **AOP 自动填充**：自定义 `@AutoFill` 注解，优雅解决审计字段问题
3. **双端隔离认证**：管理端和用户端独立的 JWT 密钥和拦截器
4. **Redis + Spring Cache 双缓存**：编程式 + 声明式，灵活应对不同场景
5. **WebSocket 实时通知**：来单提醒、催单实时推送到管理端
6. **定时任务**：自动处理超时订单，保证数据一致性
7. **运营数据报表**：多维度统计 + Excel 导出
8. **微信支付完整集成**：下单、二次签名、支付回调、退款

---

## 开发环境

| 工具 | 版本 |
|------|------|
| JDK | 8+ |
| Maven | 3.x |
| MySQL | 8.x |
| Redis | 6.x |
| 微信开发者工具 | 最新版 |

---

## 总结

「食刻送达」是一个功能完善的外卖点餐系统，涵盖了以下核心知识点：

- **后端**：Spring Boot 多模块架构、MyBatis 动态 SQL、JWT 双端认证、AOP 自动填充、Redis 缓存、WebSocket 实时通信、微信支付、定时任务、Excel 报表
- **数据库**：11张表设计、订单状态机、快照设计、JSON 字段存储
- **架构**：三层架构、DTO/VO 分层、ThreadLocal 上下文、全局异常处理

适合作为 Java Web 全栈项目的学习参考。
