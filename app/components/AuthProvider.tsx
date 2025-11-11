'use client';

import { SessionProvider } from "next-auth/react";

export default function AuthProvider({ children }: {
    children: React.ReactNode
}) {
    // return <SessionProvider basePath="/relatorios-agrosync/api/auth">{children}</SessionProvider> // --- PRODUCTION ---
    return <SessionProvider>{children}</SessionProvider>
}