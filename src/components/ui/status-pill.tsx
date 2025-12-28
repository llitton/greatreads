'use client';

/**
 * StatusPill Component
 *
 * THE canonical pill/badge component. All labels in rounded rects must use this.
 *
 * Tokens used (from globals.css):
 * - --badge-pad-x: 8px (var(--space-2))
 * - --badge-pad-y: 2px (var(--space-0_5))
 * - --badge-gap: 4px (var(--space-1))
 * - --badge-font-size: 11px
 * - --badge-font-weight: 600
 * - --badge-line-height: 1
 * - --badge-radius: 999px
 *
 * DO NOT:
 * - Use line-height hacks to set height
 * - Use border-radius: 50%
 * - Hardcode width/height
 * - Create one-off badge CSS in a page file
 */

type PillVariant =
  | 'default'
  | 'new'
  | 'seen'
  | 'active'
  | 'muted'
  | 'danger';

interface StatusPillProps {
  children: React.ReactNode;
  variant?: PillVariant;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Color tokens for pill variants
 * Uses CSS custom properties from globals.css
 */
const VARIANT_COLORS: Record<PillVariant, { bg: string; fg: string }> = {
  default: {
    bg: 'var(--badge-default-bg)',
    fg: 'var(--badge-default-fg)',
  },
  new: {
    bg: 'var(--badge-new-bg)',
    fg: 'var(--badge-new-fg)',
  },
  seen: {
    bg: 'var(--badge-seen-bg)',
    fg: 'var(--badge-seen-fg)',
  },
  active: {
    bg: 'var(--badge-active-bg)',
    fg: 'var(--badge-active-fg)',
  },
  muted: {
    bg: 'var(--badge-muted-bg)',
    fg: 'var(--badge-muted-fg)',
  },
  danger: {
    bg: 'var(--badge-danger-bg)',
    fg: 'var(--badge-danger-fg)',
  },
};

// Selected state colors (dark pill)
const SELECTED_COLORS = {
  bg: '#1f1a17',
  fg: '#ffffff',
};

export function StatusPill({
  children,
  variant = 'default',
  selected = false,
  onClick,
  className = '',
}: StatusPillProps) {
  const colors = selected ? SELECTED_COLORS : VARIANT_COLORS[variant];

  // Use CSS custom properties for consistent sizing
  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    // Padding: 2px 8px (--badge-pad-y --badge-pad-x)
    padding: 'var(--badge-pad-y) var(--badge-pad-x)',
    gap: 'var(--badge-gap)',
    // Typography
    fontSize: 'var(--badge-font-size)',
    fontWeight: 'var(--badge-font-weight)',
    lineHeight: 'var(--badge-line-height)',
    // Shape
    borderRadius: 'var(--badge-radius)',
    // No fixed dimensions
    whiteSpace: 'nowrap',
    // Colors
    background: colors.bg,
    color: colors.fg,
    // Interactive
    cursor: onClick ? 'pointer' : 'default',
    border: 'none',
    transition: 'background 0.15s, color 0.15s',
  };

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={style}
        className={className}
      >
        {children}
      </button>
    );
  }

  return (
    <span style={style} className={className}>
      {children}
    </span>
  );
}

/**
 * FilterPillGroup - A group of filter pills
 */
export function FilterPillGroup({
  filters,
  activeFilter,
  onFilterChange,
  className = '',
}: {
  filters: { value: string; label: string }[];
  activeFilter: string;
  onFilterChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={className} style={{ display: 'flex', gap: 'var(--space-1)' }}>
      {filters.map((filter) => (
        <StatusPill
          key={filter.value}
          variant="default"
          selected={activeFilter === filter.value}
          onClick={() => onFilterChange(filter.value)}
        >
          {filter.label}
        </StatusPill>
      ))}
    </div>
  );
}

/**
 * BookStatusBadge - Specific badge for book reading status
 */
export function BookStatusBadge({
  status,
  className = '',
}: {
  status: 'WANT_TO_READ' | 'READING' | 'READ' | null;
  className?: string;
}) {
  if (!status) return null;

  const config: Record<string, { icon: string; label: string; variant: PillVariant }> = {
    READ: { icon: '✓', label: 'Read', variant: 'active' },
    READING: { icon: '📖', label: 'Reading', variant: 'new' },
    WANT_TO_READ: { icon: '📌', label: 'Want to Read', variant: 'default' },
  };

  const { icon, label, variant } = config[status] || config.WANT_TO_READ;

  return (
    <StatusPill variant={variant} className={className}>
      {icon} {label}
    </StatusPill>
  );
}
