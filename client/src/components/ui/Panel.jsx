export default function Panel({ title, description, action, children, className = '', bodyClassName = 'p-5' }) {
  return (
    <section className={`rounded-xl bg-surface shadow-panel ${className}`}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-4 px-5 pt-5">
          <div>
            <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-ink-soft">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
