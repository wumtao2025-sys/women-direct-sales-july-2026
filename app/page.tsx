'use client';

import { useState } from 'react';
import { AlertOctagon, AlertTriangle, ArrowDownRight, Banknote, Database, Landmark, LayoutDashboard, Store, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import salesData from './phase3-data.json';
import phase4 from './phase4-data.json';
import phase5 from './phase5-data.json';
import phase6 from './phase6-data.json';
import phase7 from './phase7-data.json';

const currency = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 });
const compactCurrency = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', notation: 'compact', maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat('zh-CN', { style: 'percent', maximumFractionDigits: 1 });
type ModuleId = 'home' | 'sales' | 'collection' | 'operating_profit' | 'new_stores' | 'exceptions';
type DrillFocus = { categoryId: string; row: any } | null;

function MetricCard({ label, value, note, tone = 'ink' }: { label: string; value: string; note: string; tone?: 'ink' | 'teal' | 'amber' }) {
  return <section className={`metric-card metric-${tone}`}><p>{label}</p><strong>{value}</strong><span>{note}</span></section>;
}

function statusClass(rate: number | null) {
  if (rate === null) return 'status-muted';
  const lag = phase4.time_progress - rate;
  return lag >= 0.2 ? 'status-danger' : lag >= 0.1 ? 'status-risk' : 'status-good';
}

