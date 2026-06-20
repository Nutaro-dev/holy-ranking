import { Suspense } from 'react';
import AuthForm from './AuthForm';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="glass-card p-8 animate-pulse h-64 max-w-md mx-auto" />}>
      <AuthForm defaultMode="signin" />
    </Suspense>
  );
}
