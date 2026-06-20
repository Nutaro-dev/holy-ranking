import { Suspense } from 'react';
import AuthForm from '@/app/login/AuthForm';

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="glass-card p-8 animate-pulse h-64 max-w-md mx-auto" />}>
      <AuthForm defaultMode="signup" />
    </Suspense>
  );
}
