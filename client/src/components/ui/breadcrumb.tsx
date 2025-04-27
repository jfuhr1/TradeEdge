import * as React from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => (
  <nav
    ref={ref}
    aria-label="breadcrumb"
    className={cn(
      "flex flex-wrap items-center text-sm text-muted-foreground",
      className
    )}
    {...props}
  />
));
Breadcrumb.displayName = "Breadcrumb";

const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement> & { isCurrentPage?: boolean }
>(({ className, isCurrentPage, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("inline-flex items-center", className)}
    aria-current={isCurrentPage ? "page" : undefined}
    {...props}
  />
));
BreadcrumbItem.displayName = "BreadcrumbItem";

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<typeof Link> & { asChild?: boolean } & React.HTMLAttributes<HTMLAnchorElement>
>(({ className, asChild = false, href, ...props }, ref) => {
  const Comp = asChild ? React.Fragment : href ? Link : "span";
  const linkProps = href ? { to: href } : {};
  
  return (
    <Comp
      ref={ref}
      className={cn(
        "transition-colors hover:text-foreground",
        className
      )}
      {...linkProps}
      {...props}
    />
  );
});
BreadcrumbLink.displayName = "BreadcrumbLink";

const BreadcrumbSeparator = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn("mx-2 text-muted-foreground", className)}
    {...props}
  />
));
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

export {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
};