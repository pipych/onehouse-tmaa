import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useLayoutEffect,
  useEffect,
} from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../utils/cn';
import { OneIcon } from '../components/Icon';

interface TabsContextType {
  value: string;
  onValueChange: (val: string) => void;
  registerTrigger: (val: string, el: HTMLElement | null) => void;
  triggerElements: React.MutableRefObject<{ [val: string]: HTMLElement | null }>;
}

const TabsContext = createContext<TabsContextType | null>(null);

export const useTabsContext = () => useContext(TabsContext);

export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  count?: number | string;
  badge?: number | string;
  disabled?: boolean;
}

export interface TabsProps
  extends Omit<React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>, 'onChange'> {
  items?: TabItem[];
  rightAction?: React.ReactNode;
  onChange?: (id: string) => void;
}

/**
 * OneWebUI Tabs Component
 * - Unified pill capsule container (bg-[#14171c])
 * - Sliding active background indicator (bg-[#1c222b] with transition-all duration-300 ease-out)
 * - Tab items with icon, title, and count badge in a single line
 * - Active state: strictly One Lime #c0ff00 (bold text, green icon, tinted badge)
 * - Inactive state: muted gray #8e8e93 (medium text, subtle badge, hover to white)
 * - Optional right action slot for search / buttons
 */
export const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  TabsProps
>(
  (
    {
      value,
      defaultValue,
      onValueChange,
      onChange,
      items,
      rightAction,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState<string>(
      value || defaultValue || (items && items[0]?.id) || ''
    );

    const currentValue = value !== undefined ? value : internalValue;
    const triggerElements = useRef<{ [val: string]: HTMLElement | null }>({});

    const handleValueChange = useCallback(
      (newVal: string) => {
        if (value === undefined) {
          setInternalValue(newVal);
        }
        onValueChange?.(newVal);
        onChange?.(newVal);
      },
      [value, onValueChange, onChange]
    );

    const registerTrigger = useCallback((val: string, el: HTMLElement | null) => {
      triggerElements.current[val] = el;
    }, []);

    return (
      <TabsContext.Provider
        value={{
          value: currentValue,
          onValueChange: handleValueChange,
          registerTrigger,
          triggerElements,
        }}
      >
        <TabsPrimitive.Root
          ref={ref}
          value={currentValue}
          onValueChange={handleValueChange}
          className={cn('w-full', className)}
          {...props}
        >
          {items && items.length > 0 ? (
            <>
              <TabsList rightAction={rightAction}>
                {items.map((item) => (
                  <TabsTrigger
                    key={item.id}
                    value={item.id}
                    icon={item.icon}
                    count={item.count !== undefined ? item.count : item.badge}
                    disabled={item.disabled}
                  >
                    {item.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {children}
            </>
          ) : (
            children
          )}
        </TabsPrimitive.Root>
      </TabsContext.Provider>
    );
  }
);

Tabs.displayName = TabsPrimitive.Root.displayName;

export interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  rightAction?: React.ReactNode;
}

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, children, rightAction, ...props }, ref) => {
  const context = useTabsContext();
  const listRef = useRef<HTMLDivElement>(null);

  const [pillRect, setPillRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
    ready: boolean;
  }>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    ready: false,
  });

  const activeValue = context?.value;

  const updatePill = useCallback(() => {
    if (!context || !activeValue) return;
    const container = listRef.current;
    const activeEl = context.triggerElements.current[activeValue];

    if (container && activeEl) {
      const left = activeEl.offsetLeft;
      const top = activeEl.offsetTop;
      const width = activeEl.offsetWidth;
      const height = activeEl.offsetHeight;

      setPillRect((prev) => {
        if (
          prev.ready &&
          Math.abs(prev.left - left) < 0.5 &&
          Math.abs(prev.top - top) < 0.5 &&
          Math.abs(prev.width - width) < 0.5 &&
          Math.abs(prev.height - height) < 0.5
        ) {
          return prev;
        }
        return { left, top, width, height, ready: true };
      });
    } else {
      setPillRect((prev) => (prev.ready ? { ...prev, ready: false } : prev));
    }
  }, [context, activeValue]);

  useLayoutEffect(() => {
    updatePill();
  }, [updatePill]);

  useEffect(() => {
    updatePill();
    const container = listRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      updatePill();
    });
    ro.observe(container);
    window.addEventListener('resize', updatePill);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updatePill);
    };
  }, [updatePill]);

  return (
    <TabsPrimitive.List
      ref={(el) => {
        (listRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        if (typeof ref === 'function') {
          ref(el);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }
      }}
      className={cn(
        'inline-flex items-center gap-1.5 p-1 rounded-full bg-[#14171c] border-none ring-0 outline-none relative select-none max-w-full overflow-x-auto no-scrollbar',
        className
      )}
      {...props}
    >
      {/* Sliding active capsule background */}
      <div
        className={cn(
          'absolute rounded-full bg-[#1c222b] transition-all duration-300 ease-out pointer-events-none z-0',
          pillRect.ready ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          transform: `translate3d(${pillRect.left}px, ${pillRect.top}px, 0)`,
          width: `${pillRect.width}px`,
          height: `${pillRect.height}px`,
        }}
      />

      {/* Tab Triggers */}
      {children}

      {/* Right action slot */}
      {rightAction && (
        <div className="ml-auto pl-1.5 pr-1 flex items-center shrink-0 relative z-10">
          {rightAction}
        </div>
      )}
    </TabsPrimitive.List>
  );
});

