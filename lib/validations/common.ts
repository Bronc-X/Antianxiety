import { z } from 'zod';

// Email validation schema
export const emailSchema = z
  .string()
  .min(1, '邮箱地址为必填项')
  .email('请输入有效的邮箱地址');

// Password validation schema
export const passwordSchema = z
  .string()
  .min(8, '密码至少需要8个字符')
  .regex(/[A-Z]/, '密码需要包含至少一个大写字母')
  .regex(/[a-z]/, '密码需要包含至少一个小写字母')
  .regex(/[0-9]/, '密码需要包含至少一个数字');

// Simple password schema (less strict)
export const simplePasswordSchema = z
  .string()
  .min(8, '密码至少需要8个字符');

// Required string schema
export const requiredSchema = z
  .string()
  .min(1, '此字段为必填项');

// Optional string schema
export const optionalSchema = z
  .string()
  .optional();

// Phone number schema (Chinese format)
export const phoneSchema = z
  .string()
  .min(1, '手机号码为必填项')
  .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码');

// Username schema
export const usernameSchema = z
  .string()
  .min(3, '用户名至少需要3个字符')
  .max(20, '用户名最多20个字符')
  .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线');

// URL schema
export const urlSchema = z
  .string()
  .url('请输入有效的URL地址')
  .optional()
  .or(z.literal(''));

// Number range schema factory
export const numberRangeSchema = (min: number, max: number, fieldName: string = '数值') =>
  z
    .number()
    .min(min, `${fieldName}不能小于${min}`)
    .max(max, `${fieldName}不能大于${max}`);

// Date schema
export const dateSchema = z
  .string()
  .refine((val) => !isNaN(Date.parse(val)), '请输入有效的日期');

// Confirm password schema factory
export const confirmPasswordSchema = (passwordField: string = 'password') =>
  z.string().min(1, '请确认密码');

// Login form schema
export const loginFormSchema = z.object({
  email: emailSchema,
  password: simplePasswordSchema,
});

// Register form schema
export const registerFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, '请确认密码'),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

// Profile form schema
export const profileFormSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  phone: phoneSchema.optional().or(z.literal('')),
  bio: z.string().max(200, '简介最多200个字符').optional(),
});

// Type exports
export type LoginFormData = z.infer<typeof loginFormSchema>;
export type RegisterFormData = z.infer<typeof registerFormSchema>;
export type ProfileFormData = z.infer<typeof profileFormSchema>;
