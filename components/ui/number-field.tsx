"use client";

import { NumberField as NumberFieldPrimitive } from "@base-ui/react/number-field";
import { MinusIcon, PlusIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function NumberFieldRoot({
  className,
  ...props
}: NumberFieldPrimitive.Root.Props) {
  return (
    <NumberFieldPrimitive.Root
      data-slot="number-field"
      className={cn(
        "group/number-field flex flex-col items-start gap-1",
        className,
      )}
      {...props}
    />
  );
}

function NumberFieldScrubArea({
  className,
  ...props
}: NumberFieldPrimitive.ScrubArea.Props) {
  return (
    <NumberFieldPrimitive.ScrubArea
      data-slot="number-field-scrub-area"
      className={cn(
        "text-foreground inline-flex cursor-ew-resize items-center gap-2 text-sm font-medium select-none group-data-[disabled=true]/number-field:cursor-not-allowed group-data-[disabled=true]/number-field:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function NumberFieldScrubAreaCursor({
  className,
  ...props
}: NumberFieldPrimitive.ScrubAreaCursor.Props) {
  return (
    <NumberFieldPrimitive.ScrubAreaCursor
      data-slot="number-field-scrub-area-cursor"
      className={className}
      {...props}
    />
  );
}

function NumberFieldGroup({
  className,
  ...props
}: NumberFieldPrimitive.Group.Props) {
  return (
    <NumberFieldPrimitive.Group
      data-slot="number-field-group"
      className={cn(
        "border-input bg-input/30 has-[[data-slot=number-field-input]:focus-visible]:border-ring has-[[data-slot=number-field-input]:focus-visible]:ring-ring/50 has-[[data-slot=number-field-input][aria-invalid=true]]:ring-destructive/20 has-[[data-slot=number-field-input][aria-invalid=true]]:border-destructive dark:has-[[data-slot=number-field-input][aria-invalid=true]]:ring-destructive/40 dark:has-[[data-slot=number-field-input][aria-invalid=true]]:border-destructive/50 flex h-9 w-fit items-stretch overflow-hidden rounded-4xl border transition-colors has-[[data-slot=number-field-input]:focus-visible]:ring-[3px] has-[[data-slot=number-field-input][aria-invalid=true]]:ring-[3px]",
        className,
      )}
      {...props}
    />
  );
}

function NumberFieldInput({
  className,
  ...props
}: NumberFieldPrimitive.Input.Props) {
  return (
    <NumberFieldPrimitive.Input
      data-slot="number-field-input"
      className={cn(
        "text-foreground placeholder:text-muted-foreground h-full min-w-20 border-x border-input bg-transparent px-3 text-center text-base tabular-nums outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

function NumberFieldIncrement({
  className,
  children,
  type = "button",
  ...props
}: NumberFieldPrimitive.Increment.Props) {
  return (
    <NumberFieldPrimitive.Increment
      type={type}
      data-slot="number-field-increment"
      className={cn(
        "text-foreground hover:bg-input/50 active:bg-input/50 inline-flex size-9 shrink-0 items-center justify-center transition-colors outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children ?? <PlusIcon />}
    </NumberFieldPrimitive.Increment>
  );
}

function NumberFieldDecrement({
  className,
  children,
  type = "button",
  ...props
}: NumberFieldPrimitive.Decrement.Props) {
  return (
    <NumberFieldPrimitive.Decrement
      type={type}
      data-slot="number-field-decrement"
      className={cn(
        "text-foreground hover:bg-input/50 active:bg-input/50 inline-flex size-9 shrink-0 items-center justify-center transition-colors outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children ?? <MinusIcon />}
    </NumberFieldPrimitive.Decrement>
  );
}

export {
  NumberFieldRoot,
  NumberFieldScrubArea,
  NumberFieldScrubAreaCursor,
  NumberFieldGroup,
  NumberFieldInput,
  NumberFieldIncrement,
  NumberFieldDecrement,
};
