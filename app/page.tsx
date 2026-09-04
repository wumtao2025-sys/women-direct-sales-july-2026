'use client';

import { ArrowDownRight, ArrowUpRight, Database, Store, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import phase2Data from './phase2-data.json';

const stores = phase2Data.stores.map((store) => ({
  name: store.store_name,
  target: store.target,
  actual: store.actual,
  targetSource: store.target_source.replace('26年 直营预算.xls / ', ''),
  actualSource: store.actual_source.replace('26年 直营预算.xls / ', ''),
}));
const target = phase2Data.target;
const actual = phase2Data.actual;
const gap = target - actual;
const completion = actual / target;

const currency = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 });
const compactCurrency = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', notation: 'compact', maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat('zh-CN', { style: 'percent', maximumFractionDigits: 1 });

function MetricCard({ label, value, note, tone = 'ink' }: { label: string; value: string; note: string; tone?: 'ink' | 'teal' | 'amber' }) {
  return <section className={`metric-card metric-${tone}`}><p>{label}</p><strong>{value}</strong><span>{note}</span></section>;
}

export default function Home() {
  const achieved = stores.filter((store) => store.actual >= store.target).length;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-[1480px] px-4 py-5 sm:px-7 lg:px-10">
        <header className="dashboard-header">
          <div>
            <div className="eyebrow"><span /> 总经理经营工作台 · V1</div>
            <h1>女装销售经营</h1>
            <p>直营 · 2026年7月 · 完整月份</p>
          </div>
          <div className="source-pill"><Database size={16} /> 数据已核对 <span>11 家门店</span></div>
        </header>

        <section className="metric-grid" aria-label="销售指标概览">
          <MetricCard label="销售目标" value={compactCurrency.format(target)} note="来源：月汇总 J3" />
          <MetricCard label="销售实际" value={compactCurrency.format(actual)} note="来源：月汇总 J46" tone="teal" />
          <MetricCard label="目标完成率" value={percent.format(completion)} note={`较目标差 ${compactCurrency.format(gap)}`} tone="amber" />
          <MetricCard label="达成门店" value={`${achieved} / ${stores.length}`} note="达成率 ≥ 100%" />
        </section>

        <section className="performance-band">
          <div className="performance-copy"><div className="icon-box"><Target size={21} /></div><div><p>渠道整体进度</p><strong>{percent.format(completion)}</strong></div></div>
          <Progress value={completion * 100} className="h-2.5 flex-1 bg-slate-200 [&_[data-slot=progress-indicator]]:bg-teal-500" />
          <div className="performance-gap"><ArrowDownRight size={17} /> 缺口 {currency.format(gap)}</div>
        </section>

        <section className="table-panel">
          <div className="table-heading">
            <div><h2>门店完成情况</h2><p>按完成率从低到高排列，点击门店可查看来源。</p></div>
            <div className="legend"><span className="dot dot-risk" /> 未达成 <span className="dot dot-good" /> 已达成</div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow className="hover:bg-transparent"><TableHead className="w-[230px]">门店</TableHead><TableHead className="text-right">销售目标</TableHead><TableHead className="text-right">销售实际</TableHead><TableHead className="min-w-[210px]">完成进度</TableHead><TableHead className="text-right">目标差额</TableHead><TableHead className="text-right">状态</TableHead></TableRow></TableHeader>
              <TableBody>
                {stores.map((store) => {
                  const rate = store.actual / store.target;
                  const storeGap = store.target - store.actual;
                  const isGood = rate >= 1;
                  return (
                    <Sheet key={store.name}>
                      <SheetTrigger nativeButton={false} render={<TableRow className="cursor-pointer transition-colors hover:bg-slate-50/90 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-teal-600" tabIndex={0} />}>
                        <TableCell><div className="store-name"><span className="store-mark"><Store size={15} /></span>{store.name}</div></TableCell>
                        <TableCell className="text-right tabular-nums">{currency.format(store.target)}</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">{currency.format(store.actual)}</TableCell>
                        <TableCell><div className="progress-cell"><Progress value={Math.min(rate * 100, 100)} className={`h-2 flex-1 bg-slate-200 ${isGood ? '[&_[data-slot=progress-indicator]]:bg-teal-500' : '[&_[data-slot=progress-indicator]]:bg-amber-500'}`} /><strong>{percent.format(rate)}</strong></div></TableCell>
                        <TableCell className={`text-right font-medium tabular-nums ${isGood ? 'text-teal-700' : 'text-amber-700'}`}>{isGood ? '+' : '−'}{currency.format(Math.abs(storeGap))}</TableCell>
                        <TableCell className="text-right"><Badge variant="outline" className={isGood ? 'status-good' : 'status-risk'}>{isGood ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{isGood ? '已达成' : '未达成'}</Badge></TableCell>
                      </SheetTrigger>
                      <SheetContent className="w-[92vw] sm:max-w-[430px]">
                        <SheetHeader className="border-b px-6 py-6"><SheetTitle className="text-xl">{store.name}</SheetTitle><SheetDescription>女装 · 直营 · 2026年7月</SheetDescription></SheetHeader>
                        <div className="space-y-6 overflow-y-auto px-6 py-4">
                          <div className="detail-rate"><span>目标完成率</span><strong>{percent.format(rate)}</strong><Progress value={Math.min(rate * 100, 100)} className={`mt-4 h-2.5 bg-slate-200 ${isGood ? '[&_[data-slot=progress-indicator]]:bg-teal-500' : '[&_[data-slot=progress-indicator]]:bg-amber-500'}`} /></div>
                          <dl className="detail-list"><div><dt>销售目标</dt><dd>{currency.format(store.target)}</dd></div><div><dt>销售实际</dt><dd>{currency.format(store.actual)}</dd></div><div><dt>目标差额</dt><dd>{isGood ? '+' : '−'}{currency.format(Math.abs(storeGap))}</dd></div></dl>
                          <div className="source-card"><p><Database size={15} /> 原始数据来源</p><dl><div><dt>工作簿</dt><dd>26年 直营预算.xls</dd></div><div><dt>目标单元格</dt><dd>{store.targetSource}</dd></div><div><dt>实际单元格</dt><dd>{store.actualSource}</dd></div></dl></div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </section>

        <footer><span>门店合计与渠道汇总差异：目标 ¥0 · 实际 ¥0</span><span>数据范围不含奥莱源表</span></footer>
      </div>
    </main>
  );
}