function FinanceModule({ metric, brandId, month, setMonth }: { metric: 'collection' | 'operating_profit'; brandId: string; month: number; setMonth: (value: number) => void }) {
  const model: any = phase4[metric];
  const brand = model.brands.find((item: any) => item.id === brandId);
  const monthly = model.monthly_channels.filter((item: any) => item.brand_id === brandId);
  const title = metric === 'collection' ? '回款经营' : '经营利润';
  const icon = metric === 'collection' ? <Banknote size={21} /> : <TrendingUp size={21} />;
  const monthlyRows = monthly.map((channel: any) => ({ ...channel, point: channel.months.find((item: any) => item.month === month) }));
  const monthTarget = monthlyRows.reduce((sum: number, row: any) => sum + (row.point?.target ?? 0), 0);
  const monthActual = monthlyRows.reduce((sum: number, row: any) => sum + (row.point?.actual ?? 0), 0);
  const annualRate = brand.completion_rate;
  const forecastRate = brand.forecast / brand.target;
  const lossRows = metric === 'operating_profit' ? model.loss_units.filter((item: any) => item.brand_id === brandId) : [];

  return <>
    <header className="dashboard-header">
      <div><div className="eyebrow"><span /> 总经理经营工作台 · V1</div><h1>{title}</h1><p>{brand.name} · 2026年度 / {month}月</p></div>
      <div className="source-pill"><Database size={16} /> 数据截至 <span>{phase4.actual_cutoff}</span></div>
    </header>
    <section className="filter-bar">
      <label>月份<select value={month} onChange={(event) => setMonth(Number(event.target.value))}>{Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}月{m > 7 ? '（仅目标）' : ''}</option>)}</select></label>
      <span className="filter-note">{metric === 'collection' ? `月度可用 ${monthly.length} 个线上经营单元` : `月度可用 ${monthly.length} 个渠道`}</span>
    </section>
    <section className="metric-grid">
      <MetricCard label="年度目标" value={compactCurrency.format(brand.target)} note="2026全年目标" />
      <MetricCard label="截至7月实际" value={compactCurrency.format(brand.actual)} note={`完成率 ${percent.format(annualRate)}`} tone="teal" />
      <MetricCard label="时间进度" value={percent.format(phase4.time_progress)} note={`相差 ${percent.format(annualRate - phase4.time_progress)}`} tone="amber" />
      <MetricCard label="月底趋势预测" value={compactCurrency.format(brand.forecast)} note={`预计完成 ${percent.format(forecastRate)}`} />
    </section>
    <section className="performance-band"><div className="performance-copy"><div className="icon-box">{icon}</div><div><p>年度目标完成率</p><strong>{percent.format(annualRate)}</strong></div></div><Progress value={Math.min(Math.max(annualRate * 100, 0), 100)} className="h-2.5 flex-1 bg-slate-600 [&_[data-slot=progress-indicator]]:bg-teal-400" /><div className="performance-gap"><ArrowDownRight size={17} /> 预测缺口 {currency.format(brand.forecast_gap)}</div></section>
    <section className="table-panel">
      <div className="table-heading"><div><h2>年度渠道完成情况</h2><p>合并口径原样保留，不强制拆分。</p></div></div>
      <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>渠道 / 汇总组</TableHead><TableHead className="text-right">年度目标</TableHead><TableHead className="text-right">截至7月实际</TableHead><TableHead className="text-right">完成率</TableHead><TableHead className="text-right">预测缺口</TableHead><TableHead className="text-right">状态</TableHead></TableRow></TableHeader><TableBody>{brand.channels.map((row: any) => <TableRow key={`${row.name}-${row.target}`}><TableCell><div className="channel-name"><span>{row.name.slice(0,1)}</span><div><b>{row.name}</b><small>{row.scope_type === 'COMBINED' ? '合并口径，待后续确认拆分' : '标准渠道'}</small></div></div></TableCell><TableCell className="text-right tabular-nums">{currency.format(row.target)}</TableCell><TableCell className="text-right tabular-nums">{row.actual == null ? '—' : currency.format(row.actual)}</TableCell><TableCell className="text-right">{row.completion_rate == null ? '—' : percent.format(row.completion_rate)}</TableCell><TableCell className="text-right">{row.forecast_gap == null ? '—' : currency.format(row.forecast_gap)}</TableCell><TableCell className="text-right"><Badge variant="outline" className={statusClass(row.completion_rate)}>{row.completion_rate == null ? '暂无实际' : phase4.time_progress - row.completion_rate >= .2 ? '红色预警' : phase4.time_progress - row.completion_rate >= .1 ? '黄色预警' : '进度正常'}</Badge></TableCell></TableRow>)}</TableBody></Table></div>
    </section>
    <section className="table-panel">
      <div className="table-heading"><div><h2>{month}月{title}明细</h2><p>{model.scope_note}</p></div><div className="legend">目标 {compactCurrency.format(monthTarget)} · 实际 {compactCurrency.format(monthActual)}</div></div>
      <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>渠道</TableHead><TableHead className="text-right">月度目标</TableHead><TableHead className="text-right">月度实际</TableHead><TableHead className="text-right">完成率</TableHead><TableHead>来源状态</TableHead></TableRow></TableHeader><TableBody>{monthlyRows.map((row: any) => <TableRow key={row.channel_id}><TableCell className="font-semibold">{row.channel_name}</TableCell><TableCell className="text-right">{row.point?.target == null ? '—' : currency.format(row.point.target)}</TableCell><TableCell className="text-right">{row.point?.actual == null ? '—' : currency.format(row.point.actual)}</TableCell><TableCell className="text-right">{row.point?.completion_rate == null ? '—' : percent.format(row.point.completion_rate)}</TableCell><TableCell><span className="source-mini">{row.point?.actual_sources?.[0] ? `${row.point.actual_sources[0].workbook} · ${row.point.actual_sources[0].sheet}!${row.point.actual_sources[0].cell}` : '该月暂无同口径实际'}</span></TableCell></TableRow>)}</TableBody></Table></div>
    </section>
    {metric === 'operating_profit' && <section className="table-panel loss-panel"><div className="table-heading"><div><h2>亏损门店 / 经营单元</h2><p>按“连续3个月及以上 → 连续2个月 → 本月亏损 → 完成率最低”排序。</p></div><Badge variant="outline" className="status-danger"><AlertTriangle size={13} />{lossRows.length} 个</Badge></div><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>门店 / 经营单元</TableHead><TableHead>渠道</TableHead><TableHead className="text-right">7月目标</TableHead><TableHead className="text-right">7月实际</TableHead><TableHead className="text-right">利润率</TableHead><TableHead>连续亏损</TableHead></TableRow></TableHeader><TableBody>{lossRows.map((row: any) => <TableRow key={row.store_id}><TableCell><b>{row.name}</b><div className="source-mini">{row.operating_group}</div></TableCell><TableCell>{row.channel_name}</TableCell><TableCell className="text-right">{row.target == null ? '—' : currency.format(row.target)}</TableCell><TableCell className="text-right text-red-700">{currency.format(row.actual)}</TableCell><TableCell className="text-right">{row.profit_margin == null ? '—' : percent.format(row.profit_margin)}</TableCell><TableCell><Badge variant="outline" className={row.loss_streak >= 3 ? 'status-danger' : 'status-risk'}>{row.loss_state}</Badge></TableCell></TableRow>)}</TableBody></Table></div></section>}
  </>;
}

