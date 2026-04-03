import { AlertTriangle } from 'lucide-react';

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
};

export const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'default',
  onConfirm,
  onCancel,
}: Props) => {
  if (!open) return null;

  return (
    <div className="modal-backdrop" style={{ zIndex: 4000 }} onClick={onCancel} role="presentation">
      <div
        className="modal-content modal-nexus"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        style={{ padding: 0 }}
      >
        <div className="modal-shell">
          <div className="modal-nexus-accent" />
          <div className="modal-body-scroll" style={{ padding: '1.5rem 1.5rem 0.25rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div
                className="modal-nexus-icon"
                data-variant={variant}
                style={{
                  flexShrink: 0,
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle size={22} strokeWidth={2.4} />
              </div>
              <div style={{ minWidth: 0 }}>
                <h2 id="confirm-dialog-title" className="modal-nexus-title">
                  {title}
                </h2>
                <p className="modal-nexus-body">{message}</p>
              </div>
            </div>
          </div>
          <div className="modal-nexus-actions">
            <button type="button" className="btn btn-outline modal-nexus-btn" onClick={onCancel}>
              {cancelLabel}
            </button>
            <button
              type="button"
              className={`btn modal-nexus-btn ${variant === 'danger' ? 'modal-nexus-btn-danger' : 'btn-primary'}`}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
