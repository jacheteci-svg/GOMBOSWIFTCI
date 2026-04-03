import type { ReactNode } from 'react';

type NexusModuleFrameProps = {
  /** Ligne au-dessus du titre (ex. « Order Nexus Flow ») */
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
 * En-tête de module aligné sur le design Nexus (Performance, super-admin) :
 * badge cyan, titre en dégradé, sous-titre discret, actions à droite.
 */
export function NexusModuleFrame({
  badge,
  title,
  description,
  actions,
  children,
  className = '',
  tight = false,
}: NexusModuleFrameProps) {
  return (
    <div className={`nexus-module-frame animate-pageEnter ${className}`.trim()}>
      <header className={`nexus-module-hero ${tight ? 'nexus-module-hero--tight' : ''}`}>
        <div className="nexus-module-hero-row">
          <div className="nexus-module-hero-text">
            {badge && (
              <div className="nexus-kicker-row" aria-hidden={false}>
                <span className="nexus-kicker-dot" />
                <span className="nexus-kicker-label">{badge}</span>
              </div>
            )}
            <h1 className="nexus-module-h1">{title}</h1>
            {description && <p className="nexus-module-lead">{description}</p>}
          </div>
          {actions ? <div className="nexus-module-actions">{actions}</div> : null}
        </div>
      </header>
      {children}
    </div>
  );
}
