import type { ReactNode } from 'react';

type GomboModuleFrameProps = {
  /** Ligne au-dessus du titre (ex. « Order Gombo Flow ») */
  badge?: string;
  title: ReactNode;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Réduit la marge sous le hero (listes denses) */
  tight?: boolean;
};

/**
 * En-tête de module aligné sur le design Gombo (Performance, super-admin) :
 * badge cyan, titre en dégradé, sous-titre discret, actions à droite.
 */
export function GomboModuleFrame({
  badge,
  title,
  description,
  actions,
  children,
  className = '',
  tight = false,
}: GomboModuleFrameProps) {
  return (
    <div className={`gombo-module-frame animate-pageEnter ${className}`.trim()}>
      <header className={`gombo-module-hero ${tight ? 'gombo-module-hero--tight' : ''}`}>
        <div className="gombo-module-hero-row">
          <div className="gombo-module-hero-text">
            {badge && (
              <div className="gombo-kicker-row" aria-hidden={false}>
                <span className="gombo-kicker-dot" />
                <span className="gombo-kicker-label">{badge}</span>
              </div>
            )}
            <h1 className="gombo-module-h1">{title}</h1>
            {description && <p className="gombo-module-lead">{description}</p>}
          </div>
          {actions ? <div className="gombo-module-actions">{actions}</div> : null}
        </div>
      </header>
      {children}
    </div>
  );
}
