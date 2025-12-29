'use client';

// import dynamic from 'next/dynamic';

// const PrivyWrapper = dynamic(
//   () => import('@/components/providers/PrivyWrapper'),
//   { ssr: false }
// );

export default function ClientProviders({ children }: { children: React.ReactNode }) {
    // Temporary: Disable Privy for Production Build due to Next.js 16 / Webpack compatibility issues
    // with @solana dependencies. Auth works in `npm run dev`.
    return (
        <>
            {children}
        </>
    );

    /* 
    return (
      <PrivyWrapper>
        {children}
      </PrivyWrapper>
    );
    */
}
