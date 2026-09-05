'use client';

import { useState } from 'react';
import { AlertTriangle, ArrowDownRight, Banknote, Database, Landmark, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import salesData from './phase3-data.json';
import phase4 from './phase4-data.json';

const currency = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 });
const compactCurrency = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', notation: 'compact', maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat('zh-CN', { style: 'percent', maximumFractionDigits: 1 });

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

export default function Home() {
  const [module, setModule] = useState<'sales' | 'collection' | 'operating_profit'>('operating_profit');
  const [brandId, setBrandId] = useState('WOMEN');
  const [month, setMonth] = useState(7);
  const modules = [{id:'sales',name:'销售',icon:<Landmark size={15}/>},{id:'collection',name:'回款',icon:<Banknote size={15}/>},{id:'operating_profit',name:'经营利润',icon:<TrendingUp size={15}/>}];
  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto w-full max-w-[1480px] px-4 py-5 sm:px-7 lg:px-10"><nav className="workbench-nav"><div className="segmented">{modules.map((item: any) => <button key={item.id} className={module === item.id ? 'active' : ''} onClick={() => setModule(item.id)}>{item.icon}{item.name}</button>)}</div><div className="segmented">{phase4.collection.brands.map((item: any) => <button key={item.id} className={brandId === item.id ? 'active' : ''} onClick={() => setBrandId(item.id)}>{item.name}</button>)}</div></nav>{module === 'sales' ? <SalesSummary brandId={brandId}/> : <FinanceModule metric={module} brandId={brandId} month={month} setMonth={setMonth}/>}<footer><span>经营利润非毛利、非净利润 · 合并渠道不强拆</span><span>数据截至 2026-07-31 · 来源可追溯到单元格</span></footer></div></main>;
}
