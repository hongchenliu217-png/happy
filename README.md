# 易送 - 即时配送聚合发单平台

一个对标青云和麦芽田的即时配送行业聚合发单SaaS平台，支持上游商流渠道（美团、淘宝、抖音等）和下游运力服务平台（达达、顺丰同城、闪送等）的对接。

## 核心功能

### 1. 订单管理
- 多渠道订单聚合接入
- 订单状态实时跟踪
- 出餐管理（设置餐品准备完成状态）
- 订单取消和异常处理

### 2. 配送管理
- **自配送**：一键设置为商家自配送
- **第三方配送**：智能派单到多个运力平台
- 配送状态实时同步
- 配送费用自动计算

### 3. 平台对接
**上游平台（商流）：**
- 美团外卖
- 淘宝/饿了么
- 抖音外卖

**下游平台（运力）：**
- 达达配送
- 顺丰同城
- 闪送

### 4. 数据统计
- 订单数据统计
- 营收数据分析
- 平台分布统计
- 配送方式分析

## 技术架构

### 后端
- **框架**: Node.js + Express + TypeScript
- **数据库**: PostgreSQL
- **缓存**: Redis
- **实时通信**: Socket.IO
- **ORM**: TypeORM

### 前端
- **框架**: React 18 + TypeScript
- **UI库**: Ant Design 5
- **路由**: React Router 6
- **状态管理**: Zustand
- **HTTP客户端**: Axios
- **构建工具**: Vite

## 项目结构

```
delivery-saas-platform/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── controllers/    # 控制器
│   │   ├── entities/       # 数据模型
│   │   ├── services/       # 业务逻辑
│   │   ├── routes/         # 路由
│   │   ├── middleware/     # 中间件
│   │   ├── database/       # 数据库配置
│   │   └── utils/          # 工具函数
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   ├── components/    # 通用组件
│   │   ├── api/           # API接口
│   │   └── store/         # 状态管理
│   ├── package.json
│   └── vite.config.ts
└── docs/                  # 文档
```

## 快速开始

### 环境要求
- Node.js >= 18
- PostgreSQL >= 14
- Redis >= 6

### 后端启动

```bash
cd backend
npm install
cp .env.example .env
# 编辑 .env 配置数据库和API密钥
npm run dev
```

### 前端启动

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:5173

## API文档

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 订单接口
- `GET /api/orders` - 获取订单列表
- `POST /api/orders` - 创建订单
- `GET /api/orders/:id` - 获取订单详情
- `PUT /api/orders/:id/meal-ready` - 设置出餐完成
- `POST /api/orders/:id/dispatch` - 派送订单
- `POST /api/orders/:id/self-delivery` - 设置自配送
- `DELETE /api/orders/:id` - 取消订单

### 统计接口
- `GET /api/statistics/dashboard` - 仪表盘数据
- `GET /api/statistics/orders` - 订单统计
- `GET /api/statistics/revenue` - 营收统计
- `GET /api/statistics/platforms` - 平台统计

### Webhook接口
- `POST /api/webhooks/meituan` - 美团订单推送
- `POST /api/webhooks/taobao` - 淘宝订单推送
- `POST /api/webhooks/douyin` - 抖音订单推送
- `POST /api/webhooks/dada` - 达达配送状态回调
- `POST /api/webhooks/sf` - 顺丰配送状态回调
- `POST /api/webhooks/shansong` - 闪送配送状态回调

## 核心业务流程

### 订单处理流程
1. 上游平台推送订单 → Webhook接收
2. 订单入库 → 状态：待确认
3. 商家确认 → 状态：制作中
4. **出餐完成** → 状态：待取餐
5. 选择配送方式：
   - **自配送**：商家自行配送
   - **第三方配送**：选择运力平台派单
6. 配送中 → 已送达

### 配送派单流程
1. 订单出餐完成
2. 选择配送平台（达达/顺丰/闪送）
3. 调用配送平台API创建配送单
4. 获取配送费用和配送员信息
5. 实时同步配送状态

## 配置说明

### 上游平台配置
需要在各平台开放平台申请应用并配置：
- App ID / App Key
- App Secret
- Webhook回调地址

### 下游平台配置
需要在各配送平台申请商户账号并配置：
- 商户ID / Shop ID
- API密钥
- 回调地址

## 部署

### Docker部署（推荐）

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d
```

### 传统部署

1. 安装依赖并构建
```bash
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build
```

2. 配置Nginx反向代理
3. 使用PM2管理Node.js进程
4. 配置PostgreSQL和Redis

## 许可证

MIT License
