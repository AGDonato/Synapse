import React, { Suspense } from 'react';
import Loading from '../../shared/components/ui/Loading';

// Wrapper para Suspense
export const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<Loading />}>{children}</Suspense>
);
