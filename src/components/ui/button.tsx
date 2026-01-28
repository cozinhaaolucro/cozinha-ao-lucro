import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-elegant hover:brightness-110 hover:-translate-y-[2px] hover:shadow-hover active:scale-[0.98] active:translate-y-0 transition-all duration-200 ease-out",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:brightness-110 hover:-translate-y-[1px] hover:shadow-md active:scale-[0.98] transition-all duration-200",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-200",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:brightness-110 hover:-translate-y-[1px] hover:shadow-md active:scale-[0.98] transition-all duration-200",
        ghost: "hover:bg-primary/5 hover:text-primary transition-colors duration-200",
        link: "text-primary underline-offset-4 hover:underline transition-all duration-200",
        premium: "bg-gradient-to-r from-primary via-primary-glow to-primary text-primary-foreground shadow-lg hover:shadow-elegant hover:scale-[1.02] border border-white/20 transition-all duration-300",
      },
      size: {
        default: "h-10 px-4 py-2 rounded-lg", /* Reduced from h-12 to h-10 */
        sm: "h-8 rounded-md px-3 text-xs", /* Reduced from h-9 to h-8 */
        lg: "h-12 rounded-xl px-8", /* Reduced from h-14 to h-12 */
        icon: "h-9 w-9 rounded-lg", /* Reduced for density */
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
