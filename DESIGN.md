# 餐量智估Web 原型设计文档

> 版本：2026-09-01 · 本地流程原型 · 纯静态架构（无后端依赖）
> 项目名占位：`餐量智估`，正式名称锁定前不得固化品牌

---

## 1. 页面清单与导航结构

### 1.1 信息架构

采用**单页应用（SPA）+ Hash 路由**，所有模块可通过 URL 定位（`#/page-name`）。顶部导航栏按角色分组，移动端折叠为抽屉菜单。

| 角色域 | 页面 | 路由 | 优先级 | 原型状态 |
|--------|------|------|--------|----------|
| **用户端** | 总览/今日 | `#/` | P0 | 本地流程原型 |
| | 订单导入 | `#/record/order` | P0 | OCR未接入，文本mock |
| | 餐食拍照 | `#/record/meal-photo` | P0 | 识别服务mock，状态机完整 |
| | 饮品配置 | `#/record/beverage` | P0 | 本地规则Demo，08引擎未接入 |
| | 记录与趋势 | `#/history` | P1 | localStorage本地历史 |
| | 目标与设置 | `#/goals` | P1 | 本地配置，含数据删除 |
| **商家端** | 商家工作台 | `#/merchant` | P1 | 固定演示数据，Excel导入预览mock |
| **营养师端** | 营养师复核 | `#/nutritionist` | P1 | 授权mock，本地复核队列 |
| **社区** | 协同社区 | `#/community` | P2 | 本地帖子/评论/收藏/举报mock |
| **项目展示** | 项目与证据 | `#/project` | P2 | 命题/链路/知识库/论文IP说明 |

### 1.2 导航结构

```
顶部栏：[项目名占位 Logo]  [角色切换: 用户|商家|营养师]  [Demo状态标签]  [菜单☰]
主导航（按角色动态显示）：
  用户角色：总览 · 记录一餐▾(订单导入/餐食拍照/饮品配置) · 历史 · 目标设置
  商家角色：工作台
  营养师角色：复核队列
  公共：社区 · 项目展示
页脚：版本2026-09-01 · 本地流程原型 · 非医疗建议 · 数据仅存本机浏览器
```

### 1.3 角色切换说明

无真实登录系统。角色切换为**本地演示模式切换**，切换时顶部显示"当前角色：用户（本地演示账号）"。商家/营养师页面明确标注"演示角色，不代表真实合作或资质已核验"。

---

## 2. 三条关键流程交互说明与状态图

### 2.1 固体餐拍照流程

**状态机：**

```
[未选择照片]
    │ 选择照片/拍照
    ▼
[上传中/识别中] ──取消──→ [未选择照片]
    │
    ├─成功(高置信)→ [完整识别]
    ├─成功(部分)→ [部分识别] ──用户补全──→ [完整识别]
    ├─成功(低置信)→ [低置信结果] ──用户确认份量──→ [完整识别]
    ├─失败/服务不可用→ [失败降级] → 替代路径(订单文本/手动模板/Demo案例)
    └─权限不足→ [权限不足] → 说明用途+替代方法
```

**每状态UI要求：**
- **未选择**：上传区 + 替代入口（订单导入、手动模板、Demo案例）
- **上传中**：进度动画 + 取消按钮 + "本地演示模拟识别"标签
- **完整识别**：分割区域可视化 + 每项类别/份量/营养区间 + 手动调整 + 保存
- **部分识别**：已识别项正常显示，未识别项标"待确认"，不得用默认值填充
- **低置信**：区间扩大 + 黄色警告 + 要求用户确认份量或选择模板
- **失败降级**：错误原因说明 + 三个替代按钮（粘贴订单文字、使用手动模板、加载Demo案例）
- **权限不足**：相机/文件权限用途说明 + 替代方法（从相册选择、手动输入）

**结果字段：** 每项 MealItem 含 name, category, estimated_weight_g, calories_kcal(区间), protein_g, fat_g, carbs_g, confidence, source_ids, value_type, interval, user_adjustment, warnings[]

### 2.2 饮品配置流程

**严格顺序（不可跳过）：**

```
Step1 输入源：订单截图/小票/杯贴照片 或 粘贴订单文字 或 手动输入
    │  (图片仅预览，OCR未接入时明确标注"仅预览/未接入OCR")
    ▼
Step2 候选匹配：文本匹配产生品牌/SKU候选列表
    │  (候选显示匹配来源、候选状态、置信度；不自动确认)
    ▼
Step3 用户确认：品牌 → SKU → 杯型/容量 → 糖度 → 冰量 → 小料
    │  (未确认字段显示"待确认"；全部确认前不允许计算)
    ▼
Step4 透明杯比例门控：
    │  IF 透明+未封口+液面可见+可靠初始容量 → 显示剩余比例输入(可选辅助)
    │  ELSE → 不显示比例控件，走配置确认
    ▼
Step5 计算：按基底 + 糖度差值 + 小料组合拆分
    │
    ▼
Step6 结果展示：区间/置信度/来源/目录版本/生效时间/serving basis/未确认字段/警告
    │  (资料不足或确认缺失 → 结构化unknown，显示"未知/待补充"，不显示0)
    ▼
保存到本地历史
```

