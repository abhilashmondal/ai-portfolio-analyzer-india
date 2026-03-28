import * as React from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_-3px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_20px_0px_hsl(var(--primary)/0.6)]": variant === "default",
            "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[0_0_15px_-3px_hsl(var(--destructive)/0.4)]": variant === "destructive",
            "border border-border bg-transparent hover:bg-muted hover:text-foreground": variant === "outline",
            "bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
            "hover:bg-muted hover:text-accent-foreground": variant === "ghost",
            "h-11 px-6 py-2": size === "default",
            "h-9 rounded-lg px-3": size === "sm",
            "h-12 rounded-xl px-8 text-base": size === "lg",
            "h-11 w-11": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary focus-visible:bg-background transition-all disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-2xl border border-white/5 bg-card/60 backdrop-blur-xl shadow-xl", className)} {...props} />
  )
)
Card.displayName = "Card"

export const Badge = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { variant?: 'default'|'success'|'destructive'|'warning'|'outline' }>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors border",
        {
          "bg-primary/10 text-primary border-primary/20": variant === 'default',
          "bg-success/10 text-success border-success/20": variant === 'success',
          "bg-destructive/10 text-destructive border-destructive/20": variant === 'destructive',
          "bg-yellow-500/10 text-yellow-500 border-yellow-500/20": variant === 'warning',
          "text-foreground border-border": variant === 'outline',
        },
        className
      )} 
      {...props} 
    />
  )
)
Badge.displayName = "Badge"

export const Checkbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      type="checkbox"
      ref={ref}
      className={cn(
        "peer h-5 w-5 shrink-0 rounded-md border-2 border-muted-foreground/40 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground accent-primary cursor-pointer transition-all",
        className
      )}
      {...props}
    />
  )
)
Checkbox.displayName = "Checkbox"
