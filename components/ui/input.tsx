import * as React from "react"
import { 
    Input as RACInput, 
    InputProps as RACInputProps,
    composeRenderProps
} from "react-aria-components"

import { cn } from "@/lib/utils"

interface InputProps extends RACInputProps {
    className?: string
}

function Input({ className, type, ...props }: InputProps) {
  return (
    <RACInput
      type={type}
      className={composeRenderProps(className, (className, renderProps) => 
        cn(
          "h-9 w-full min-w-0 rounded-[6px] border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:bg-[#161718] dark:text-[#ffffff] dark:placeholder:text-[#62666d] dark:border-[#23252a] dark:focus:border-[#e4f222] dark:focus:ring-1 dark:focus:ring-[#e4f222] px-3 py-1.5 text-base tracking-[-0.011em] transition-colors outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-[#eb5757] dark:aria-invalid:ring-[#eb5757]/30",
          renderProps.isFocused && "border-zinc-900 ring-1 ring-zinc-900 dark:border-[#e4f222] dark:ring-1 dark:ring-[#e4f222]",
          renderProps.isInvalid && "border-destructive ring-destructive/20",
          className
        )
      )}
      {...props}
    />
  )
}

export { Input }