function SalesSummary({ brandId }: { brandId: string }) {
  const brand: any = salesData.brands.find((item) => item.id === brandId) ?? salesData.brands[0];
  const rows = brand.channels.map((channel: any) => ({ channel, point: channel.months.find((item: any) => item.month === 7) }));
  return <><header className="dashboard-header"><div><div className="eyebrow"><span /> 总经理经营工作台 · V1</div><h1>销售全渠道</h1><p>{brand.name} · 2026年7月 · 销售收入</p></div><div className="source-pill"><Database size={16} /> 数据截至 <span>{salesData.actual_cutoff}</span></div></header><section className="table-panel"><div className="table-heading"><div><h2>7月渠道完成情况</h2><p>Phase 3 已确认口径；完整月度交互将在经营首页阶段统一编排。</p></div></div><Table><TableHeader><TableRow><TableHead>渠道</TableHead><TableHead className="text-right">目标</TableHead><TableHead className="text-right">实际</TableHead><TableHead className="text-right">完成率</TableHead><TableHead>数据状态</TableHead></TableRow></TableHeader><TableBody>{rows.map(({channel,point}: any) => <TableRow key={channel.id}><TableCell className="font-semibold">{channel.name}</TableCell><TableCell className="text-right">{point?.target == null ? '—' : currency.format(point.target)}</TableCell><TableCell className="text-right">{point?.actual == null ? '—' : currency.format(point.actual)}</TableCell><TableCell className="text-right">{point?.completion_rate == null ? '—' : percent.format(point.completion_rate)}</TableCell><TableCell>{channel.data_state_name}</TableCell></TableRow>)}</TableBody></Table></section></>;
}

