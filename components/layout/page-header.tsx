/**
 * PageHeader — the standard page title block used by every shell-wrapped
 * page. Title, optional description, optional action slot. Ported from
 * MacTech Governance for cross-suite consistency.
 */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-4 md:flex-row md:items-center">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
