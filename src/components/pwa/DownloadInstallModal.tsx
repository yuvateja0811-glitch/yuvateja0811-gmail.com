import React, { useState } from 'react';
import {
  Apple,
  ArrowDownToLine,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Download,
  ExternalLink,
  Globe,
  Info,
  Laptop,
  Monitor,
  Share2,
  Smartphone,
  Sparkles,
  Terminal,
  X
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface DownloadInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadInstallModal: React.FC<DownloadInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'device' | 'source'>('device');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyCode = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(label);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-blue-950/30 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Download className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                How to Download & Install This App
              </h2>
              <p className="text-xs text-slate-400">
                GVP CSE-2 Academic & Attendance Management Portal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4 border-b border-slate-800/80 bg-slate-950/40 flex gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('device')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'device'
                ? 'border-blue-500 text-blue-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Install on Mobile & PC (Instant App)</span>
          </button>
          <button
            onClick={() => setActiveTab('source')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'source'
                ? 'border-blue-500 text-blue-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Download Source Code (Developers)</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {activeTab === 'device' ? (
            <div className="space-y-6">
              {/* Status Banner */}
              {isInstalled ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm text-white">App is Already Installed!</h4>
                    <p className="text-slate-300 text-[11px] mt-0.5">
                      You are running GVP CSE-2 as a standalone application on this device.
                    </p>
                  </div>
                </div>
              ) : isInstallable ? (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      <Sparkles className="w-5 h-5 text-blue-300" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">Instant 1-Click Install Available</h4>
                      <p className="text-slate-300 text-[11px] mt-0.5">
                        Your browser supports direct installation onto your home screen or desktop.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleInstallClick}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install App on Device</span>
                  </button>
                </div>
              ) : null}

              {/* Instructions by Platform */}
              <div className="space-y-4">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-400" />
                  <span>Installation Instructions by Operating System</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Android Phones */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                        <Smartphone className="w-4 h-4 text-emerald-400" />
                        Android Phones (Chrome / Edge)
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        1-Click
                      </span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed text-[11px]">
                      <li>Open this URL in Google Chrome on your Android phone.</li>
                      <li>
                        Tap the blue <strong>"Install App"</strong> button or tap the browser menu (<strong>⋮</strong> three dots at top-right).
                      </li>
                      <li>
                        Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                      </li>
                      <li>The GVP CSE-2 app icon will appear alongside your native Android apps!</li>
                    </ol>
                  </div>

                  {/* iPhones / iPads (iOS) */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                        <Apple className="w-4 h-4 text-slate-200" />
                        iPhones & iPads (Safari)
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        Safari Share
                      </span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed text-[11px]">
                      <li>Open this portal in <strong>Safari</strong> on your iPhone.</li>
                      <li>
                        Tap the <strong>Share</strong> button (the square with an arrow pointing up at the bottom).
                      </li>
                      <li>
                        Scroll down and tap <strong>"Add to Home Screen"</strong>.
                      </li>
                      <li>
                        Tap <strong>"Add"</strong> in the top-right corner. It will now launch full-screen like an iOS app!
                      </li>
                    </ol>
                  </div>

                  {/* Windows Laptops */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                        <Laptop className="w-4 h-4 text-blue-400" />
                        Windows Laptops (Chrome / Edge)
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        Desktop App
                      </span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed text-[11px]">
                      <li>Open the portal in Chrome or Microsoft Edge.</li>
                      <li>Look at the right side of the address bar at the top.</li>
                      <li>
                        Click the small <strong>Install</strong> icon (computer with down arrow) or press menu <strong>(⋯) &gt; Apps &gt; Install this site as an app</strong>.
                      </li>
                      <li>A desktop shortcut and start menu launcher are created automatically.</li>
                    </ol>
                  </div>

                  {/* MacBooks */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                        <Monitor className="w-4 h-4 text-purple-400" />
                        macOS (Chrome / Safari 17+)
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        Dock App
                      </span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed text-[11px]">
                      <li>In Safari: Click <strong>File &gt; Add to Dock...</strong></li>
                      <li>In Chrome: Click <strong>Settings (⋮) &gt; Save and share &gt; Install page as app...</strong></li>
                      <li>The app runs in its own window without browser toolbars.</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-bold text-sm text-white">How to Get the Source Code</h4>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  You can download the entire project repository or clone it to run on your local machine, deploy to Firebase Hosting, Netlify, or Vercel.
                </p>
              </div>

              {/* Step by step terminal commands */}
              <div className="space-y-3">
                <h5 className="font-bold text-white text-xs">Running Locally on Your Computer:</h5>

                {/* Step 1 */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-blue-300">1. Install Dependencies</span>
                    <button
                      onClick={() => copyCode('npm install', 'step1')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] flex items-center gap-1"
                    >
                      {copiedCmd === 'step1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCmd === 'step1' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-emerald-300 text-[11px]">
                    npm install
                  </pre>
                </div>

                {/* Step 2 */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-blue-300">2. Start Development Server</span>
                    <button
                      onClick={() => copyCode('npm run dev', 'step2')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] flex items-center gap-1"
                    >
                      {copiedCmd === 'step2' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCmd === 'step2' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-emerald-300 text-[11px]">
                    npm run dev
                  </pre>
                  <p className="text-[11px] text-slate-400">
                    Opens on <code className="text-white">http://localhost:3000</code> with live Firebase Firestore connection.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-blue-300">3. Build for Production</span>
                    <button
                      onClick={() => copyCode('npm run build', 'step3')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] flex items-center gap-1"
                    >
                      {copiedCmd === 'step3' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCmd === 'step3' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-emerald-300 text-[11px]">
                    npm run build
                  </pre>
                  <p className="text-[11px] text-slate-400">
                    Outputs production-ready static assets in the <code className="text-white">dist/</code> directory.
                  </p>
                </div>
              </div>

              {/* Firebase configuration notes */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-1.5 text-blue-300 font-semibold">
                  <Info className="w-3.5 h-3.5" />
                  <span>Firebase Configuration:</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  The application is configured with your provisioned Cloud Firestore database in <code className="text-white">firebase-applet-config.json</code> and <code className="text-white">firestore.rules</code>. All student roll numbers and attendance records persist securely.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            PWA Standalone + Cloud Firestore
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
