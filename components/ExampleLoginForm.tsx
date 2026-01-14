'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginFormSchema, LoginFormData } from '@/lib/validations';
import { FormInput } from '@/components/ui/FormInput';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

interface ExampleLoginFormProps {
  onSubmit?: (data: LoginFormData) => void | Promise<void>;
  className?: string;
}

export function ExampleLoginForm({ onSubmit, className }: ExampleLoginFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);

  const {
    control,
    handleSubmit,
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleFormSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      if (onSubmit) {
        await onSubmit(data);
      }
      setSubmitSuccess(true);
      reset();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>登录</CardTitle>
        <CardDescription>
          输入您的邮箱和密码登录账户
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <CardContent className="space-y-4">
          <FormInput<LoginFormData>
            name="email"
            label="邮箱地址"
            type="email"
            placeholder="请输入邮箱"
            control={control}
            disabled={isSubmitting}
            autoComplete="email"
          />
          <FormInput<LoginFormData>
            name="password"
            label="密码"
            type="password"
            placeholder="请输入密码"
            control={control}
            disabled={isSubmitting}
            autoComplete="current-password"
          />
          {submitError && (
            <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md" role="alert">
              {submitError}
            </div>
          )}
          {submitSuccess && (
            <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-md" role="status">
              登录成功！
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? '登录中...' : '登录'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

ExampleLoginForm.displayName = 'ExampleLoginForm';
