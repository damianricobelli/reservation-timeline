"use client";

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";
import { cn } from "@/lib/utils";

function Collapsible({ ...props }: CollapsiblePrimitive.Root.Props) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

function CollapsibleTrigger({
  className,
  ...props
}: CollapsiblePrimitive.Trigger.Props) {
  return (
    <CollapsiblePrimitive.Trigger
      data-slot="collapsible-trigger"
      className={cn(
        "group flex items-center gap-2 px-2 py-1 text-sm font-medium hover:bg-slate-200 focus-visible:ring-[3px] focus-visible:border-ring focus-visible:ring-ring/50 active:bg-slate-200",
        className,
      )}
      {...props}
    />
  );
}

function CollapsibleContent({
  className,
  ...props
}: CollapsiblePrimitive.Panel.Props) {
  return (
    <CollapsiblePrimitive.Panel
      data-slot="collapsible-content"
      className={cn(
        "flex [&[hidden]:not([hidden='until-found'])]:hidden h-(--collapsible-panel-height) flex-col justify-end overflow-hidden text-sm transition-all ease-out data-ending-style:h-0 data-starting-style:h-0 duration-150",
        className,
      )}
      {...props}
    />
  );
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