**饮品输出字段（NutritionEstimate）：**
```
nutrients: {kcal, protein_g, fat_g, carbs_g, sugar_g, sodium_mg}
  each: {value(nullable), interval(nullable), value_type}
display_mode, display_text, confidence
serving_basis, components[], sources[]
catalog_id, catalog_version, effective_from, effective_to
warnings[]
```

**关键门控：**
- 单张奶茶照片不直接转kcal，必须经过配置确认
- Depth Anything相对深度不当液体深度
- `consumed_ratio`只缩放已有依据的营养区间，不改变SKU/杯型/糖度等
- `value`只有证据允许精确展示时才有值；区间结果`value=null`

### 2.3 三方复核流程（用户→商家→营养师）

```
用户记录餐食/饮品
    │
    ▼
[用户保存记录] → localStorage
    │
    ▼  (用户主动授权)
[授权营养师查看] → ConsentRecord(scope, expires_at)
    │
    ▼
[营养师查看结构化摘要]
    │  含：记录列表、营养区间、来源、配置变更、用户备注
    │  不含：原始截图、个人身份信息（最小必要原则）
    │
    ├─添加复核备注/建议模板 → 标记"完成本地复核"
    ├─发现信息不足 → 标记"需补充信息" → 用户端显示待确认
    ├─用户撤回授权 → 标记"用户撤回授权" → 营养师无权限查看
    └─无授权访问 → "无权限查看"状态
    │
    ▼
[商家端聚合反馈]
    │  仅脱敏聚合：用户对SKU营养信息的理解度/使用反馈
    │  不暴露个人健康数据
    │  商家可调整SKU展示方案 → 版本记录 → 待复核
```

**授权状态机：**
```
未授权 → 用户授权(指定范围+期限) → 已授权 → 营养师可查看
已授权 → 用户撤回 → 已撤回 → 营养师不可查看，审计记录保留
已授权 → 到期 → 已过期 → 需重新授权
```

---

## 3. 数据字段与前端状态模型

### 3.1 领域对象（保留可追溯性字段）

**UserProfile**
```
id, age, sex(optional), height_cm, weight_kg, activity_level
goal, preferences[], avoid_ingredients[], daily_target{kcal, protein_g, ...}
consent_status, consent_expires_at, updated_at
```

**OrderRecord**
```
id, source_type(order_text/order_image/meal_photo/manual)
raw_text, original_asset_ref, merchant_label, meal_period
items[], status, created_at, updated_at
```

**MealItem**
```
id, name, category, estimated_weight_g, consumed_ratio
calories_kcal, protein_g, fat_g, carbs_g, confidence
source_ids[], value_type, interval, user_adjustment, warnings[]
```

**BeverageCandidate**
```
brand_id, brand_name, sku_id, display_name, score
match_source, record_status, available_configuration
```

**BeverageConfig**
```
brand_id, sku_id, cup_size_id, volume_ml
sugar_level_id, ice_level_id, toppings[{topping_id, servings}]
cup_state(transparent_open/sealed/opaque/unknown)
consumed_ratio, consumed_ratio_source
confirmations{brand, sku, cup_size, sugar_level, ice_level, toppings}
```

**NutritionEstimate**（见2.2节）

**SourceRecord**
```
source_id, publisher, source_type, url_or_document_ref
retrieved_at, verified_at, market_scope, evidence_grade
review_status, notes
```

**MerchantSkuVersion**
```
version_id, sku_id, fields, record_status, effective_from, effective_to
submitted_by, reviewed_by, change_reason, audit_events[]
```

**ConsentRecord**
```
subject_id, viewer_role, scope[], status, granted_at, expires_at
revoked_at, audit_events[]
```

**CommunityPost**
```
id, author_role, verification_badge, topic_tags[], title, body
linked_record_ref(optional), moderation_status, reports[], comments[]
created_at, updated_at
```

### 3.2 前端状态模型

```javascript
AppState = {
  currentRoute: '#/',
  currentRole: 'user', // user | merchant | nutritionist
  demoMode: true,
  profile: UserProfile,       // localStorage
  records: OrderRecord[],     // localStorage
  beverageCatalog: {},        // 内置mock（虚构交互候选）
  sourceSeeds: SourceRecord[], // 6条来源型种子记录
  merchantSkus: [],           // localStorage（固定演示数据）
  consentRecords: [],         // localStorage
  communityPosts: [],         // localStorage
  ui: {
    beverageStep: 1,
    mealState: 'idle', // idle|uploading|complete|partial|low_conf|error|permission
    toasts: [],
    modals: {}
  }
}
```