TabsList.displayName = TabsPrimitive.List.displayName;

export interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  icon?: string | React.ReactNode;
  count?: number | string;
  badge?: number | string;
}

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, value, icon, count, badge, children, disabled, ...props }, ref) => {
  const context = useTabsContext();
  const isActive = context?.value === value;
  const counterValue = count !== undefined ? count : badge;

  const handleRef = useCallback(
    (el: HTMLButtonElement | null) => {
      context?.registerTrigger(value, el);
      if (typeof ref === 'function') {
        ref(el);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLButtonElement | null>).current = el;
      }
    },
    [context, value, ref]
  );

  return (
    <TabsPrimitive.Trigger
      ref={handleRef}
      value={value}
      disabled={disabled}
      className={cn(
        'group flex items-center gap-2 px-4 py-2 rounded-full relative z-10 cursor-pointer select-none transition-colors duration-200 border-none outline-none focus:outline-none focus:ring-0 sf-tap',
        isActive
          ? 'text-[#c0ff00] font-bold text-sm'
          : 'text-[#8e8e93] hover:text-white font-medium text-sm',
        'disabled:pointer-events-none disabled:opacity-40',
        className
      )}
      {...props}
    >
      {/* Icon */}
      {icon && (
        <div className="shrink-0 flex items-center justify-center">
          {typeof icon === 'string' ? (
            <OneIcon
              name={icon}
              size={18}
              className={cn(
                'transition-colors duration-200',
                isActive ? 'text-[#c0ff00]' : 'text-[#8e8e93] group-hover:text-white'
              )}
            />
          ) : (
            icon
          )}
        </div>
      )}

      {/* Label */}
      {children && <span className="leading-none whitespace-nowrap">{children}</span>}

      {/* Counter Badge */}
      {counterValue !== undefined && (
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-xs transition-colors shrink-0 leading-none',
            isActive
              ? 'font-bold bg-[#c0ff00]/20 text-[#c0ff00]'
              : 'font-semibold bg-white/5 text-[#8e8e93]'
          )}
        >
          {counterValue}
        </span>
      )}
    </TabsPrimitive.Trigger>
  );
});

TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-3 focus-visible:outline-none ring-0 border-none outline-none animate-fade-in',
      className
    )}
    {...props}
  />
));

TabsContent.displayName = TabsPrimitive.Content.displayName;
