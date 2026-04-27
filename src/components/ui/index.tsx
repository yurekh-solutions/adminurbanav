'use client';
import React from 'react';
import { cn } from '@/lib/utils';

// ── Card ───────────────────────────────────────────────────────────────────
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'solid' | 'gradient';
}

export const Card: React.FC<CardProps> = ({ className, variant = 'glass', children, ...props }) => (
  <div
    className={cn(
      'rounded-[var(--radius)] border transition-all duration-200',
      variant === 'glass' && 'admin-card hover:shadow-[var(--shadow-glow)] hover:-translate-y-0.5',
      variant === 'solid' && 'bg-card border-border shadow-[var(--shadow-card)]',
      variant === 'gradient' && 'glass-strong border-0',
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('px-6 py-4 border-b border-border/50', className)} {...props} />
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h3 className={cn('text-base font-semibold text-foreground', className)} {...props} />
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('p-6', className)} {...props} />
);

// ── Button ─────────────────────────────────────────────────────────────────
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
}

const btnVariants: Record<ButtonVariant, string> = {
  primary:     'bg-primary text-primary-foreground hover:opacity-90 shadow-[var(--shadow-neon)]',
  secondary:   'bg-secondary text-secondary-foreground hover:bg-muted',
  ghost:       'bg-transparent text-primary hover:bg-secondary',
  destructive: 'bg-destructive text-destructive-foreground hover:opacity-90',
  outline:     'border border-primary text-primary bg-transparent hover:bg-secondary',
};
const btnSizes: Record<ButtonSize, string> = {
  sm:   'h-8  px-3   text-xs  rounded-[0.75rem]',
  md:   'h-9  px-4   text-sm  rounded-[var(--radius)]',
  lg:   'h-11 px-6   text-sm  rounded-[var(--radius)]',
  icon: 'h-9  w-9    text-sm  rounded-[var(--radius)]',
};

export const Button: React.FC<ButtonProps> = ({
  className, variant = 'primary', size = 'md', loading, disabled, leftIcon, children, ...props
}) => (
  <button
    disabled={disabled || loading}
    className={cn(
      'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      'disabled:opacity-50 disabled:pointer-events-none',
      btnVariants[variant],
      btnSizes[size],
      className,
    )}
    {...props}
  >
    {loading ? (
      <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
    ) : leftIcon}
    <span className="truncate">{children}</span>
  </button>
);

// ── Badge ──────────────────────────────────────────────────────────────────
type BadgeTone = 'success' | 'warning' | 'error' | 'info' | 'brand' | 'muted';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const badgeToneMap: Record<BadgeTone, string> = {
  success: 'badge-success',
  warning: 'badge-warning',
  error:   'badge-error',
  info:    'badge-info',
  brand:   'badge-brand',
  muted:   'bg-muted text-muted-foreground border border-border',
};

export const Badge: React.FC<BadgeProps> = ({ className, tone = 'muted', children, ...props }) => (
  <span
    className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap',
      badgeToneMap[tone],
      className,
    )}
    {...props}
  >
    {children}
  </span>
);

// ── Input ──────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  leftIcon?: React.ReactNode;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ className, label, leftIcon, error, id, ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label htmlFor={id} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>}
    <div className="relative">
      {leftIcon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{leftIcon}</span>
      )}
      <input
        id={id}
        className={cn(
          'w-full h-10 rounded-[0.75rem] border border-input bg-card/70 px-3 text-sm text-foreground',
          'placeholder:text-muted-foreground/60',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary',
          'transition-all duration-200',
          leftIcon && 'pl-9',
          error && 'border-destructive focus:ring-destructive',
          className,
        )}
        {...props}
      />
    </div>
    {error && <span className="text-xs text-destructive">{error}</span>}
  </div>
);

// ── Select ─────────────────────────────────────────────────────────────────
export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }> = ({
  className, label, id, children, ...props
}) => (
  <div className="flex flex-col gap-1.5">
    {label && <label htmlFor={id} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>}
    <select
      id={id}
      className={cn(
        'h-10 rounded-[0.75rem] border border-input bg-card/70 px-3 text-sm text-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring',
        'transition-all duration-200',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  </div>
);

// ── Avatar ─────────────────────────────────────────────────────────────────
export const Avatar: React.FC<{ name: string; size?: number; className?: string }> = ({
  name, size = 36, className,
}) => {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold shrink-0',
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
};

// ── Spinner ────────────────────────────────────────────────────────────────
export const Spinner: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
  <span
    className={cn('inline-block rounded-full border-2 border-primary border-t-transparent animate-spin', className)}
    style={{ width: size, height: size }}
  />
);

// ── Empty state ────────────────────────────────────────────────────────────
export const EmptyState: React.FC<{ title: string; description?: string; icon?: React.ReactNode }> = ({
  title, description, icon,
}) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
    {icon && <div className="text-muted-foreground/50 mb-2">{icon}</div>}
    <p className="text-base font-semibold text-foreground">{title}</p>
    {description && <p className="text-sm text-muted-foreground max-w-xs">{description}</p>}
  </div>
);
