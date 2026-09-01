# 营养智链 —— 外卖个性化营养管理平台 Web 原型

> 版本：2026-09-01 · 本地流程原型 · 纯静态架构（无后端依赖）
> 项目主线：AI 赋能外卖场景个性化营养健康管理

## 公开访问

- **GitHub Pages**: https://fanzhaorui744.github.io/guocs/ （需手动部署，见下方部署步骤）
- **单文件版本**: `single.html`（双击即可运行，无需服务器，287KB）
- **本地启动**: `python -m http.server 8765` → http://127.0.0.1:8765/

## 功能清单（10 页面）

1. **总览/今日**：三餐卡片（早餐/午餐/晚餐/加餐）、SVG环形进度（热量/目标）、宏量营养素环形图（蛋白/脂肪/碳水）、三餐热量分布柱状图、7天趋势折线图、糖摄入单独卡片（饮品/餐食拆分+WHO警告）、协同动态卡片、今日建议（非医疗）
2. **订单导入**：截图/文字输入、候选提取、逐项确认、OCR未接入标注、失败降级
3. **餐食拍照**：7状态机（未选/上传中/完整识别/部分识别/低置信/失败降级/权限不足）、手动校正、替代路径
4. **饮品配置**：严格6步流程（输入源→候选匹配→品牌/SKU/杯型/糖度/冰量/小料确认→透明杯比例门控→区间/unknown结果）、来源/版本/生效时间/置信度/警告、null不转0
5. **记录与趋势**：日/周/月筛选、三餐时段筛选（早餐/午餐/晚餐/加餐）、修改/删除/补录、来源查看、导出JSON
6. **目标与设置**：日常目标、隐私授权、数据导出/删除、估算边界说明
7. **商家工作台**：SKU列表、Excel导入预览、手动编辑、审核流（提交/驳回/回滚）、用户反馈聚合（脱敏）、营养师建议聚合（脱敏）
8. **营养师复核**：授权摘要、核对清单、建议模板库（6条预设模板快速插入）、审计记录、授权期限管理
9. **协同社区**：记录即帖子（营养快照+来源标签+不确定性标注）、三方角色同帖互动（用户/商家认证/营养师资质）、营养纠错机制（信息已更新徽章+旧值可追溯）、话题标签横向滚动、收藏分类（我的餐单/营养知识）、举报（5种原因）、搜索（菜品/商家/标签/话题）、审核状态（草稿/待审核/已发布/被举报/已隐藏）、桌面端侧边栏（热门话题/活跃商家/营养师推荐/社区规则）、帖子详情弹窗（协同时间线+评论角色筛选）
10. **项目展示**：命题匹配、技术链路、知识库状态（6条来源种子+45条虚构候选+MVP规划）、三方协同闭环SVG流程图、论文/IP说明、校园展示记录、素材授权

## 技术栈

- 纯静态 HTML/CSS/JavaScript（无构建工具、无框架依赖）
- Lucide 线性图标库（CDN，ISC License）
- localStorage 本地数据持久化
- 纯 SVG 图表（环形进度/宏量环形图/柱状图/折线图/协同流程图）
- hash 路由（#/page-name），天然适配子路径部署
- 所有"API"为前端函数调用，返回内置 mock 数据

## 边界声明

- 本项目为**本地流程原型**，所有数据为 Demo/演示数据
- **未接入**真实外卖平台、商家接口、支付、云同步或线上服务
- 健康输出仅为**日常营养管理参考**，非医疗建议，不作诊断/治疗/疗效承诺
- 饮品知识库：**6 条来源型种子记录**（真实口径）+ **45 条虚构交互候选**（Demo）
- 08 饮品引擎**尚未接入主页面**，当前为本地规则 Demo/契约待接入
- 需求验证：**15 份安大磬苑周边商家匿名半结构化访谈**（仅作需求验证，非合作/试点）
- 商家页固定比例（42%、31%等）标注为**固定演示数据**
- 论文状态：**已投稿、返修中**；IP/开源按现有凭据，不把拟申请写成已授权

