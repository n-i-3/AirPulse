'use client';

import { PrivyProvider } from '@privy-io/react-auth';

export default function PrivyWrapper({ children }: { children: React.ReactNode }) {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';

    return (
        <PrivyProvider
            appId={appId}
            config={{
                loginMethods: ['email', 'wallet'],
                appearance: {
                    theme: 'light',
                    accentColor: '#676FFF',
                },
                embeddedWallets: {
                    createOnLogin: 'users-without-wallets',
                } as any, // Temporary cast to bypass strict type check if schema mismatch persists
            }}
        >
            {children}
        </PrivyProvider>
    );
}
