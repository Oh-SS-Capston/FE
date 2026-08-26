const paddingClass = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export default function Panel({
  as: Component = "section",
  padding = "md",
  className = "",
  children,
  ...props
}) {
  return (
    <Component
      className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] ${
        paddingClass[padding] ?? paddingClass.md
      } ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
