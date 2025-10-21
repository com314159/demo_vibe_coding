'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getBrowserClient } from '../../../lib/supabaseClient';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';

const loginSchema = z.object({
  email: z.string().email({ message: '请输入有效的公司邮箱' }),
  password: z.string().min(6, { message: '密码至少 6 位' })
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const supabase = getBrowserClient();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (values: LoginForm) => {
    setPending(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password
    });

    if (signInError) {
      setError(signInError.message);
      setPending(false);
      return;
    }

    router.replace('/assets');
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">登录 IT 资产管理系统</h1>
        <p className="text-sm text-muted-foreground">
          使用公司邮箱登录，完成资产台账与流程管理
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">邮箱</Label>
          <Input id="email" placeholder="you@company.com" autoComplete="email" {...register('email')} />
          {errors.email ? (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">密码</Label>
          <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
          {errors.password ? (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? '登录中…' : '登录'}
      </Button>
      <p className="text-xs text-muted-foreground">
        TODO: 支持单点登录 / OTP。当前为简化开发使用的邮箱密码方式。
      </p>
    </form>
  );
}