### 3.3 null/区间/来源规则

- `value` 为 `null` 时显示"未知/待补充"，**不显示0**
- 区间结果 `value=null, interval={min,max}`，显示"约 min–max"
- 所有营养项允许 `null`，不得用 `|| 0` 或默认值替代
- 每条结果必须可展开查看 sources、catalog_version、effective_from、warnings
- 来源不完整/serving basis不完整/用户确认缺失 → 结构化 `unknown` 而非静默失败

---

## 4. 视觉方案草案

### 4.1 设计原则

- **可信、克制、可日常使用**：不做营销式英雄区，不用夸张AI视觉
- **信息优先**：状态标签、来源、区间、不确定性是一等公民
- **非医疗语气**：健康建议用"日常营养管理参考"，标注"非医疗建议"

### 4.2 色彩方案（避免靛蓝/紫色，不用渐变发光）

| 用途 | 色值 | 说明 |
|------|------|------|
| 主色 | `#2F6B4F` 深森林绿 | 可信、自然、健康感 |
| 主色浅 | `#E8F0EB` | 背景/选中态 |
| 强调色 | `#C4622D` 暖橙 | 行动按钮、待确认 |
| 成功 | `#3A7D44` | 已确认/已验证 |
| 警告 | `#B8860B` | 低置信/待补充 |
| 错误 | `#A63D40` | 失败/权限不足 |
| 未知 | `#6B7280` 灰 | unknown/null |
| 背景 | `#FAFAF7` 暖白 | 页面背景 |
| 卡片 | `#FFFFFF` | 卡片背景 |
| 文字主 | `#1A1A1A` | 标题/正文 |
| 文字次 | `#5C5C5C` | 辅助说明 |
| 边框 | `#E2E2DC` | 分割线/边框 |

### 4.3 排版

- 字体：系统字体栈 `-apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif`
- 标题：1.25rem/1.5rem/1.75rem 三级，字重600
- 正文：0.9375rem，行高1.6
- 数字/营养值：`tabular-nums` 等宽数字
- 不使用大仪表盘、发光数字、渐变背景

### 4.4 Logo与图标

- **Logo**：纯文字占位 `餐量智估`，左侧简单几何圆点（深森林绿），不暗示注册商标
- **图标**：Lucide 线性图标 CDN（`unpkg.com/lucide@latest`），统一24px描边
- 图标必须配文字标签或 `aria-label`，不单独使用无文字图标

### 4.5 状态标签系统（首屏可见，不藏页脚）

```html
<span class="tag tag-demo">Demo/示例</span>
<span class="tag tag-local">本地流程原型</span>
<span class="tag tag-demo-data">演示数据</span>
<span class="tag tag-not-connected">未接入</span>
<span class="tag tag-pending">待确认</span>
<span class="tag tag-source-low">来源不足</span>
<span class="tag tag-non-medical">非医疗建议</span>
```

每个页面首屏至少显示一个相关状态标签。

---

## 5. 组件边界、响应式与无障碍

### 5.1 组件边界

| 组件 | 职责 | 不做什么 |
|------|------|----------|
| AppShell | 项目名占位、角色切换、导航、Demo状态、页脚边界 | 不处理业务逻辑 |
| StatusBadge | 统一状态标签渲染 | 不决定状态值 |
| NutritionCard | 区间/value/null展示、来源抽屉触发 | 不计算营养值 |
| SourceDrawer | 来源列表、版本、生效时间、证据等级 | 不修改来源 |
| CandidateList | 候选匹配项、确认/拒绝/未知操作 | 不自动确认 |
| ConfigStepper | 饮品配置步骤进度、门控逻辑 | 不计算结果 |
| ResultDetail | 计算拆分、不确定性说明、警告 | 不隐藏unknown |
| StateView | loading/success/partial/needs-confirmation/unknown/error/permission-denied | 不混用状态 |
| RecordList | 日/周/月筛选、编辑/删除/补录入口 | 不做云端同步 |
| MerchantTable | SKU列表、搜索筛选、状态筛选 | 不调用真实API |
| ImportPreview | Excel列映射预览、错误行、重复SKU | 不真实解析文件（mock） |
| ConsentPanel | 授权状态、范围、期限、撤回、审计 | 不处理真实身份 |
| CommunityFeed | 帖子列表、评论、收藏、举报、搜索、审核状态 | 不上传网络 |

### 5.2 响应式规则

- **移动优先**：默认单列布局，最大内容宽度 `768px`
- **断点**：
  - `<640px`：单列，底部导航栏，顶部汉堡菜单
  - `640-1024px`：单列宽版，侧边导航可折叠
  - `>1024px`：左侧固定导航 + 内容区，商家表格可横向滚动
