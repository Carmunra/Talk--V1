import React, { useRef, useState } from 'react';
export function LaunchNavigation({
  items,
  selected,
  active,
  role,
  isAdmin = false,
  onNavigate,
}: {
  items: string[][];
  selected: string;
  active: boolean;
  role?: string;
  isAdmin?: boolean;
  onNavigate: (value: string) => void;
}) {
  const [open, setOpen] = useState(() => window.matchMedia('(min-width: 768px)').matches);
  const summary = useRef<HTMLElement>(null);
  const primary = active
    ? isAdmin
      ? ['home', 'admin', 'lessons']
      : role === 'TEACHER'
        ? ['home', 'lessons', 'payments']
        : ['home', 'lessons', 'plans']
    : ['teachers', 'plans'];
  const renderButton = ([value, label]: string[], more = false) => (
    <button
      type="button"
      key={value}
      className={selected === value ? 'selected' : ''}
      aria-current={selected === value ? 'page' : undefined}
      onClick={() => {
        onNavigate(value);
        if (more && !window.matchMedia('(min-width: 768px)').matches) {
          setOpen(false);
          summary.current?.focus();
        }
      }}
    >
      {label}
    </button>
  );
  return (
    <div className="mb-6 space-y-3">
      <nav aria-label="Navegação principal" className="flex gap-2 overflow-x-auto pb-1">
        {items.filter(([value]) => primary.includes(value)).map((item) => renderButton(item))}
      </nav>
      <details
        open={open}
        onToggle={(e) => setOpen(e.currentTarget.open)}
        className="rounded-xl border bg-white p-3"
      >
        <summary ref={summary} className="cursor-pointer font-medium text-sm">
          Mais opções
        </summary>
        <nav aria-label="Outras áreas da conta" className="flex flex-wrap gap-2 pt-3">
          {items
            .filter(([value]) => !primary.includes(value))
            .map((item) => renderButton(item, true))}
        </nav>
      </details>
    </div>
  );
}
