/* 项目展示与证据页 */
const PageProject = (() => {
  function render() {
    const info = NPV2_DATA.PROJECT_INFO;
    return `
      <div class="page-header">
        <h1 class="page-title">项目展示与证据</h1>
        <p class="page-subtitle">命题匹配 · 技术链路 · 知识库状态 · 论文IP · 校园展示</p>
        ${UI.demoTags(['demo', 'local'])}
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="award"></i>赛事与命题</div>
        </div>
        <div class="card-body">
          <p style="margin-bottom:8px;"><strong>参赛赛道：</strong>${info.competition}</p>
          <p style="margin-bottom:8px;"><strong>企业命题：</strong>${info.proposition}</p>
          <p style="margin-bottom:8px;"><strong>项目主线：</strong>AI 赋能外卖场景个性化营养健康管理</p>
          <p><strong>当前Web：</strong>本地流程原型，页面中的餐食、饮品、商家、营养师和社区内容使用Demo/示例数据。</p>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="git-branch"></i>用户-商家-营养师协同流程</div>
        </div>
        <div class="card-body">
          <div class="flow-diagram">
            <span class="flow-node">用户记录餐食/饮品</span>
            <span class="flow-arrow">→</span>
            <span class="flow-node">用户授权营养师</span>
            <span class="flow-arrow">→</span>
            <span class="flow-node">营养师查看结构化摘要</span>
            <span class="flow-arrow">→</span>
            <span class="flow-node">复核备注/需补充信息</span>
          </div>
          <div class="flow-diagram">
            <span class="flow-node">商家维护SKU营养资料</span>
            <span class="flow-arrow">→</span>
            <span class="flow-node gate">审核/版本管理</span>
            <span class="flow-arrow">→</span>
            <span class="flow-node">脱敏聚合反馈</span>
            <span class="flow-arrow">→</span>
            <span class="flow-node">调整展示方案</span>
          </div>
          <p style="font-size:0.8125rem;color:var(--color-text-secondary);margin-top:8px;">所有协同为本地流程演示，不代表真实合作、签约或试点。</p>
          <div class="divider"></div>
          <h4 style="font-size:0.9375rem;margin-bottom:12px;">🔄 三方协同闭环（流程图）</h4>
          <!-- 桌面端流程图：菱形布局 -->
          <div class="flow-chart-desktop" style="max-width:560px;margin:0 auto;">
            <svg width="100%" viewBox="0 0 560 300" style="display:block;">
              <defs>
                <linearGradient id="gradUser" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0B7285"/><stop offset="100%" stop-color="#2A9D8F"/></linearGradient>
                <linearGradient id="gradMerchant" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#D9A441"/><stop offset="100%" stop-color="#E8B84A"/></linearGradient>
                <linearGradient id="gradNutri" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6366F1"/><stop offset="100%" stop-color="#818CF8"/></linearGradient>
                <linearGradient id="gradCommunity" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#E76F51"/><stop offset="100%" stop-color="#F08A6E"/></linearGradient>
                <marker id="arrowFlow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#94A3B8"/></marker>
              </defs>
              <!-- 连接线 -->
              <path d="M 250 65 Q 150 110 115 175" fill="none" stroke="#CBD5E1" stroke-width="2" marker-end="url(#arrowFlow)"/>
              <path d="M 310 65 Q 410 110 445 175" fill="none" stroke="#CBD5E1" stroke-width="2" marker-end="url(#arrowFlow)"/>
              <path d="M 140 215 Q 200 245 250 250" fill="none" stroke="#CBD5E1" stroke-width="2" marker-end="url(#arrowFlow)"/>
              <path d="M 420 215 Q 360 245 310 250" fill="none" stroke="#CBD5E1" stroke-width="2" marker-end="url(#arrowFlow)"/>
              <path d="M 280 245 L 280 100" fill="none" stroke="#CBD5E1" stroke-width="2" stroke-dasharray="5,4" marker-end="url(#arrowFlow)"/>
              <!-- 用户节点 -->
              <circle cx="280" cy="50" r="38" fill="url(#gradUser)" filter="drop-shadow(0 4px 10px rgba(11,114,133,0.3))"/>
              <path d="M268 42a8 8 0 1 0 16 0 8 8 0 0 0-16 0 M260 68v-2a6 6 0 0 1 6-6h28a6 6 0 0 1 6 6v2" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
              <text x="280" y="108" text-anchor="middle" font-size="14" font-weight="600" fill="#5A6B7D">用户</text>
              <text x="280" y="124" text-anchor="middle" font-size="11" fill="#8B9AAB">记录/授权/分享</text>
              <!-- 商家节点 -->
              <circle cx="95" cy="200" r="38" fill="url(#gradMerchant)" filter="drop-shadow(0 4px 10px rgba(217,164,65,0.3))"/>
              <path d="M82 192h26 M85 192v16a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-16 M88 186l3-6h12l3 6" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
              <text x="95" y="258" text-anchor="middle" font-size="14" font-weight="600" fill="#5A6B7D">商家</text>
              <text x="95" y="274" text-anchor="middle" font-size="11" fill="#8B9AAB">SKU/补充/反馈</text>
              <!-- 营养师节点 -->
              <circle cx="465" cy="200" r="38" fill="url(#gradNutri)" filter="drop-shadow(0 4px 10px rgba(99,102,241,0.3))"/>
              <path d="M453 188v10a8 8 0 0 0 8 8h0a8 8 0 0 0 8-8v-10 M457 188h16 M449 218v6a6 6 0 0 0 6 6h20a6 6 0 0 0 6-6v-6" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
              <text x="465" y="258" text-anchor="middle" font-size="14" font-weight="600" fill="#5A6B7D">营养师</text>
              <text x="465" y="274" text-anchor="middle" font-size="11" fill="#8B9AAB">复核/建议/审计</text>
              <!-- 社区节点 -->
              <circle cx="280" cy="265" r="38" fill="url(#gradCommunity)" filter="drop-shadow(0 4px 10px rgba(231,111,81,0.3))"/>
              <path d="M262 258h36a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4h-4l-8 6v-6h-24a4 4 0 0 1-4-4v-14a4 4 0 0 1 4-4z" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
              <text x="280" y="320" text-anchor="middle" font-size="14" font-weight="600" fill="#5A6B7D">协同社区</text>
              <text x="280" y="336" text-anchor="middle" font-size="11" fill="#8B9AAB">沉淀/讨论/纠错</text>
            </svg>
          </div>
          <!-- 移动端流程图：垂直布局 -->
          <div class="flow-chart-mobile" style="max-width:320px;margin:0 auto;">
            <svg width="100%" viewBox="0 0 320 520" style="display:block;">
              <defs>
                <linearGradient id="gradUserM" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0B7285"/><stop offset="100%" stop-color="#2A9D8F"/></linearGradient>
                <linearGradient id="gradMerchantM" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#D9A441"/><stop offset="100%" stop-color="#E8B84A"/></linearGradient>
                <linearGradient id="gradNutriM" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6366F1"/><stop offset="100%" stop-color="#818CF8"/></linearGradient>
                <linearGradient id="gradCommunityM" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#E76F51"/><stop offset="100%" stop-color="#F08A6E"/></linearGradient>
                <marker id="arrowFlowM" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#94A3B8"/></marker>
              </defs>
              <!-- 曲线连接线 -->
              <path d="M 160 90 Q 180 110 160 130" fill="none" stroke="#CBD5E1" stroke-width="2" marker-end="url(#arrowFlowM)"/>
              <path d="M 160 210 Q 140 230 160 250" fill="none" stroke="#CBD5E1" stroke-width="2" marker-end="url(#arrowFlowM)"/>
              <path d="M 160 330 Q 180 350 160 370" fill="none" stroke="#CBD5E1" stroke-width="2" marker-end="url(#arrowFlowM)"/>
              <!-- 用户节点 -->
              <circle cx="160" cy="55" r="32" fill="url(#gradUserM)" filter="drop-shadow(0 4px 10px rgba(11,114,133,0.3))"/>
              <path d="M150 48a7 7 0 1 0 14 0 7 7 0 0 0-14 0 M143 70v-2a5 5 0 0 1 5-5h24a5 5 0 0 1 5 5v2" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <text x="160" y="105" text-anchor="middle" font-size="13" font-weight="600" fill="#5A6B7D">用户</text>
              <text x="160" y="120" text-anchor="middle" font-size="10" fill="#8B9AAB">记录/授权/分享</text>
              <!-- 商家节点 -->
              <circle cx="160" cy="175" r="32" fill="url(#gradMerchantM)" filter="drop-shadow(0 4px 10px rgba(217,164,65,0.3))"/>
              <path d="M148 168h24 M151 168v14a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-14 M154 163l2.5-5h11l2.5 5" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <text x="160" y="225" text-anchor="middle" font-size="13" font-weight="600" fill="#5A6B7D">商家</text>
              <text x="160" y="240" text-anchor="middle" font-size="10" fill="#8B9AAB">SKU/补充/反馈</text>
              <!-- 营养师节点 -->
              <circle cx="160" cy="295" r="32" fill="url(#gradNutriM)" filter="drop-shadow(0 4px 10px rgba(99,102,241,0.3))"/>
              <path d="M150 284v9a7 7 0 0 0 7 7h0a7 7 0 0 0 7-7v-9 M153 284h14 M146 310v5a5 5 0 0 0 5 5h18a5 5 0 0 0 5-5v-5" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <text x="160" y="345" text-anchor="middle" font-size="13" font-weight="600" fill="#5A6B7D">营养师</text>
              <text x="160" y="360" text-anchor="middle" font-size="10" fill="#8B9AAB">复核/建议/审计</text>
              <!-- 社区节点 -->
              <circle cx="160" cy="415" r="32" fill="url(#gradCommunityM)" filter="drop-shadow(0 4px 10px rgba(231,111,81,0.3))"/>
              <path d="M144 409h32a3.5 3.5 0 0 1 3.5 3.5v12a3.5 3.5 0 0 1-3.5 3.5h-3.5l-7 5v-5h-21.5a3.5 3.5 0 0 1-3.5-3.5v-12a3.5 3.5 0 0 1 3.5-3.5z" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <text x="160" y="465" text-anchor="middle" font-size="13" font-weight="600" fill="#5A6B7D">协同社区</text>
              <text x="160" y="480" text-anchor="middle" font-size="10" fill="#8B9AAB">沉淀/讨论/纠错</text>
            </svg>
          </div>
          <style>
            .flow-chart-mobile { display: none; }
            @media (max-width: 600px) {
              .flow-chart-desktop { display: none; }
              .flow-chart-mobile { display: block; }
            }
          </style>
          <p style="font-size:0.75rem;color:var(--color-text-muted);text-align:center;margin-top:8px;">实线=正向流程 · 虚线=反馈回流 · 所有数据脱敏聚合，不暴露个人健康信息</p>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="camera"></i>固体餐视觉估计链路</div>
        </div>
        <div class="card-body">
          <div class="flow-diagram">
            <span class="flow-node">采集（条件/尺度）</span>
            <span class="flow-arrow">→</span>
            <span class="flow-node">识别/分割</span>
            <span class="flow-arrow">→</span>
            <span class="flow-node">份量估算</span>
            <span class="flow-arrow">→</span>
            <span class="flow-node gate">人工确认</span>
            <span class="flow-arrow">→</span>
            <span class="flow-node result">区间结果</span>
          </div>
          <p style="font-size:0.8125rem;color:var(--color-text-secondary);margin-top:8px;">适用采集条件、参考标记/尺度、可食用主体和人工修正放在结果上下文中。不把Demo结果外推到所有餐食。当前识别服务为本地演示模拟，未接入真实视觉识别。</p>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="cup-soda"></i>饮品知识库链路</div>
          <span class="tag tag-not-connected"></span>
        </div>
        <div class="card-body">
          <div class="flow-diagram">
            <span class="flow-node">订单/杯贴候选</span>
            <span class="flow-arrow">→</span>
            <span class="flow-node">SKU/规格确认</span>
            <span class="flow-arrow">→</span>
            <span class="flow-node">基底/糖度/小料分表</span>
            <span class="flow-arrow">→</span>
            <span class="flow-node gate">来源和未知门控</span>
            <span class="flow-arrow">→</span>
            <span class="flow-node result">区间/unknown</span>
          </div>
          <div style="margin-top:12px;padding:10px;background:var(--color-warning-light);border-radius:8px;font-size:0.8125rem;color:var(--color-warning);">
            <i data-lucide="alert-triangle" style="width:16px;height:16px;vertical-align:middle;"></i>
            不把单张奶茶/果茶照片直接包装成可靠kcal。不把Depth Anything相对深度当作液体深度。仅透明开口杯且液面可见时才允许剩余比例辅助输入。
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="database"></i>知识库状态</div>
        </div>
        <div class="card-body">
          <div class="grid-3">
            <div class="summary-card" style="padding:14px;">
              <div class="label">真实知识库</div>
              <div class="value" style="font-size:1.5rem;">${info.knowledge_base.source_seeds} <span class="unit">条</span></div>
              <div class="sub">来源型种子记录</div>
              <p style="font-size:0.75rem;color:var(--color-text-secondary);margin-top:6px;">${info.knowledge_base.source_seeds_note}</p>
            </div>
            <div class="summary-card" style="padding:14px;">
              <div class="label">虚构交互候选</div>
              <div class="value" style="font-size:1.5rem;">${info.knowledge_base.fictional_candidates} <span class="unit">条</span></div>
              <div class="sub">3品牌×15 SKU</div>
              <p style="font-size:0.75rem;color:var(--color-text-secondary);margin-top:6px;">${info.knowledge_base.fictional_candidates_note}</p>
            </div>
            <div class="summary-card" style="padding:14px;">
              <div class="label">后续MVP规划</div>
              <div class="value" style="font-size:1.25rem;">3×15-20</div>
              <div class="sub">品牌×SKU</div>
              <p style="font-size:0.75rem;color:var(--color-text-secondary);margin-top:6px;">${info.knowledge_base.mvp_plan}</p>
            </div>
          </div>
          <div class="divider"></div>
          <h4 style="font-size:0.9375rem;margin-bottom:10px;">6条来源型种子记录详情</h4>
          <div class="source-list">
            ${NPV2_DATA.SOURCE_SEEDS.map(s => `
              <div class="source-item">
                <div class="source-publisher">${s.publisher}</div>
                <div class="source-meta">类型：${s.source_type} · 采集：${s.retrieved_at} · 复核：${s.verified_at || '未复核'} · 证据等级：${s.evidence_grade} · 状态：${s.review_status}</div>
                <div class="source-meta">市场范围：${s.market_scope}</div>
                ${s.notes ? `<div class="source-meta">备注：${s.notes}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="file-text"></i>论文、IP与开源</div>
        </div>
        <div class="card-body">
          <p style="margin-bottom:8px;"><strong>论文状态：</strong><span class="tag tag-pending">${info.paper_status}</span>（可出示凭据待团队确认）</p>
          <p style="margin-bottom:8px;"><strong>IP：</strong>${info.ip_opensource.ip}（不把拟申请写成已授权或已注册）</p>
          <p><strong>开源：</strong>${info.ip_opensource.opensource}</p>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="users"></i>需求验证与校园展示</div>
        </div>
        <div class="card-body">
          <p style="margin-bottom:8px;"><strong>需求验证：</strong>${info.requirement_validation}</p>
          <div class="divider"></div>
          <p style="margin-bottom:8px;"><strong>校园展示：</strong>${info.campus_showcase.event}（${info.campus_showcase.date}）</p>
          <p style="font-size:0.8125rem;color:var(--color-text-secondary);">${info.campus_showcase.note}</p>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="external-link"></i>原型入口</div>
        </div>
        <div class="card-body">
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <a href="#/" class="btn btn-primary"><i data-lucide="home"></i>用户总览</a>
            <a href="#/record/beverage" class="btn btn-secondary"><i data-lucide="cup-soda"></i>饮品配置Demo</a>
            <a href="#/record/meal-photo" class="btn btn-secondary"><i data-lucide="camera"></i>餐食拍照Demo</a>
            <a href="#/merchant" class="btn btn-secondary"><i data-lucide="store"></i>商家工作台</a>
            <a href="#/nutritionist" class="btn btn-secondary"><i data-lucide="stethoscope"></i>营养师复核</a>
            <a href="#/community" class="btn btn-secondary"><i data-lucide="users"></i>协同社区</a>
          </div>
          <p style="font-size:0.8125rem;color:var(--color-text-secondary);margin-top:12px;"><span class="tag tag-local">本地流程原型</span> <span class="tag tag-demo-data">演示数据</span> 所有入口为本地演示，不代表生产后台或真实运营系统。</p>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="scale"></i>参考与素材授权</div>
        </div>
        <div class="card-body" style="font-size:0.875rem;color:var(--color-text-secondary);line-height:1.8;">
          <p>• 图标：Lucide（ISC License，可免费商用）</p>
          <p>• 饮品目录数据：虚构交互候选，不代表真实品牌</p>
          <p>• 营养参考：中国食物成分表、USDA FoodData Central（仅作参考区间）</p>
          <p>• 真实品牌图片、菜单、Logo：未使用，均为文字占位或自制示意</p>
          <p>• 项目Logo：纯文字占位「营养智链」，不暗示已注册商标</p>
          <p>• 08饮品引擎：独立契约/adapter/fixture，位于 G:\\国创赛\\workstreams\\08_beverage_engine，尚未接入主页面</p>
        </div>
      </div>
    `;
  }

  return { render };
})();
