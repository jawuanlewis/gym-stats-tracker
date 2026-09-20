"use client";

import type { Direction } from "../types";

type StepperProps = {
  /** Pre-formatted for display — the caller owns number formatting. */
  value: string;
  unit?: string;
  /** Used for screen-reader button labels, e.g. "weight for Shoulder Press". */
  label: string;
  onAdjust: (direction: Direction) => void;
  canDecrease?: boolean;
  canIncrease?: boolean;
  size?: "lg" | "sm";
  /** Pushes the buttons to the row edges — the thumb-friendly layout for the weight row. */
  spread?: boolean;
};

export function Stepper({
  value,
  unit,
  label,
  onAdjust,
  canDecrease = true,
  canIncrease = true,
  size = "lg",
  spread = false,
}: Readonly<StepperProps>) {
  const isLarge = size === "lg";
  // 44px minimum: these get tapped with sweaty hands between sets.
  const buttonSize = isLarge ? "h-12 w-12 text-2xl" : "h-11 w-11 text-xl";
  const readoutSize = isLarge ? "text-3xl" : "text-xl";

  return (
    <div className={`flex items-center gap-2 ${spread ? "w-full justify-between" : ""}`}>
      <StepButton
        ariaLabel={`Decrease ${label}`}
        disabled={!canDecrease}
        onClick={() => onAdjust(-1)}
        className={buttonSize}
      >
        &minus;
      </StepButton>

      <div
        className={`flex min-w-24 items-baseline justify-center gap-1 ${isLarge ? "" : "min-w-16"}`}
      >
        {/* tabular-nums keeps the readout from shifting width as digits change */}
        <span className={`${readoutSize} font-semibold tabular-nums`}>{value}</span>
        {unit ? <span className="text-sm text-muted">{unit}</span> : null}
      </div>

      <StepButton
        ariaLabel={`Increase ${label}`}
        disabled={!canIncrease}
        onClick={() => onAdjust(1)}
        className={buttonSize}
      >
        +
      </StepButton>
    </div>
  );
}

function StepButton({
  ariaLabel,
  disabled,
  onClick,
  className,
  children,
}: Readonly<{
  ariaLabel: string;
  disabled: boolean;
  onClick: () => void;
  className: string;
  children: React.ReactNode;
}>) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={`${className} flex shrink-0 items-center justify-center rounded-full border border-border bg-surface-raised leading-none text-foreground transition-colors active:bg-accent active:text-accent-foreground disabled:opacity-30 disabled:active:bg-surface-raised disabled:active:text-foreground`}
    >
      {children}
    </button>
  );
}
