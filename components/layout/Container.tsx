import { cn } from "@/lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: "div" | "section" | "header" | "footer" | "main";
  size?: "default" | "wide" | "narrow";
}

const sizeMap = {
  narrow: "max-w-4xl",
  default: "max-w-7xl",
  wide: "max-w-[1440px]",
};

export function Container({
  as: Tag = "div",
  size = "default",
  className,
  children,
  ...rest
}: ContainerProps) {
  return (
    <Tag
      className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", sizeMap[size], className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}
