'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Database, Layers3, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import data from './phase3-data.json';

const currency = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 });
const compactCurrency = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', notation: 'compact', maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat('zh-CN', { style: 'percent', maximumFractionDigits: 1 });

type Brand = (typeof data.brands)[number];
type Channel = Brand['channels'][number];

function MetricCard({ label, value, note, tone = 'ink' }: { label: string; value: string; note: string; tone?: 'ink' | 'teal' | 'amber' }) {
  return <section className={`metric-card metric-${tone}`}><p>{label}</p><strong>{value}</strong><span>{note}</span></section>;
}

function StateBadge({ channel, rate }: { channel: Channel; rate: number | null }) {
  if (channel.data_state === 'NO_DATA') return <Badge variant="outline" className="status-muted">暂无数据</Badge>;
  if (channel.data_state === 'TARGET_ONLY') return <Badge variant="outline" className="status-info">仅有目标</Badge>;
  if (channel.data_state === 'PARTIAL_TARGET') return <Badge variant="outline" className="status-risk"><AlertTriangle size={13} />口径不完整</Badge>;
  const good = rate !== null && rate >= 1;
  return <Badge variant="outline" className={good ? 'status-good' : 'status-risk'}>{good ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{good ? '已达成' : '未达成'}</Badge>;
}

export default function Home() {
  const [brandId, setBrandId] = useState('WOMEN');
  const [month, setMonth] = useState(7);
  const brand = data.brands.find((item) => item.id === brandId) ?? data.brands[0];
  const rows = useMemo(() => brand.channels.map((channel) => ({ channel, point: channel.months.find((item) => item.month === month) ?? null })), [brand, month]);
  const comparable = rows.filter(({ channel, point }) => channel.data_state === 'COMPLETE' && point?.target != null && point?.actual != null);
  const target = comparable.reduce((sum, item) => sum + (item.point?.target ?? 0), 0);
  const actual = comparable.reduce((sum, item) => sum + (item.point?.actual ?? 0), 0);
  const completion = target ? actual / target : 0;
  const achieved = comparable.filter((item) => (item.point?.completion_rate ?? 0) >= 1).length;
  const maxTrend = Math.max(...brand.channels.flatMap((channel) => channel.months.slice(0, 7).flatMap((point) => [point.target ?? 0, point.actual ?? 0])), 1);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-[1480px] px-4 py-5 sm:px-7 lg:px-10">
        <header className="dashboard-header">
          <div><div className="eyebrow"><span /> 总经理经营工作台 · V1</div><h1>销售全渠道</h1><p>{brand.name} · 2026年{month}月 · 销售收入</p></div>
          <div className="source-pill"><Database size={16} /> 数据截至 <span>2026-07-31</span></div>
        </header>

        <section className="filter-bar" aria-label="筛选条件">
          <div className="segmented">{data.brands.map((item) => <button key={item.id} className={item.id === brandId ? 'active' : ''} onClick={() => setBrandId(item.id)}>{item.name}</button>)}</div>
          <label>月份<select value={month} onChange={(event) => setMonth(Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => index + 1).map((item) => <option key={item} value={item}>{item}月{item > 7 ? '（仅目标）' : ''}</option>)}</select></label>
          <span className="filter-note"><Layers3 size={15} /> 完整可比口径：{comparable.length} 个渠道</span>
        </section>

        <section className="metric-grid" aria-label="销售指标概览">
          <MetricCard label="可比渠道目标" value={compactCurrency.format(target)} note="仅汇总目标与实际覆盖一致的渠道" />
          <MetricCard label="可比渠道实际" value={compactCurrency.format(actual)} note={`截至 ${data.actual_cutoff}`} tone="teal" />
          <MetricCard label="目标完成率" value={target ? percent.format(completion) : '—'} note={target ? `目标差额 ${compactCurrency.format(target - actual)}` : '所选月份暂无实际'} tone="amber" />
          <MetricCard label="达成渠道" value={`${achieved} / ${comparable.length}`} note="完成率 ≥ 100%" />
        </section>

        <section className="performance-band">
          <div className="performance-copy"><div className="icon-box"><Target size={21} /></div><div><p>可比渠道整体进度</p><strong>{target ? percent.format(completion) : '—'}</strong></div></div>
          <Progress value={Math.min(completion * 100, 100)} className="h-2.5 flex-1 bg-slate-600 [&_[data-slot=progress-indicator]]:bg-teal-400" />
          <div className="performance-gap">{target ? <><ArrowDownRight size={17} /> 差额 {currency.format(target - actual)}</> : '等待实际数据'}</div>
        </section>

        <section className="trend-panel">
          <div className="table-heading"><div><h2>月度销售走势</h2><p>深色为目标，绿色为实际；点击月份可切换下方明细。</p></div><div className="legend"><span className="bar-key target" />目标 <span className="bar-key actual" />实际</div></div>
          <div className="trend-chart">{Array.from({ length: 12 }, (_, index) => index + 1).map((m) => {
            const points = brand.channels.filter((channel) => channel.data_state === 'COMPLETE').map((channel) => channel.months.find((item) => item.month === m));
            const monthTarget = points.reduce((sum, point) => sum + (point?.target ?? 0), 0);
            const monthActual = points.reduce((sum, point) => sum + (point?.actual ?? 0), 0);
            return <button key={m} className={`trend-month ${m === month ? 'selected' : ''}`} onClick={() => setMonth(m)} title={`${m}月 目标 ${currency.format(monthTarget)} / 实际 ${monthActual ? currency.format(monthActual) : '暂无'}`}><span className="bar-pair"><i className="target-bar" style={{ height: `${Math.max(monthTarget / maxTrend * 100, 2)}%` }} /><i className="actual-bar" style={{ height: `${monthActual ? Math.max(monthActual / maxTrend * 100, 2) : 0}%` }} /></span><b>{m}月</b></button>;
          })}</div>
        </section>

        <section className="table-panel">
          <div className="table-heading"><div><h2>渠道完成情况</h2><p>9 个标准渠道完整展示；缺数与口径问题不做隐藏。</p></div><div className="legend"><span className="dot dot-risk" />需关注 <span className="dot dot-good" />已达成</div></div>
          <div className="overflow-x-auto"><Table><TableHeader><TableRow className="hover:bg-transparent"><TableHead>渠道</TableHead><TableHead className="text-right">销售目标</TableHead><TableHead className="text-right">销售实际</TableHead><TableHead className="min-w-[210px]">完成进度</TableHead><TableHead className="text-right">目标差额</TableHead><TableHead className="text-right">数据状态</TableHead></TableRow></TableHeader><TableBody>
            {rows.map(({ channel, point }) => {
              const rate = point?.completion_rate ?? null; const good = rate !== null && rate >= 1; const gap = point?.gap ?? null;
              return <Sheet key={channel.id}><SheetTrigger nativeButton={false} render={<TableRow className="cursor-pointer transition-colors hover:bg-slate-50/90" />}>
                <TableCell><div className="channel-name"><span>{channel.name.slice(0, 1)}</span><div><b>{channel.name}</b><small>{channel.note}</small></div></div></TableCell>
                <TableCell className="text-right tabular-nums">{point?.target == null ? '—' : currency.format(point.target)}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{point?.actual == null ? '—' : currency.format(point.actual)}</TableCell>
                <TableCell>{rate === null ? <span className="muted-value">不可计算</span> : <div className="progress-cell"><Progress value={Math.min(rate * 100, 100)} className={`h-2 flex-1 bg-slate-200 ${good ? '[&_[data-slot=progress-indicator]]:bg-teal-500' : '[&_[data-slot=progress-indicator]]:bg-amber-500'}`} /><strong>{percent.format(rate)}</strong></div>}</TableCell>
                <TableCell className={`text-right font-medium tabular-nums ${gap === null ? '' : good ? 'text-teal-700' : 'text-amber-700'}`}>{gap === null ? '—' : `${good ? '+' : '−'}${currency.format(Math.abs(gap))}`}</TableCell>
                <TableCell className="text-right"><StateBadge channel={channel} rate={rate} /></TableCell>
              </SheetTrigger><SheetContent className="w-[94vw] sm:max-w-[520px]"><SheetHeader className="border-b px-6 py-6"><SheetTitle className="text-xl">{brand.name} · {channel.name}</SheetTitle><SheetDescription>2026年{month}月销售口径与来源</SheetDescription></SheetHeader><div className="space-y-5 overflow-y-auto px-6 py-4"><div className="detail-rate"><span>目标完成率</span><strong>{rate === null ? '不可计算' : percent.format(rate)}</strong>{rate !== null && <Progress value={Math.min(rate * 100, 100)} className="mt-4 h-2.5 bg-slate-200 [&_[data-slot=progress-indicator]]:bg-teal-500" />}</div><dl className="detail-list"><div><dt>销售目标</dt><dd>{point?.target == null ? '暂无' : currency.format(point.target)}</dd></div><div><dt>销售实际</dt><dd>{point?.actual == null ? '暂无' : currency.format(point.actual)}</dd></div><div><dt>数据状态</dt><dd>{channel.data_state_name}</dd></div></dl><div className="source-card"><p><Database size={15} /> 原始数据来源</p>{point && [...point.target_sources, ...point.actual_sources].length ? <dl>{[...point.target_sources, ...point.actual_sources].map((source, index) => <div key={`${source.workbook}-${source.cell}-${index}`}><dt>{source.label}</dt><dd>{source.workbook}<br />{source.sheet}!{source.cell}</dd></div>)}</dl> : <p className="source-empty">{channel.note}</p>}</div>{channel.level1_comparison && <div className="quality-note"><AlertTriangle size={16} />童装年度预算为主口径；渠道明细预算存在差异，已保留在审计记录中。</div>}</div></SheetContent></Sheet>;
            })}
          </TableBody></Table></div>
        </section>

        <footer><span>奥莱→直营；有赞、视频号→微信私域</span><span>加盟实际不以出货/回款替代 · 数据截至 2026-07-31</span></footer>
      </div>
    </main>
  );
}
