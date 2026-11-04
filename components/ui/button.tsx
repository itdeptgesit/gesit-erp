import * as React from "react"
import { 
    Button as RACButton, 
    ButtonProps as RACButtonProps,
    composeRenderProps 
} from "react-aria-components"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[6px] border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-[#385898] active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-[#08090a] text-[#ffffff] hover:bg-[#222326] dark:bg-[#e4f222] dark:text-[#08090a] dark:hover:bg-[#d9e620] shadow-[0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4)] font-medium tracking-[-0.011em]",
        outline:
          "border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-900 dark:border-[#23252a] dark:bg-[#161718] dark:hover:bg-[#23252a] dark:text-[#ffffff] aria-expanded:bg-muted tracking-[-0.011em]",
        secondary:
          "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 border border-zinc-200 dark:bg-[#161718] dark:text-[#d0d6e0] dark:hover:bg-[#23252a] dark:border-[#23252a] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-[#161718] dark:hover:text-[#ffffff] aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive:
          "bg-[#eb5757]/10 text-[#eb5757] hover:bg-[#eb5757]/20 border border-[#eb5757]/20 dark:bg-[#eb5757]/15 dark:hover:bg-[#eb5757]/25 dark:border-[#eb5757]/30",
        link: "text-zinc-900 dark:text-[#e4f222] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 gap-2",
        xs: "h-7 px-2 text-xs gap-1",
        sm: "h-8 px-3 text-xs gap-1.5",
        lg: "h-10 px-8 gap-2",
        icon: "h-9 w-9",
        "icon-xs": "h-6 w-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps extends Omit<RACButtonProps, 'render'>, VariantProps<typeof buttonVariants> {
    className?: string
    disabled?: boolean // Compatibility with old API
    title?: string // Standard HTML title attribute
    type?: "submit" | "reset" | "button" // Standard HTML type
    onClick?: React.MouseEventHandler<HTMLButtonElement>
    render?: React.ReactElement | ((props: any) => React.ReactNode)
}

function Button({
  className,
  variant = "default",
  size = "default",
  disabled,
  isDisabled,
  render,
  onPress,
  onClick,
  ...props
}: ButtonProps) {
  const finalIsDisabled = isDisabled ?? disabled;

  // Convert Element-based render to Function-based for RAC compatibility
  const finalRender = React.isValidElement(render)
    ? (domProps: any) => React.cloneElement(render as React.ReactElement, domProps)
    : render;

  const handlePress = (e: any) => {
    if (onPress) onPress(e);
    if (onClick) {
      // Provide a synthetic event wrapper with safe no-op stubs so e.stopPropagation() / e.preventDefault() won't crash
      const syntheticEvent = {
        ...e,
        stopPropagation: () => {
          if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
        },
        stopImmediatePropagation: () => {
          if (e && typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
        },
        preventDefault: () => {
          if (e && typeof e.preventDefault === 'function') e.preventDefault();
        },
        nativeEvent: e,
        target: e?.target,
        currentTarget: e?.target,
      };
      onClick(syntheticEvent as any);
    }
  };

  return (
    <RACButton
      {...props}
      onPress={handlePress}
      render={finalRender as any}
      isDisabled={finalIsDisabled}
      className={composeRenderProps(className, (className, renderProps) => 
        cn(buttonVariants({ variant, size, className }),
        renderProps.isFocusVisible && "ring-2 ring-ring ring-offset-2",
        renderProps.isPressed && "scale-[0.98]"
      ))}
    />
  )
}

export { Button, buttonVariants }
