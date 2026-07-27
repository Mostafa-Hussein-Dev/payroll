"use client";

export function ConfirmButton({
  children,
  confirm,
  className,
}: {
  children: React.ReactNode;
  confirm: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
