import { APP_NAME } from '../constants/app';

type AppLoadingScreenProps = {
  /** Texte sous le nom de l’application (ex. « Connexion… », « Chargement… »). */
  message?: string;
  /** Plein écran (auth) vs zone contenu (layout). */
  variant?: 'fullscreen' | 'embedded';
};

export const AppLoadingScreen = ({
  message = 'Chargement…',
  variant = 'embedded',
}: AppLoadingScreenProps) => {
  const minHeight = variant === 'fullscreen' ? '100vh' : '60vh';

  return (
    <div
      className={variant === 'fullscreen' ? 'login-v2' : undefined}
      style={{
        minHeight,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        padding: variant === 'fullscreen' ? '2rem' : '1.5rem',
      }}
    >
      <img
        src="/favicon.svg"
        alt=""
        width={48}
        height={48}
        style={{ borderRadius: 12, flexShrink: 0 }}
      />
      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            margin: 0,
            color: '#0f172a',
            fontWeight: 800,
            fontSize: '1.15rem',
            letterSpacing: '-0.02em',
          }}
        >
          {APP_NAME}
        </p>
        <p
          style={{
            margin: '0.35rem 0 0',
            color: '#64748b',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          {message}
        </p>
      </div>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );
};
