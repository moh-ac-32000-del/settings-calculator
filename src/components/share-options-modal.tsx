import { Copy, Share2, X } from 'lucide-react';
import { useState } from 'react';
import { translateKey } from '@/lib/i18n';

export default function ShareOptionsModal({
  text,
  onClose,
}: {
  text: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyText = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const shareOnWhatsApp = () => {
    window.open(
      'https://wa.me/?text=' + encodeURIComponent(text),
      '_blank',
      'noopener,noreferrer',
    );
  };

  return (
    <div
      className="dialog-backdrop fixed inset-0 z-50 flex items-end justify-center bg-[hsl(225_30%_2%/.72)] p-0 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        className="dialog-panel w-full max-w-md rounded-t-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-2xl sm:rounded-2xl sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-options-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">{translateKey('share')}</p>
            <h2 id="share-options-title" className="mt-2 text-lg font-extrabold">{translateKey('share')}</h2>
          </div>
          <button type="button" className="dialog-close-button shrink-0" onClick={onClose} aria-label={translateKey('closeWindow')} data-testid="button-close-share-options">
            <X size={17} />
          </button>
        </div>

        <div className="mt-5 grid gap-2">
          <button type="button" className="operation-link w-full justify-center" onClick={copyText} data-testid="button-copy-share-text">
            <Copy size={15} />
            {copied ? translateKey('textCopied') : translateKey('copyText')}
          </button>
          <button type="button" className="operation-link w-full justify-center" onClick={shareOnWhatsApp} data-testid="button-share-whatsapp">
            <Share2 size={15} />
            {translateKey('shareOnWhatsapp')}
          </button>
        </div>

        <button type="button" className="finish-cancel-button mt-5 w-full" onClick={onClose} data-testid="button-cancel-share-options">
          {translateKey('cancel')}
        </button>
      </div>
    </div>
  );
}
