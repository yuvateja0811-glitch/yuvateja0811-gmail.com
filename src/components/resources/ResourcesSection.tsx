import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Code2,
  Copy,
  ExternalLink,
  FileCode,
  FileText,
  FolderArchive,
  Layers,
  Plus,
  Search,
  Sparkles,
  Terminal,
  Trash2,
  X
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { OFFICIAL_RESOURCES } from '../../data/defaultResources';
import { OFFICIAL_SUBJECTS } from '../../data/subjects';
import { db } from '../../firebase/config';
import { deleteResourceItem, saveResourceItem } from '../../services/portalService';
import { ResourceItem } from '../../types';

export const ResourcesSection: React.FC = () => {
  const { userRole, currentUser } = useAuth();
  const isFacultyOrAdmin = userRole === 'admin' || userRole === 'teacher';

  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [activePdfDoc, setActivePdfDoc] = useState<'lectureNotes' | 'tutorialSheets' | null>(null);

  // Firestore resources
  const [customResources, setCustomResources] = useState<ResourceItem[]>([]);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form fields for adding material
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(OFFICIAL_SUBJECTS[0].name);
  const [type, setType] = useState<'drive_folder' | 'web_link' | 'pdf_document'>('drive_folder');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // Real-time listener for custom resources
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'resources'), (snap) => {
      const list: ResourceItem[] = [];
      snap.forEach((doc) => {
        list.push(doc.data() as ResourceItem);
      });
      setCustomResources(list);
    }, (err) => {
      console.warn('Resources listener notice:', err.message);
    });

    return () => unsub();
  }, []);

  const copyToClipboard = (linkUrl: string) => {
    navigator.clipboard.writeText(linkUrl);
    setCopiedLink(linkUrl);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    setSaving(true);
    try {
      const newItem: ResourceItem = {
        id: `res_${Date.now()}`,
        title: title.trim(),
        subject,
        type,
        url: url.trim(),
        description: description.trim(),
        isOfficial: false,
      };
      await saveResourceItem(newItem);
      setShowAddModal(false);
      setTitle('');
      setUrl('');
      setDescription('');
    } catch (err: any) {
      alert('Error saving material: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this study resource?')) return;
    try {
      await deleteResourceItem(id);
    } catch (err: any) {
      alert('Error deleting material: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                ACADEMIC REPOSITORY
              </span>
              <span className="text-xs text-slate-400 font-mono">CSE-2 Official Resources</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-2 tracking-tight">
              Study Materials & Course Resources
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Access official course materials, lecture notes, laboratory guides, and question banks provided by faculty.
            </p>
          </div>

          {isFacultyOrAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Study Material</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary 3 Subject Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. FUNDAMENTALS OF WEB DESIGNING */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-amber-500/50 transition-all shadow-xl flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <FolderArchive className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                GOOGLE DRIVE
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Course Resource</span>
              <h3 className="text-lg font-bold text-white mt-1 group-hover:text-amber-300 transition-colors">
                Fundamentals of Web Designing
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Official Google Drive repository containing HTML5, CSS3, Flexbox/Grid, Responsive Design patterns, Figma wireframes, and CSE laboratory assignments.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Included Units & Labs:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Unit 1: Semantic HTML & Document Architecture</li>
                <li>Unit 2: Modern CSS3 & Responsive UI</li>
                <li>Lab practical experiments & rubrics</li>
              </ul>
            </div>
          </div>

          <div className="pt-6 space-y-2">
            <a
              href="https://drive.google.com/drive/folders/18drGNtfsfY1EBzkQZhKYXHE9BlU1jr4V?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Open Google Drive Folder</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => copyToClipboard('https://drive.google.com/drive/folders/18drGNtfsfY1EBzkQZhKYXHE9BlU1jr4V?usp=sharing')}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <Copy className="w-3 h-3" />
              <span>{copiedLink?.includes('18drGN') ? 'Link Copied to Clipboard!' : 'Copy Drive Link'}</span>
            </button>
          </div>
        </div>

        {/* 2. ENGINEERING PHYSICS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-cyan-500/50 transition-all shadow-xl flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                FACULTY PORTAL
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Course Resource</span>
              <h3 className="text-lg font-bold text-white mt-1 group-hover:text-cyan-300 transition-colors">
                Engineering Physics (Dr. Babu)
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Dedicated learning portal developed by Dr. Babu. Access unit-wise physics lecture modules, wave optics derivations, laser technology, and sample questions.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
              <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Featured Modules:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Wave Optics (Interference, Diffraction)</li>
                <li>Lasers & Optical Fiber Communication</li>
                <li>Solved numerical problems for Mid-1</li>
              </ul>
            </div>
          </div>

          <div className="pt-6 space-y-2">
            <a
              href="https://drbabu.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md shadow-cyan-600/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Visit drbabu.netlify.app</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => copyToClipboard('https://drbabu.netlify.app/')}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <Copy className="w-3 h-3" />
              <span>{copiedLink?.includes('drbabu') ? 'Link Copied!' : 'Copy Portal URL'}</span>
            </button>
          </div>
        </div>

        {/* 3. C PROGRAMMING */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/50 transition-all shadow-xl flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Code2 className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                OFFICIAL PDF DOCS
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Course Resource</span>
              <h3 className="text-lg font-bold text-white mt-1 group-hover:text-emerald-300 transition-colors">
                C Programming (Unit-2 Materials)
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Official CSE Unit-2 Part-1 Lecture Notes and Unit II Operators Tutorial Sheets. Includes complete operators hierarchy and practice questions.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setActivePdfDoc('lectureNotes')}
                className="w-full p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-left transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Unit-2 Part-1 LectureNotes(2).pdf</div>
                    <div className="text-[10px] text-slate-400">Control structures & loops lecture notes</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => setActivePdfDoc('tutorialSheets')}
                className="w-full p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-left transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Unit II-Operators _TutorialSheets(2).pdf</div>
                    <div className="text-[10px] text-slate-400">Bitwise, logical & arithmetic questions</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={() => setActivePdfDoc('lectureNotes')}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Open C Notes & Sheets Viewer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Additional Custom Resources (Added by Faculty or Admin) */}
      {customResources.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Faculty Added Materials ({customResources.length})</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customResources.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-blue-500/40 transition-all shadow-md flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      {item.subject}
                    </span>
                    {isFacultyOrAdmin && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        title="Delete resource"
                        className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <h4 className="font-bold text-white text-sm mt-2">{item.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.description}</p>
                </div>

                <div className="pt-2">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-semibold text-xs border border-blue-500/30 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Open Material</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL / VIEWER for C Programming Documents */}
      {activePdfDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {activePdfDoc === 'lectureNotes'
                      ? 'Unit-2 Part-1 LectureNotes(2).pdf'
                      : 'Unit II-Operators _TutorialSheets(2).pdf'}
                  </h3>
                  <p className="text-xs text-slate-400">Programming for Problem Solving through C • CSE-2</p>
                </div>
              </div>
              <button
                onClick={() => setActivePdfDoc(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
              {activePdfDoc === 'lectureNotes' ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300">
                    <h4 className="font-bold text-sm text-white mb-1">Unit 2 Part 1 Summary Overview</h4>
                    <p className="leading-relaxed">
                      This lecture module covers decision making, branching, conditional statements, and iterative loop controls in ANSI C.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-bold text-white text-sm">Key Topics Covered in Lecture Notes:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <strong className="text-blue-300">1. Conditional Branching</strong>
                        <p className="text-slate-400 text-[11px]">
                          Simple if, if-else, nested if-else, and else-if ladder constructs with syntax rules.
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <strong className="text-blue-300">2. Switch-Case Statement</strong>
                        <p className="text-slate-400 text-[11px]">
                          Multi-way branching, integral/char expression constraints, and fall-through mechanics without break.
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <strong className="text-blue-300">3. Iteration (Loops)</strong>
                        <p className="text-slate-400 text-[11px]">
                          Pre-test loops (<code className="text-emerald-400">while</code>, <code className="text-emerald-400">for</code>) and post-test loop (<code className="text-emerald-400">do-while</code>).
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <strong className="text-blue-300">4. Jump Statements</strong>
                        <p className="text-slate-400 text-[11px]">
                          Usage of <code className="text-amber-400">break</code>, <code className="text-amber-400">continue</code>, <code className="text-amber-400">goto</code>, and <code className="text-amber-400">return</code>.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-2">
                    <span className="text-slate-400 font-bold block">// Sample Code Pattern: Nested Loop Multi-dimensional traversal</span>
                    <pre className="text-emerald-300 overflow-x-auto">
{`#include <stdio.h>
int main() {
    int i, j;
    for (i = 1; i <= 4; i++) {
        for (j = 1; j <= i; j++) {
            printf("%d ", j);
        }
        printf("\\n");
    }
    return 0;
}`}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-indigo-300">
                    <h4 className="font-bold text-sm text-white mb-1">Unit II Operators Tutorial Sheet Overview</h4>
                    <p className="leading-relaxed">
                      Practice questions testing evaluation orders, bitwise manipulation, ternary expressions, and side-effect interactions.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-bold text-white text-sm">Operator Precedence & Associativity Hierarchy:</h5>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                            <th className="py-2 px-3">Priority</th>
                            <th className="py-2 px-3">Operators</th>
                            <th className="py-2 px-3">Associativity</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                          <tr>
                            <td className="py-2 px-3 text-amber-400">1 (Highest)</td>
                            <td className="py-2 px-3 text-white">() [] -&gt; . ++(post) --(post)</td>
                            <td className="py-2 px-3 text-slate-400">Left to Right</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 text-amber-400">2 (Unary)</td>
                            <td className="py-2 px-3 text-white">++(pre) --(pre) + - ! ~ * & sizeof</td>
                            <td className="py-2 px-3 text-slate-400">Right to Left</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 text-amber-400">3 (Multiplicative)</td>
                            <td className="py-2 px-3 text-white">* / %</td>
                            <td className="py-2 px-3 text-slate-400">Left to Right</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 text-amber-400">4 (Additive)</td>
                            <td className="py-2 px-3 text-white">+ -</td>
                            <td className="py-2 px-3 text-slate-400">Left to Right</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 text-amber-400">5 (Bitwise Shift)</td>
                            <td className="py-2 px-3 text-white">&lt;&lt; &gt;&gt;</td>
                            <td className="py-2 px-3 text-slate-400">Left to Right</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Department of Computer Science & Engineering</span>
              <button
                onClick={() => setActivePdfDoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add New Resource Item */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-blue-400">
                <Plus className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Add Study Material / Link</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResource} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {OFFICIAL_SUBJECTS.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                  <option value="General CSE-2 Academic Notice">General CSE-2 Academic Notice</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Title / Topic Name</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Unit 3 Trees & Graphs Practice Problems"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Resource URL / Drive Link</label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Short Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe what this resource covers..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/20"
                >
                  {saving ? 'Saving...' : 'Publish to Portal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
