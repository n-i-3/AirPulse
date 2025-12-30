'use client';

import dynamic from 'next/dynamic';

const PrivyWrapper = dynamic(
  () => import('@/components/providers/PrivyWrapper'),
  { ssr: false }
);

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <PrivyWrapper>
      {children}
    </PrivyWrapper>
  );
}