function NewStoreModule({ brandId, month, setMonth }: { brandId: string; month: number; setMonth: (value: number) => void }) {
  const brand: any = phase5.brands.find((item) => item.id === brandId);
  const monthPlanned = brand.planned_by_month[month - 1];
  const cumulative = brand.planned_cumulative[month - 1];
  return <>
    <header className="dashboard-header"><div><div className="eyebrow"><span /> 总经理经营工作台 · V1</div><h1>新开店铺</h1><p>{brand.name} · 2026年度 / {month}月计划</p></div><div className="source-pill"><Database size={16} /> 数据截至 <span>{phase5.actual_cutoff}</span></div></header>
    <section className="filter-bar"><label>月份<select value={month} onChange={(event) => setMonth(Number(event.target.value))}>{Array.from({length:12},(_,i)=>i+1).map((m)=><option key={m} value={m}>{m}月</option>)}</select></label><span className="filter-note">实际开店数只认正式开业日期</span></section>
    <section className="metric-grid"><MetricCard label="年度已识别计划" value={`${brand.annual_planned_count} 家`} note="现有可确认单店计划"/><MetricCard label={`${month}月计划`} value={`${monthPlanned} 家`} note="独立月度计划" tone="teal"/><MetricCard label={`截至${month}月累计计划`} value={`${cumulative} 家`} note="不使用年度目标×时间进度" tone="amber"/><MetricCard label="实际开店" value="待确认" note="缺少正式开业日期"/></section>
    <section className="quality-note new-store-note"><AlertTriangle size={17}/><span>{phase5.opening_rule}</span></section>
    <section className="table-panel"><div className="table-heading"><div><h2>新店计划与经营表现</h2><p>销售、回款、经营利润沿用标准事实表；没有来源的指标保持为空。</p></div></div><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>店铺</TableHead><TableHead>渠道</TableHead><TableHead>计划月</TableHead><TableHead className="text-right">销售目标 / 实际</TableHead><TableHead className="text-right">回款目标 / 实际</TableHead><TableHead className="text-right">利润目标 / 实际</TableHead><TableHead>状态</TableHead></TableRow></TableHeader><TableBody>{brand.stores.map((row:any)=><TableRow key={row.store_id}><TableCell><b>{row.name}</b><div className="source-mini">{row.source.workbook} · {row.source.sheet}</div></TableCell><TableCell>{row.channel_name}</TableCell><TableCell>{row.planned_month}月<div className="source-mini">{row.plan_basis}</div></TableCell><TableCell className="text-right">{currency.format(row.annual.sales_target)} / {row.annual.sales_actual==null?'—':currency.format(row.annual.sales_actual)}</TableCell><TableCell className="text-right">{row.annual.collection_target==null?'—':currency.format(row.annual.collection_target)} / {row.annual.collection_actual==null?'—':currency.format(row.annual.collection_actual)}</TableCell><TableCell className="text-right">{currency.format(row.annual.profit_target)} / {row.annual.profit_actual==null?'—':currency.format(row.annual.profit_actual)}</TableCell><TableCell><Badge variant="outline" className="status-risk">{row.opening_status}</Badge><div className="source-mini">{row.business_state}</div></TableCell></TableRow>)}</TableBody></Table></div></section>
  </>;
}

