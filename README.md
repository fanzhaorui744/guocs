# 营养智链 —— 外卖个性化营养管理平台

> 面向用户、商家、营养师三端协同的外卖场景个性化营养健康管理系统（Java 课程设计成果）。

## 一、项目简介

营养智链面向高校及城市外卖高频用户，提供"记录—识别—定量估算—复核—协同"的完整闭环：用户通过拍照或订单截图快速记录餐食与饮品，系统自动识别菜品种类、结合视觉几何定量估算体积与重量，进而推算热量与宏量营养素；商家维护菜品营养资料、回应用户反馈并查看经营数据；营养师在用户授权下复核记录、管理用户档案并发布科普。注册时可选择用户 / 商家 / 营养师身份，登录后进入各自的差异化工作台。三端围绕同一条记录形成可追溯的协同时间线。

## 二、技术栈

### 前端
- 原生 HTML5 + CSS3 + JavaScript（ES6+），无重型框架，Hash Router 单页应用
- 原生 SVG 数据可视化：环形进度、折线趋势、柱状对比、饼图分布，零第三方图表依赖
- CSS Variables + Flexbox + Grid，玻璃态导航、渐变主色、入场动效
- 响应式三档断点：桌面 1440 / 平板 768 / 移动 390，移动端底部标签栏
- 本地账户体系：localStorage 承载注册账户、登录会话与角色状态，刷新保持登录

### 后端
- Spring Boot 2.7.18、Maven、推荐 JDK 17/21（兼容 JDK 8+ 语法）
- Apache HttpClient 调用上游、Jackson 序列化、Lombok、Spring 全局 CORS
- 前端静态资源内置托管于 `src/main/resources/static`，**启动后端即得到"前端 + 接口"同源一体应用**，无需单独部署前端、无跨域问题

### 智能识别与视觉定量能力
系统通过一个 **OpenAI 兼容的多模态智能识别服务**统一承载识别能力，后端 `SmartRecognizeService` 统一封装、前端只对接同源接口：
1. **餐食视觉定量**：上传俯拍餐食照片，完成食物分类与实例分割、1cm 网格 / 参照物尺度标定、视角矫正，结合形状语义厚度（可插拔深度估计）计算体积，再乘视密度得到质量，最终换算热量与营养区间；
2. **订单图文结构化**：识别订单截图/文本，抽取商家、下单时间、菜品明细、规格、数量、价格并自动分类；
3. **营养成分估算**：按菜品与份量估算蛋白质、脂肪、碳水、糖、钠，并给出置信度与说明。

> 服务地址、模型、推理挡位与密钥均由后端配置注入，不在前端暴露；网络不可用时前端自动降级为本地成分表/规则解析，流程不中断。深度估计服务为可插拔组件，未配置时以形状语义厚度兜底，保证定量链路始终可用。

## 三、功能模块（共 17 个页面）

### 账户
- 登录 / 注册页：注册时选择"普通用户 / 商家 / 营养师"角色，商家可填店铺信息、营养师可填资质，注册后进入对应角色首页；顶栏用户芯片显示当前身份并可退出登录。

### 用户端（8 页）
1. 总览/今日：角色欢迎看板、热量环形进度、三餐时间线、宏量营养素、近 7 天趋势、糖摄入监控
2. 订单导入：截图/文本 → 智能结构化 → 候选逐项确认 → 保存
3. 餐食拍照：照片 → 分割标定 → 体积/质量/热量视觉定量 → 可解释推导链 → 份量校正 → 保存
4. 饮品配置：品牌/SKU、杯型、糖度、冰量、小料 → 证据门控营养计算
5. 记录与趋势：历史检索、三餐时段（早/午/晚/加餐）筛选、趋势图表、JSON 导出
6. 目标与设置：个人画像与每日目标、隐私授权
7. 协同社区：推荐 / 关注 / 挑战 / 消息四频道，记录即帖子、三方角色同帖互动、营养纠错、7 天控糖打卡、营养达人榜、成就勋章、话题、收藏与搜索
8. 项目展示：命题背景、技术链路、三方协同闭环图

### 商家端（4 页）
商家工作台、数据分析（订单趋势/菜品点击/偏好分布）、菜品管理（营养资料与上下架）、社区运营（帖子管理与公告），顶部为商家专属经营看板。

### 营养师端（4 页）
复核工作台、用户管理（营养档案与达标率）、知识发布、数据统计（复核量与建议分布），顶部为营养师专属工作统计。

## 四、核心特色

1. **三角色协同闭环**：注册选角色、登录后差异化工作台；用户记录、商家补全菜品数据、营养师授权复核，记录附带可追溯协同时间线。
2. **视觉定量估算**：分割多边形 → 鞋带公式求占地 → 参照物标定 → 视角补偿 → 形状体积模型 → 视密度求质量 → 热量区间，页面给出逐步可解释推导与误差口径；深度模型可插拔、缺失时语义厚度兜底。
3. **严格数据边界**：未知字段不按 0 计算、估算值给区间不随意取中值，按 official / merchant_confirmed / estimated / unknown 证据等级分级展示并标注来源与版本。
4. **证据门控饮品引擎**：基础饮品 + 已验证糖度增量 + 已验证小料，按透明杯饮用比例缩放，证据不足时显式标注未知。
5. **协同社区**：记录一键沉淀为带营养快照的帖子，支持打卡挑战、角色筛选、关注、收藏、转发、提问营养师、达人榜与成就，形成持续运营闭环。
6. **统一多模态识别 + 同源代理**：后端集中鉴权转发，保护密钥并消除浏览器跨域；前端多通道兜底，离线仍可走本地成分库。
7. **工程完整性**：全局异常与降级、统一响应体、配置外部化、前后端同源一体部署。