## 部署到 GitHub Pages

```bash
# 1. 复制到英文路径（中文路径下 git 对象写入可能有权限问题）
xcopy "G:\国创赛\web_prototype_v2\*" "G:\guocs_deploy\" /E /I /Y
cd /d G:\guocs_deploy

# 2. git 提交
git init
git add -A
git commit -m "feat: yingyangzhilian web prototype v2.0"
git branch -M main
git remote add origin https://github.com/fanzhaorui744/guocs.git
git push -u origin main

# 3. 开启 Pages（浏览器手动操作）
# 打开 https://github.com/fanzhaorui744/guocs/settings/pages
# Source: Deploy from a branch → Branch: main / root → Save
# 等待 1-2 分钟后访问 https://fanzhaorui744.github.io/guocs/
```

> 注意：所有资源引用为相对路径（css/style.css、js/app.js、assets/logo.svg），适配 /guocs/ 子路径部署。hash 路由天然适配子路径。

## 目录结构

```
web_prototype_v2/
├── index.html                    # 主入口（应用壳层，5.6KB）
├── single.html                   # 单文件版本（287KB，双击即开）
├── css/
│   └── style.css                 # 所有样式（40KB，Logo青绿色系）
├── js/
│   ├── app.js                    # 路由+状态管理（5.4KB）
│   ├── data.js                   # mock数据（31KB，6来源种子+45虚构候选+三餐历史+协同事件+社区帖子）
│   ├── engine.js                 # 饮品计算引擎（13KB，08契约结构前端实现）
│   ├── components.js             # 通用组件+SVG图表（23KB）
│   └── pages/
│       ├── overview.js           # 总览/今日（10.8KB）
│       ├── order.js              # 订单导入（15KB）
│       ├── meal.js               # 餐食拍照（16KB，7状态机）
│       ├── beverage.js           # 饮品配置（22KB，严格顺序+门控）
│       ├── history.js            # 记录与趋势（10KB）
│       ├── goals.js              # 目标与设置（10KB）
│       ├── merchant.js           # 商家工作台（15KB）
│       ├── nutritionist.js       # 营养师复核（8.5KB）
│       ├── community.js          # 协同社区（16.9KB）
│       └── project.js            # 项目展示（9KB）
├── assets/
│   ├── logo.svg                  # 项目Logo（SVG）
│   └── logo.png                  # 项目Logo（PNG）
├── screenshots/
│   ├── desktop/                  # 桌面端截图（1440x900，10张）
│   └── mobile/                   # 移动端截图（390x844，10张）
├── start_public.bat              # 局域网启动脚本
├── build_single.py               # 单文件打包脚本
├── DESIGN.md                     # 设计文档
└── README.md                     # 本文件
```

## 环境变量

本项目为纯静态前端，**无真实密钥**。启动脚本中使用环境变量占位：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| PORT | 8765 | 静态服务端口 |
| HOST | 0.0.0.0 | 绑定地址 |
| DEMO_MODE | true | Demo模式标记 |
| API_KEY | （空） | 空值占位，无真实密钥 |

## 浏览器兼容性

- Chrome / Edge / Firefox / Safari 最新版
- 移动端浏览器（iOS Safari、Chrome Mobile）
- 响应式设计，支持桌面和移动视口

## 许可证与素材

- 代码：MIT License（待团队确认）
- 图标：Lucide（ISC License）
- 饮品/餐食/商家数据：虚构演示数据，不代表真实品牌
- 营养参考：中国食物成分表、USDA FoodData Central（仅作参考区间）
- 项目Logo：营养智链官方Logo，不暗示已注册商标

---

*本原型为安徽省大学生创新大赛产业赛道企业命题组参赛作品的本地流程演示，不代表生产系统或真实运营产品。*
