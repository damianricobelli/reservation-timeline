import { cn } from "@/lib/utils";
import React from "react";

/**
 * A flexible layout container component with default styling.
 *
 * It renders a semantic HTML element defined by the `as` prop
 * and applies a base set of layout and visual styles. Additional
 * classes can be merged through `className`.
 *
 * @param children - The content to render inside the container.
 * @param as - The HTML tag to render as (defaults to `"div"`).
 * @param className - Optional additional class names to merge with the defaults.
 *
 * @returns A styled container element wrapping the provided children.
 */
export const Container = ({
  children,
  as = "div",
  className,
}: {
  children?: React.ReactNode;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
}) => {
  const Comp = as;
  return (
    <Comp
      className={cn(
        "bg-white border border-slate-200 rounded-4xl px-4 py-3 md:py-4",
        className,
      )}
    >
      {children}
    </Comp>
  );
};
