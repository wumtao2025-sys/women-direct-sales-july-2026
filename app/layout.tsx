import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '女装销售经营｜总经理经营工作台',
  description: '女装直营销售目标、实际与门店达成情况。',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
