/** Icon button with an instant CSS tooltip on hover and keyboard focus. */

import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type TooltipPlacement = 'top' | 'bottom';

export const toolbarIconClass =
  'rounded p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800';

export const paneIconClass =
  'rounded p-1 text-neutral-600 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-800';

interface TooltipButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tooltip: string;
  placement?: TooltipPlacement;
  children: ReactNode;
}

export function TooltipButton({
  tooltip,
  placement = 'bottom',
  children,
  className = '',
  'aria-label': ariaLabel,
  ...props
}: TooltipButtonProps) {
  return (
    <button
      type="button"
      title={tooltip}
      aria-label={ariaLabel ?? tooltip}
      data-tooltip={tooltip}
      data-tooltip-placement={placement}
      className={`tooltip-button focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