function Homepage({ brandId, setModule, setMonth, openExceptions }: { brandId: string; setModule: (value: ModuleId) => void; setMonth: (value: number) => void; openExceptions: (categoryId: string) => void }) {
  const [trendMetric, setTrendMetric] = useState<'sales' | 'collection' | 'operating_profit'>('sales');
  const brand: any = phase6.brands.find((item: any) => item.id === brandId);
  const cards = brand.cards;
  const trends = brand.trends[trendMetric];
  const maxTrend = Math.max(...trends.flatMap((point: any) => [point.target ?? 0, point.actual ?? 0]), 1);
  const trendNames = { sales: '销售', collection: '回款', operating_profit: '经营利润' };
  const statusText: Record<string, string> = { GREEN: '进度正常', YELLOW: '黄色预警', RED: '红色预警', MISSING: '数据待补' };
  const statusStyle: Record<string, string> = { GREEN: 'status-good', YELLOW: 'status-risk', RED: 'status-danger', MISSING: 'status-muted' };
  const openModule = (module: 'sales' | 'collection' | 'operating_profit' | 'new_stores', month = 7) => { setMonth(month); setModule(module); };
  const exceptionBrand: any = phase7.brands.find((item: any) => item.id === brandId);
  return <>
    <header className="dashboard-header"><div><div className="eyebrow"><span /> 总经理经营工作台 · V1</div><h1>经营首页</h1><p>{brand.name} · 2026年度经营总览</p></div><div className="source-pill"><Database size={16} /> 数据截至 <span>{phase6.actual_cutoff}</span></div></header>
    <section className="home-card-grid">
      <button className="home-kpi" onClick={() => openModule('sales')}><div className="home-kpi-title"><Landmark size={17}/>销售</div><strong>{compactCurrency.format(cards.sales.actual)}</strong><p>年度目标 {compactCurrency.format(cards.sales.target)}</p><div className="home-rate"><span>完成率 {percent.format(cards.sales.completion_rate)}</span><span>时间进度 {percent.format(phase6.time_progress)}</span></div><small>目标差额 {currency.format(cards.sales.gap)} · 同比暂无</small><em>{cards.sales.coverage}</em></button>
      <button className="home-kpi" onClick={() => openModule('collection')}><div className="home-kpi-title"><Banknote size={17}/>回款</div><strong>{compactCurrency.format(cards.collection.actual)}</strong><p>年度目标 {compactCurrency.format(cards.collection.target)}</p><div className="home-rate"><span>完成率 {percent.format(cards.collection.completion_rate)}</span><span>时间进度 {percent.format(phase6.time_progress)}</span></div><small>目标差额 {currency.format(cards.collection.gap)}</small><em>年度卡片采用财务汇总口径</em></button>
      <button className="home-kpi" onClick={() => openModule('operating_profit')}><div className="home-kpi-title"><TrendingUp size={17}/>经营利润</div><strong>{compactCurrency.format(cards.operating_profit.actual)}</strong><p>年度目标 {compactCurrency.format(cards.operating_profit.target)}</p><div className="home-rate"><span>完成率 {percent.format(cards.operating_profit.completion_rate)}</span><span>利润率 暂不计算</span></div><small>同比、环比暂无同口径依据</small><em>{cards.operating_profit.margin_note}</em></button>
      <button className="home-kpi" onClick={() => openModule('new_stores')}><div className="home-kpi-title"><Store size={17}/>新店</div><strong>{cards.new_stores.annual_planned_count} 家</strong><p>截至7月计划累计 {cards.new_stores.planned_cumulative} 家</p><div className="home-rate"><span>实际累计 待确认</span><span>差额 —</span></div><small>完成情况待正式开业日期</small><em>不以经营数据倒推开店数量</em></button>
    </section>
    <section className="trend-panel home-trend"><div className="table-heading"><div><h2>1—12月目标与实际趋势</h2><p>{trendMetric === 'collection' ? cards.collection.trend_coverage : '点击月份进入对应经营模块；8—12月仅展示目标。'}</p></div><div className="segmented">{Object.entries(trendNames).map(([id,name]) => <button key={id} className={trendMetric === id ? 'active' : ''} onClick={() => setTrendMetric(id as any)}>{name}</button>)}</div></div><div className="trend-chart">{trends.map((point: any) => <button key={point.month} className="trend-month" onClick={() => openModule(trendMetric, point.month)}><span className="bar-pair"><i className="target-bar" style={{height:`${Math.max((point.target ?? 0)/maxTrend*120,2)}px`}}/><i className="actual-bar" style={{height:`${Math.max((point.actual ?? 0)/maxTrend*120,point.actual == null?0:2)}px`}}/></span><b>{point.month}月</b></button>)}</div><div className="home-trend-foot"><span><i className="bar-key target"/>目标</span><span><i className="bar-key actual"/>实际</span><b>{trendNames[trendMetric]} · 当前年度</b></div></section>
    <section className="table-panel"><div className="table-heading"><div><h2>渠道经营矩阵</h2><p>仅展示当前品牌实际存在的渠道；状态阈值来自系统配置。</p></div></div><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>渠道</TableHead><TableHead className="text-right">7月销售完成率</TableHead><TableHead className="text-right">年度回款完成率</TableHead><TableHead className="text-right">年度经营利润</TableHead><TableHead className="text-right">同比</TableHead><TableHead className="text-right">销售环比</TableHead><TableHead>状态</TableHead></TableRow></TableHeader><TableBody>{brand.channel_matrix.map((row:any) => <TableRow key={row.channel_id}><TableCell><div className="channel-name"><span>{row.name.slice(0,1)}</span><div><b>{row.name}</b><small>{row.status_reason}</small></div></div></TableCell><TableCell className="text-right">{row.sales_completion_rate == null ? '—' : percent.format(row.sales_completion_rate)}</TableCell><TableCell className="text-right">{row.collection_completion_rate == null ? '—' : percent.format(row.collection_completion_rate)}</TableCell><TableCell className="text-right">{row.operating_profit == null ? '—' : currency.format(row.operating_profit)}</TableCell><TableCell className="text-right muted-value">暂无</TableCell><TableCell className="text-right">{row.mom == null ? '—' : percent.format(row.mom)}</TableCell><TableCell><Badge variant="outline" className={statusStyle[row.status]}>{statusText[row.status]}</Badge></TableCell></TableRow>)}</TableBody></Table></div></section>
    <section className="table-panel"><div className="table-heading"><div><h2>重点经营异常</h2><p>按固定规则生成，点击进入异常中心。</p></div><button className="text-link" onClick={() => openExceptions('sales')}>查看全部</button></div><div className="exception-summary">{Object.entries(exceptionBrand.categories).map(([id,category]:any) => <button key={id} onClick={() => openExceptions(id)}><span>{category.name}</span><strong>{category.rows === null ? '待接入' : `${category.rows.length} 项`}</strong><small>{category.rows?.[0]?.name ?? (id === 'product' ? category.status : '当前无可计算异常')}</small></button>)}</div></section>
    <section className="quality-note new-store-note"><AlertTriangle size={17}/><span>商品经营数据待接入；缺少实际值的门店不会按 0 计算完成率。</span></section>
  </>;
}

