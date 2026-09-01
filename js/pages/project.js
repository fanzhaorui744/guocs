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
          <h4 style="font-size:0.9375rem;margin-bottom:12px;">🔄 三方协同闭环（SVG流程图）</h4>
          <svg width="100%" viewBox="0 0 600 280" style="max-width:600px;margin:0 auto;display:block;">
            <!-- 用户节点 -->
            <circle cx="300" cy="50" r="42" fill="var(--color-primary-50)" stroke="var(--color-primary-500)" stroke-width="2"/>
            <text x="300" y="46" text-anchor="middle" font-size="14" font-weight="700" fill="var(--color-primary-700)">👤 用户</text>
            <text x="300" y="62" text-anchor="middle" font-size="10" fill="var(--color-text-muted)">记录/授权/分享</text>
            <!-- 商家节点 -->
            <circle cx="100" cy="200" r="42" fill="var(--color-accent-50)" stroke="var(--color-accent-500)" stroke-width="2"/>
            <text x="100" y="196" text-anchor="middle" font-size="14" font-weight="700" fill="var(--color-accent-700)">🏪 商家</text>
            <text x="100" y="212" text-anchor="middle" font-size="10" fill="var(--color-text-muted)">SKU/补充/反馈</text>
            <!-- 营养师节点 -->
            <circle cx="500" cy="200" r="42" fill="var(--color-warning-50)" stroke="var(--color-warning-500)" stroke-width="2"/>
            <text x="500" y="196" text-anchor="middle" font-size="14" font-weight="700" fill="var(--color-warning-700)">🩺 营养师</text>
            <text x="500" y="212" text-anchor="middle" font-size="10" fill="var(--color-text-muted)">复核/建议/审计</text>
            <!-- 社区节点 -->
            <rect x="240" y="210" width="120" height="50" rx="10" fill="var(--color-success-50)" stroke="var(--color-success-500)" stroke-width="2"/>
            <text x="300" y="232" text-anchor="middle" font-size="14" font-weight="700" fill="var(--color-success-700)">💬 协同社区</text>
            <text x="300" y="248" text-anchor="middle" font-size="10" fill="var(--color-text-muted)">沉淀/讨论/纠错</text>
            <!-- 箭头：用户→商家 -->
            <path d="M 268 75 Q 160 110 130 165" fill="none" stroke="var(--color-primary-400)" stroke-width="2" marker-end="url(#arrowhead)"/>
            <text x="170" y="115" font-size="10" fill="var(--color-text-muted)">记录触发补充邀请</text>
            <!-- 箭头：商家→用户 -->
            <path d="M 130 175 Q 180 130 268 85" fill="none" stroke="var(--color-accent-400)" stroke-width="2" stroke-dasharray="4,3" marker-end="url(#arrowhead)"/>
            <text x="175" y="155" font-size="10" fill="var(--color-text-muted)">更新回流</text>
            <!-- 箭头：用户→营养师 -->
            <path d="M 332 75 Q 440 110 470 165" fill="none" stroke="var(--color-primary-400)" stroke-width="2" marker-end="url(#arrowhead)"/>
            <text x="410" y="115" font-size="10" fill="var(--color-text-muted)">授权复核</text>
            <!-- 箭头：营养师→用户 -->
            <path d="M 470 175 Q 420 130 332 85" fill="none" stroke="var(--color-warning-400)" stroke-width="2" stroke-dasharray="4,3" marker-end="url(#arrowhead)"/>
            <text x="400" y="155" font-size="10" fill="var(--color-text-muted)">建议反馈</text>
            <!-- 箭头：商家→社区 -->
            <path d="M 142 210 Q 200 225 240 230" fill="none" stroke="var(--color-accent-400)" stroke-width="2" marker-end="url(#arrowhead)"/>
            <!-- 箭头：营养师→社区 -->
            <path d="M 458 210 Q 400 225 360 230" fill="none" stroke="var(--color-warning-400)" stroke-width="2" marker-end="url(#arrowhead)"/>
            <!-- 箭头：社区→用户 -->
            <path d="M 300 210 L 300 92" fill="none" stroke="var(--color-success-400)" stroke-width="2" marker-end="url(#arrowhead)"/>
            <text x="310" y="155" font-size="10" fill="var(--color-text-muted)">社区沉淀反哺</text>
            <defs><marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="var(--color-text-muted)"/></marker></defs>
          </svg>
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
          <span class="tag tag-not-connected">08引擎未接入主页面</span>
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
          <p>• 项目Logo：纯文字占位「餐量智估」，不暗示已注册商标</p>
          <p>• 08饮品引擎：独立契约/adapter/fixture，位于 G:\\国创赛\\workstreams\\08_beverage_engine，尚未接入主页面</p>
        </div>
      </div>
    `;
  }

  return { render };
})();
