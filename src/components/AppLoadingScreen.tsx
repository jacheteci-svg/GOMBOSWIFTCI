type AppLoadingScreenProps = {
  /** Texte sous le logo (ex. « Connexion… », « Chargement… »). */
  message?: string;
  /** Plein écran (auth) vs zone contenu (layout). */
  variant?: 'fullscreen' | 'embedded';
};

/** Logo officiel + fond noir — identité GomboSwiftCI (voir /public/logo-gomboswiftci.png). */
export const AppLoadingScreen = ({
  message = 'Chargement…',
  variant = 'embedded',
}: AppLoadingScreenProps) => {
  const minHeight = variant === 'fullscreen' ? '100vh' : '60vh';

  return (
    <div
      style={{
        minHeight,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.25rem',
        padding: variant === 'fullscreen' ? '2rem' : '1.5rem',
        background: '#000000',
        borderRadius: variant === 'embedded' ? 16 : undefined,
      }}
    >
      <img
        src="/logo-gomboswiftci.png"
        alt="GomboSwiftCI — ECOM LOGISTICS"
        width={320}
        height={140}
        style={{
          maxWidth: 'min(320px, 88vw)',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          flexShrink: 0,
        }}
      />
      <p
        style={{
          margin: 0,
          color: '#94a3b8',
          fontWeight: 600,
          fontSize: '0.9rem',
          textAlign: 'center',
        }}
      >
        {message}
      </p>
      <div
        className="spinner"
        style={{
          width: 40,
          height: 40,
          borderColor: 'rgba(138, 99, 210, 0.35)',
          borderTopColor: '#8A63D2',
        }}
      />
    </div>
  );
};
