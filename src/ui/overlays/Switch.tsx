import React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '../utils/cn';

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    className={cn(
      'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors',
      'outline-none border-none ring-0 focus:outline-none focus:ring-0',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=checked]:bg-oneweb-accent data-[state=unchecked]:bg-[#181c23]',
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        'pointer-events-none block h-5 w-5 rounded-oneweb-full bg-white shadow-md transition-transform',
        'data-[state=checked]:translate-x-5 data-[state=checked]:bg-oneweb-text-inverse data-[state=unchecked]:translate-x-0 data-[state=unchecked]:bg-oneweb-text-secondary'
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;