## 五、项目结构

```
营养智链_Java课程设计/
├── README.md                     # 本说明
├── 项目说明文档.md                # 产品与技术总述
├── frontend/                     # 前端源码（与后端 static 同源同步）
│   ├── index.html / single.html  # 入口 / 零依赖单文件版
│   ├── css/style.css
│   ├── js/
│   │   ├── app/data/engine/components/recognize/volume/auth
│   │   └── pages/（17 个页面）
│   └── assets/
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/nutrition/
│       │   ├── NutritionApplication.java        # 启动类
│       │   ├── config/  ApiConfig、WebCorsConfig
│       │   ├── controller/  Recognize/Meal/Order/Beverage/User 共 5 个
│       │   ├── service/  SmartRecognizeService、NutritionEngine、
│       │   │            VolumeEstimator（体积质量）、DepthEstimator（可插拔深度）
│       │   └── model/  MealRecord/OrderRecord/BeverageConfig/NutritionEstimate/UserProfile/Result
│       └── resources/
│           ├── application.yml         # 主配置（密钥走环境变量，默认留空）
│           ├── application-local.yml   # 本地演示密钥（.gitignore 忽略，勿分发）
│           └── static/                 # 内置前端，启动后端即可访问
├── docs/                         # 需求/系统/数据库/API/部署文档、视觉定量识别提示词、云函数中转样例
├── scripts/                      # 部署与线上核验脚本
└── screenshots/                  # 界面截图
```

## 六、快速开始

### 方式一：一键全栈运行（推荐，答辩演示用）
前端已内置进后端，启动后浏览器访问 <http://localhost:8080/> 即为完整系统：

```bash
cd backend
# 本地演示 profile（读取 application-local.yml 中的演示密钥）
mvn spring-boot:run -Dspring-boot.run.profiles=local
# 打开 http://localhost:8080/
```

### 方式二：环境变量注入密钥（规范做法，无需 local 文件）
```bash
# Windows PowerShell
$env:NUTRITION_API_KEY="你的智能识别服务密钥"
mvn spring-boot:run
```
```bash
# Linux / macOS
export NUTRITION_API_KEY="你的智能识别服务密钥"
mvn spring-boot:run
```

### 方式三：打包后运行
```bash
mvn clean package -DskipTests
java -jar target/nutrition-intelligent-chain-1.0.0.jar --spring.profiles.active=local
```

### 方式四：只看前端（无需后端 / 离线）
双击 `frontend/single.html`，或在 `frontend` 目录执行 `python -m http.server 8765` 后访问。无后端时识别自动降级为本地成分库与规则解析。

### 主要接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/recognize/dish | 菜品类型识别 |
| POST | /api/meal/measure | 餐食视觉定量（分割标定→体积→质量→热量） |
| POST | /api/recognize/order-image | 订单截图结构化 |
| POST | /api/recognize/order-text | 订单文本结构化 |
| POST | /api/recognize/nutrition | 营养成分估算 |
| GET  | /api/recognize/health | 服务健康检查 |

### 配置项（application.yml 的 nutrition 节点）
| 配置 | 环境变量 | 说明 |
|------|----------|------|
| api.base-url | NUTRITION_API_BASE | OpenAI 兼容识别网关地址 |
| api.api-key | NUTRITION_API_KEY | 访问密钥（请勿写入公开代码） |
| api.model | NUTRITION_API_MODEL | 多模态模型名 |
| api.reasoning-effort | NUTRITION_API_EFFORT | 推理挡位 low/medium/high |
| api.timeout-seconds | — | 识别调用超时（默认 45s） |
| depth.base-url | NUTRITION_DEPTH_URL | 深度估计服务地址，留空则用形状语义厚度兜底 |
| depth.timeout-seconds | — | 深度估计超时（默认 8s，超时自动兜底） |

## 七、在线演示

- 在线地址：<https://fanzhaorui744.github.io/guocs/>
- 在线版为纯前端：订单文本解析与营养估算有本地兜底；图像识别与视觉定量需本地后端或云函数中转同源代理（见 `docs/cloudflare-worker/`）。

## 八、安全说明

1. 真实密钥只放在 `application-local.yml`（已被 `.gitignore` 忽略）或通过环境变量注入，主配置 `application.yml` 默认不含密钥。
2. 前端不持有真实密钥，统一请求后端同源接口，由后端鉴权转发，避免密钥在浏览器泄露并解决跨域；公开站点已通过混淆与环境隔离扫描，确认无明文密钥。
3. 账户与会话仅保存在浏览器本地用于课程演示，不构成生产级鉴权。
4. 营养与视觉定量结果为参考估算，会随食材、做法、拍摄角度与参照物存在差异，页面已标注误差口径。

## 九、版本

- v3.1（2026-09）：新增餐食视觉定量链路（分割标定 / 体积质量 / 可解释推导、可插拔深度估计）、注册选角色与三角色差异化看板、协同社区增强（频道 / 打卡挑战 / 达人榜 / 成就 / 消息）。
- v3.0（2026-09）：统一多模态识别服务、前后端同源一体、三角色 16 页面、证据门控饮品引擎、响应式与动效完善。
