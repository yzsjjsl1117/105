export type ValidationResult =
  | { success: true }
  | { success: false; error: string; message: string };

export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim().length === 0) {
    return { success: false, error: "VALIDATION_ERROR", message: "请输入邮箱地址" };
  }
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) {
    return { success: false, error: "VALIDATION_ERROR", message: "请输入有效的邮箱地址" };
  }
  return { success: true };
}

export function validatePassword(password: string): ValidationResult {
  if (!password || password.length < 6) {
    return { success: false, error: "VALIDATION_ERROR", message: "密码至少需要6个字符" };
  }
  return { success: true };
}

export function validateName(name: string): ValidationResult {
  if (!name || name.trim().length < 2) {
    return { success: false, error: "VALIDATION_ERROR", message: "用户名至少需要2个字符" };
  }
  if (name.trim().length > 20) {
    return { success: false, error: "VALIDATION_ERROR", message: "用户名不能超过20个字符" };
  }
  return { success: true };
}

export function validatePhone(phone: string | undefined | null): ValidationResult {
  if (!phone || phone.trim().length === 0) return { success: true }; // 选填
  const re = /^1[3-9]\d{9}$/;
  if (!re.test(phone.trim())) {
    return { success: false, error: "VALIDATION_ERROR", message: "请输入有效的手机号" };
  }
  return { success: true };
}

export function validatePasswordMatch(password: string, confirm: string): ValidationResult {
  if (password !== confirm) {
    return { success: false, error: "VALIDATION_ERROR", message: "两次密码输入不一致" };
  }
  return { success: true };
}

export function validateRegisterInput(input: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}): ValidationResult {
  const checks = [
    validateName(input.name),
    validateEmail(input.email),
    validatePassword(input.password),
    validatePasswordMatch(input.password, input.confirmPassword),
    validatePhone(input.phone),
  ];
  for (const check of checks) {
    if (!check.success) return check;
  }
  return { success: true };
}

export function validateResetPasswordInput(input: {
  password: string;
  confirmPassword: string;
}): ValidationResult {
  const checks = [
    validatePassword(input.password),
    validatePasswordMatch(input.password, input.confirmPassword),
  ];
  for (const check of checks) {
    if (!check.success) return check;
  }
  return { success: true };
}
