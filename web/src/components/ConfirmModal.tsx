import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AlertTriangle, Trash2, Unlink } from 'lucide-react';

type ConfirmVariant = 'danger' | 'warning';

interface ConfirmOpts {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  icon?: 'trash' | 'unlink' | 'warning';
}

interface ConfirmContextType {
  confirm: (opts: ConfirmOpts) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

const VARIANT_STYLES = {
  danger:  { btn: 'linear-gradient(135deg,#ef4444,#dc2626)', hover: '#dc2626', icon: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  warning: { btn: 'linear-gradient(135deg,#f59e0b,#d97706)', hover: '#d97706', icon: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
};

function ConfirmDialog({
  opts,
  onResult,
}: {
  opts: ConfirmOpts;
  onResult: (v: boolean) => void;
}) {
  const variant = opts.variant ?? 'danger';
  const s = VARIANT_STYLES[variant];
  const Icon = opts.icon === 'trash' ? Trash2 : opts.icon === 'unlink' ? Unlink : AlertTriangle;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        animation: 'fadeIn 0.15s ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) onResult(false); }}
    >
      <div
        style={{
          background: 'white', borderRadius: 20, padding: '28px 28px 24px',
          width: '100%', maxWidth: 400,
          boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
          animation: 'slideUp 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Icon */}
        <div style={{
          width: 52, height: 52, borderRadius: 16,
          background: s.bg, border: `2px solid ${s.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <Icon size={22} style={{ color: s.icon }} />
        </div>

        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
          {opts.title}
        </h3>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 24px', lineHeight: 1.6 }}>
          {opts.message}
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => onResult(false)}
            style={{
              flex: 1, padding: '11px 16px',
              background: '#f8fafc', border: '1.5px solid #e2e8f0',
              borderRadius: 12, fontSize: 13, fontWeight: 600,
              color: '#64748b', cursor: 'pointer',
            }}
          >
            {opts.cancelLabel ?? 'Bekor'}
          </button>
          <button
            onClick={() => onResult(true)}
            style={{
              flex: 1, padding: '11px 16px',
              background: s.btn, border: 'none',
              borderRadius: 12, fontSize: 13, fontWeight: 600,
              color: 'white', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(220,38,38,0.25)',
            }}
          >
            {opts.confirmLabel ?? "Ha, davom eting"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(16px) scale(0.96) } to { opacity:1; transform:none } }
      `}</style>
    </div>
  );
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ opts: ConfirmOpts; resolve: (v: boolean) => void } | null>(null);

  const confirm = useCallback((opts: ConfirmOpts): Promise<boolean> => {
    return new Promise(resolve => {
      setState({ opts, resolve });
    });
  }, []);

  const handleResult = useCallback((v: boolean) => {
    state?.resolve(v);
    setState(null);
  }, [state]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && <ConfirmDialog opts={state.opts} onResult={handleResult} />}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be inside ConfirmProvider');
  return ctx.confirm;
}