function ExceptionCenter({ brandId, onDrill, initialCategory }: { brandId: string; onDrill: (categoryId: string, row: any) => void; initialCategory: string }) {
  const [categoryId, setCategoryId] = useState(initialCategory);
  const brand: any = phase7.brands.find((item: any) => item.id === brandId);
  const category: any = brand.categories[categoryId];
  const categoryNames: Record<string,string> = { sales:'销售异常', collection:'回款异常', operating_profit:'利润异常', new_stores:'新店异常', product:'商品异常' };
  const extra = (row:any) => categoryId === 'sales' ? `落后 ${percent.format(row.lag_points)}` : categoryId === 'collection' ? `差额 ${currency.format(row.gap)}` : categoryId === 'operating_profit' ? row.loss_state : `阈值 ${percent.format(row.threshold)}`;
  return <>
    <header className="dashboard-header"><div><div className="eyebrow"><span /> 总经理经营工作台 · V1</div><h1>经营异常中心</h1><p>{brand.name} · 2026年7月 · 固定规则 Top 5</p></div><div className="source-pill"><Database size={16}/> 数据截至 <span>{phase7.actual_cutoff}</span></div></header>
    <section className="exception-tabs">{Object.entries(categoryNames).map(([id,name]) => { const value:any=brand.categories[id]; return <button key={id} className={categoryId===id?'active':''} onClick={()=>setCategoryId(id)}><span>{name}</span><b>{value.rows===null?'待接入':value.rows.length}</b></button>})}</section>
    <section className="table-panel exception-panel"><div className="table-heading"><div><h2>{category.name} Top 5</h2><p>{(phase7.rules as any)[categoryId] ?? category.status}</p></div></div>{category.rows === null ? <div className="empty-state"><AlertOctagon size={28}/><b>{category.status}</b><span>当前不展示模拟数字。</span></div> : category.rows.length === 0 ? <div className="empty-state"><AlertTriangle size={28}/><b>当前无可计算异常</b><span>{categoryId === 'new_stores' && category.unavailable_actual_count ? `${category.unavailable_actual_count} 家新店缺少实际销售，未按 0% 计入。` : '现有标准数据没有满足规则的记录。'}</span></div> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>对象</TableHead><TableHead>渠道</TableHead><TableHead className="text-right">目标</TableHead><TableHead className="text-right">实际</TableHead><TableHead className="text-right">完成率</TableHead><TableHead>补充信息</TableHead><TableHead>操作</TableHead></TableRow></TableHeader><TableBody>{category.rows.map((row:any)=><TableRow key={row.store_id ?? row.channel_id}><TableCell><b>{row.name}</b><div className="source-mini">{row.store_id ? '门店 / 经营单元' : '渠道'}</div></TableCell><TableCell>{row.channel_name ?? row.name}</TableCell><TableCell className="text-right">{row.target==null?'—':currency.format(row.target)}</TableCell><TableCell className={`text-right ${row.actual<0?'text-red-700':''}`}>{row.actual==null?'—':currency.format(row.actual)}</TableCell><TableCell className="text-right">{row.completion_rate==null?'—':percent.format(row.completion_rate)}</TableCell><TableCell><Badge variant="outline" className={row.actual<0?'status-danger':'status-risk'}>{extra(row)}</Badge></TableCell><TableCell><button className="drill-button" onClick={()=>onDrill(categoryId,row)}>定向下钻</button></TableCell></TableRow>)}</TableBody></Table></div>}</section>
  </>;
}