- 所有交互元素最小触控尺寸 `44×44px`
- 表格在窄屏转为卡片式布局，禁止横向溢出页面
- 图片/上传区 `max-width: 100%`

### 5.3 无障碍方案

- 所有图标按钮有 `aria-label` 或可见文字
- 表单控件有关联 `<label>`
- 状态变化用 `aria-live="polite"` 通知
- 颜色对比度 ≥ WCAG AA（4.5:1 正文，3:1 大字）
- 键盘可达：Tab顺序合理，焦点可见（`:focus-visible` 2px outline）
- 模态框有 `role="dialog"`、`aria-modal`、焦点陷阱、Esc关闭
- 不依赖颜色单独传达信息（状态标签同时有文字和图标）
- 图片有 `alt` 文本，装饰图 `alt=""`
- 错误信息与表单控件关联（`aria-describedby`）

---

## 6. Demo 数据与真实数据分层策略

### 6.1 分层原则

| 层级 | 内容 | 标注 | 存储 |
|------|------|------|------|
| L1 内置虚构fixture | 3品牌×15条=45条饮品虚构交互候选、Demo餐食案例、Demo商家SKU、Demo社区帖子 | "虚构交互候选/示例目录" | JS常量 |
| L2 来源型种子记录 | 6条SourceRecord（含来源类型、采集日期、证据等级、复核状态） | "6条来源型种子记录" | JS常量 |
| L3 用户本地数据 | 用户画像、记录历史、商家方案编辑、授权记录、社区互动 | "本地演示数据，仅存本机浏览器" | localStorage |
| L4 未接入能力 | OCR、真实识别服务、08饮品引擎、真实外卖平台、真实商家API、支付、云同步 | "未接入" | UI标注+mock返回 |

### 6.2 所有mock/fixture/未接入能力清单

**内置虚构数据（L1）：**
- 45条饮品虚构交互候选（3品牌×15 SKU），改称"虚构交互候选/示例目录"
- 5个Demo餐食识别案例（用于失败降级和快速演示）
- 20条商家SKU演示数据（固定比例42%/31%等标注"固定演示数据"）
- 8条社区Demo帖子+评论
- 3个Demo用户画像模板

**来源型种子（L2）：**
- 6条SourceRecord，字段完整：source_id, publisher, source_type, retrieved_at, verified_at, evidence_grade, review_status, market_scope, notes
- 与45条虚构候选明确区分展示

**未接入能力（L4，前端mock）：**
- OCR文字识别 → 图片仅预览，文本粘贴走本地关键词匹配mock
- 餐食视觉识别 → setTimeout模拟返回，标注"本地演示模拟识别"
- 08饮品引擎 → 前端复刻契约结构的本地规则计算，标注"本地规则Demo/契约待接入，08引擎未接入主页面"
- 真实外卖平台/商家API → 无
- 支付/云同步/账号系统 → 无
- Excel真实解析 → 预览mock数据，标注"导入预览为Demo模拟"

### 6.3 真实知识库口径

- 当前真实知识库：**仅6条来源型种子记录**
- "3品牌×15-20 SKU"：**后续MVP规划**，不是当前成果
- 45条本地候选：**虚构交互候选**，不称"真实高频SKU"或"知识库已覆盖"

### 6.4 数据持久化与清理

- 所有用户数据存 `localStorage`，key前缀 `npv2_`
- 设置页提供"清空所有本地数据"按钮，二次确认，提示"不可恢复"
- 不要求输入真实身份证、联系方式或敏感健康信息
- 订单截图仅存引用（不存base64大图），Demo模式用占位图

---

## 7. 纯静态架构与评委访问方案

### 7.1 架构

- 纯静态 HTML/CSS/JS，无构建工具，无后端依赖
- 所有"API"为前端函数调用，返回内置mock数据
- 可直接双击 `index.html` 打开，也可部署到任意静态托管
- 提供 `single.html` 单文件版本（CSS/JS/数据内联）作为兜底

### 7.2 三种访问方式

**方案A：静态托管部署（推荐）**
- GitHub Pages / Vercel / Netlify / Cloudflare Pages 任一
- 上传整个 `web_prototype_v2` 目录即可
- 详见 README.md 部署章节

**方案B：局域网临时访问**
- `start_public.bat` 用 Python `http.server` 绑定 `0.0.0.0:8765`
- 显示本机局域网 IP，同一WiFi评委可访问
- 脚本无密钥，仅环境变量占位

**方案C：单文件HTML（兜底）**
- `single.html` 内联所有CSS/JS/数据
- 评委收到一个文件双击即可打开
- 由 `build_single.py` 脚本生成

---

*本文档为设计阶段产物，实现代码见同目录 index.html / css / js。*
