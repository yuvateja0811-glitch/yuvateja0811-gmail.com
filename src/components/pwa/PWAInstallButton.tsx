import React from 'react';
import { Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  onOpenGuide: () => void;
  variant?: 'navbar' | 'hero' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ onOpenGuide, variant = 'navbar' }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();

  const handleAction = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (!outcome) {
        onOpenGuide();
      }
    } else {
      onOpenGuide();
    }
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={handleAction}
        title="Download or Install GVP CSE-2 App"
        className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{isInstalled ? 'App Guide' : 'Install App'}</span>
      </button>
    );
  }

  if (variant === 'hero') {
    return (
      <button
        onClick={handleAction}
        className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-colors flex items-center gap-2"
      >
        <Download className="w-4 h-4 text-emerald-400" />
        <span>{isInstalled ? 'How to Download / Export' : 'Download / Install App'}</span>
      </button>
    );
  }

  // Default navbar variant
  return (
    <button
      onClick={handleAction}
      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
    >
      <Download className="w-3.5 h-3.5 text-emerald-400" />
      <span>{isInstalled ? 'App Installed' : 'Install / Download App'}</span>
    </button>
  );
};