export default function Home() {
  const [module, setModule] = useState<ModuleId>('home');
  const [brandId, setBrandId] = useState('WOMEN');
  const [month, setMonth] = useState(7);
  const [focus, setFocus] = useState<DrillFocus>(null);
  const [exceptionCategory, setExceptionCategory] = useState('sales');
  const modules = [{id:'home',name:'经营首页',icon:<LayoutDashboard size={15}/>},{id:'exceptions',name:'异常中心',icon:<AlertOctagon size={15}/>},{id:'sales',name:'销售',icon:<Landmark size={15}/>},{id:'collection',name:'回款',icon:<Banknote size={15}/>},{id:'operating_profit',name:'经营利润',icon:<TrendingUp size={15}/>},{id:'new_stores',name:'新开店铺',icon:<Store size={15}/>}];
  const onDrill = (categoryId:string,row:any) => { setFocus({categoryId,row}); setBrandId(row.drilldown.brand_id); setMonth(row.drilldown.month); setModule(row.drilldown.module); };
  const openExceptions = (categoryId:string) => { setExceptionCategory(categoryId); setModule('exceptions'); };
  const content = module === 'home' ? <Homepage brandId={brandId} setModule={setModule} setMonth={setMonth} openExceptions={openExceptions}/> : module === 'exceptions' ? <ExceptionCenter key={exceptionCategory} brandId={brandId} onDrill={onDrill} initialCategory={exceptionCategory}/> : module === 'sales' ? <SalesSummary brandId={brandId}/> : module === 'new_stores' ? <NewStoreModule brandId={brandId} month={month} setMonth={setMonth}/> : <FinanceModule metric={module} brandId={brandId} month={month} setMonth={setMonth}/>;
  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto w-full max-w-[1480px] px-4 py-5 sm:px-7 lg:px-10"><nav className="workbench-nav"><div className="segmented">{modules.map((item: any) => <button key={item.id} className={module === item.id ? 'active' : ''} onClick={() => {setFocus(null);setModule(item.id)}}>{item.icon}{item.name}</button>)}</div><div className="segmented">{phase4.collection.brands.map((item: any) => <button key={item.id} className={brandId === item.id ? 'active' : ''} onClick={() => {setFocus(null);setBrandId(item.id)}}>{item.name}</button>)}</div></nav>{focus && module !== 'exceptions' && <section className="drill-context"><AlertOctagon size={18}/><div><b>已定向到：{focus.row.name}</b><span>{focus.row.channel_name ?? focus.row.name} · 2026年{focus.row.drilldown.month}月 · {focus.categoryId==='collection'?'渠道':'门店'}筛选已保留</span></div><button onClick={()=>setFocus(null)}>清除筛选</button></section>}{content}<footer><span>新店实际数量只认正式开业日期 · 合并渠道不强拆</span><span>数据截至 2026-07-31 · 来源可追溯到单元格</span></footer></div></main>;
}
