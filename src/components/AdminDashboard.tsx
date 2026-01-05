import { X, Check, Trash2, MapPin, Edit, Save, LayoutList, CircleAlert, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSpots } from '../context/SpotsContext';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { type Spot, type StartType } from '../data/spots';

interface AdminDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    onSpotSelect: (spot: Spot) => void;
}

export default function AdminDashboard({ isOpen, onClose, onSpotSelect }: AdminDashboardProps) {
    const { spots, approveSpot, deleteSpot, updateSpot } = useSpots();
    const { t } = useLanguage();
    const [view, setView] = useState<'pending' | 'all'>('pending');
    const [editingSpot, setEditingSpot] = useState<Spot | null>(null);
    const [previewSpot, setPreviewSpot] = useState<Spot | null>(null);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    const pendingSpots = spots.filter(s => s.is_approved === false);
    // Sort all spots by date created or just name? Default probably fine for now.
    // Ideally we want to see new ones first, but context data seems mixed.
    // Let's just use spots as is.
    const allSpots = spots;

    const handleSaveEdit = async () => {
        if (!editingSpot) return;
        await updateSpot(editingSpot);
        setEditingSpot(null);
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[5000] bg-slate-50">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full h-full flex flex-col"
                        >
                            {/* Header */}
                            <div className="bg-slate-900 text-white p-6 pb-0">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold">{t('admin.title')}</h2>
                                        <p className="text-slate-400 text-sm">{t('admin.subtitle')}</p>
                                    </div>
                                    <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Tabs */}
                                <div className="flex gap-6 border-b border-slate-700">
                                    <button
                                        onClick={() => setView('pending')}
                                        className={`pb-4 text-sm font-bold flex items-center gap-2 transition-colors relative ${view === 'pending' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        <CircleAlert size={16} />
                                        Pending ({pendingSpots.length})
                                        {view === 'pending' && <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-1 bg-sky-500 rounded-t-full" />}
                                    </button>
                                    <button
                                        onClick={() => setView('all')}
                                        className={`pb-4 text-sm font-bold flex items-center gap-2 transition-colors relative ${view === 'all' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        <LayoutList size={16} />
                                        All Spots ({allSpots.length})
                                        {view === 'all' && <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-1 bg-sky-500 rounded-t-full" />}
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 relative">
                                {view === 'pending' ? (
                                    pendingSpots.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                            <Check size={48} className="mb-4 text-emerald-500 opacity-50" />
                                            <p className="font-medium">{t('admin.empty_title')}</p>
                                            <p className="text-sm">{t('admin.empty_desc')}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {pendingSpots.map(spot => (
                                                <div
                                                    key={spot.id}
                                                    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4 cursor-pointer hover:border-sky-300 hover:shadow-md transition-all"
                                                    onClick={() => {
                                                        setPreviewSpot(spot);
                                                        setCurrentPhotoIndex(0);
                                                    }}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                                                {spot.name}
                                                                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-md uppercase tracking-wide">
                                                                    {spot.type.join(', ')}
                                                                </span>
                                                            </h3>
                                                            <p className="text-slate-500 text-sm mt-1">{spot.description}</p>
                                                        </div>
                                                        <div className="flex items-start gap-3">
                                                            <div className="text-right">
                                                                <div className="flex items-center gap-1 text-slate-400 text-xs font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                                                    <MapPin size={12} />
                                                                    {spot.position[0].toFixed(4)}, {spot.position[1].toFixed(4)}
                                                                </div>
                                                            </div>
                                                            <Eye size={20} className="text-sky-500 mt-1" />
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-3 pt-4 border-t border-slate-50" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => approveSpot(spot.id)}
                                                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                                                        >
                                                            <Check size={18} />
                                                            {t('admin.approve')}
                                                        </button>
                                                        <button
                                                            onClick={() => deleteSpot(spot.id)}
                                                            className="px-4 bg-rose-50 hover:bg-rose-100 text-rose-500 font-bold rounded-xl flex items-center justify-center transition-colors"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                ) : (
                                    // All Spots List
                                    <div className="space-y-4">
                                        {allSpots.map(spot => (
                                            <div key={spot.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                                        {spot.name}
                                                        {!spot.is_approved && <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded uppercase font-bold">Pending</span>}
                                                    </h3>
                                                    <p className="text-xs text-slate-400 uppercase font-bold">{spot.type.join(', ')}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setEditingSpot(spot)}
                                                        className="p-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteSpot(spot.id)}
                                                        className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Edit Overlay */}
                                <AnimatePresence>
                                    {editingSpot && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 20 }}
                                            className="absolute inset-0 bg-white z-50 p-6 flex flex-col"
                                        >
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-xl font-bold text-slate-800">Edit Spot</h3>
                                                <button onClick={() => setEditingSpot(null)} className="p-2 bg-slate-100 rounded-full">
                                                    <X size={20} />
                                                </button>
                                            </div>

                                            <div className="flex-1 overflow-y-auto space-y-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                                                    <input
                                                        type="text"
                                                        value={editingSpot.name}
                                                        onChange={e => setEditingSpot({ ...editingSpot, name: e.target.value })}
                                                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-sky-500 focus:outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {['Dockstart', 'Rockstart', 'Dropstart', 'Deadstart', 'Rampstart'].map(t => (
                                                            <button
                                                                key={t}
                                                                onClick={() => {
                                                                    const sType = t as StartType;
                                                                    const newTypes = editingSpot.type.includes(sType)
                                                                        ? editingSpot.type.filter(x => x !== sType)
                                                                        : [...editingSpot.type, sType];
                                                                    if (newTypes.length > 0) setEditingSpot({ ...editingSpot, type: newTypes });
                                                                }}
                                                                className={`py-2 px-3 rounded-lg text-xs font-bold border-2 transition-all flex-grow
                                                                ${editingSpot.type.includes(t as StartType)
                                                                        ? 'border-sky-500 bg-sky-50 text-sky-600'
                                                                        : 'border-slate-100 bg-white text-slate-400'}`}
                                                            >
                                                                {t}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                                                    <textarea
                                                        value={editingSpot.description}
                                                        onChange={e => setEditingSpot({ ...editingSpot, description: e.target.value })}
                                                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-sky-500 focus:outline-none min-h-[100px]"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">Difficulty</label>
                                                    <div className="flex gap-1">
                                                        {['Easy', 'Medium', 'Hard', 'Extreme'].map(d => (
                                                            <button
                                                                key={d}
                                                                onClick={() => setEditingSpot({ ...editingSpot, difficulty: d as any })}
                                                                className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 ${editingSpot.difficulty === d ? 'border-sky-500 bg-sky-50 text-sky-600' : 'border-slate-100 text-slate-400'}`}
                                                            >
                                                                {d}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-slate-100">
                                                <button
                                                    onClick={handleSaveEdit}
                                                    className="w-full bg-sky-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
                                                >
                                                    <Save size={18} />
                                                    Save Changes
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Spot Preview Modal */}
            <AnimatePresence>
                {previewSpot && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[6000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setPreviewSpot(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-slate-200 flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">{previewSpot.name}</h2>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${previewSpot.type.includes('Dockstart') ? 'bg-sky-100 text-sky-700' :
                                            previewSpot.type.includes('Rockstart') ? 'bg-pink-100 text-pink-700' :
                                                'bg-teal-100 text-teal-700'
                                            }`}>
                                            {previewSpot.type.join(' • ')}
                                        </div>
                                        <span className="text-sm text-slate-500">
                                            {previewSpot.difficulty}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setPreviewSpot(null)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {/* Photos Gallery */}
                                {previewSpot.image_urls && previewSpot.image_urls.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="font-bold text-slate-800 mb-3">Photos ({previewSpot.image_urls.length})</h3>
                                        <div className="relative rounded-xl overflow-hidden bg-slate-100 aspect-video">
                                            <img
                                                src={previewSpot.image_urls[currentPhotoIndex]}
                                                alt={`${previewSpot.name} - Photo ${currentPhotoIndex + 1}`}
                                                className="w-full h-full object-cover"
                                            />

                                            {/* Navigation Arrows */}
                                            {previewSpot.image_urls.length > 1 && (
                                                <>
                                                    <button
                                                        onClick={() => setCurrentPhotoIndex(prev =>
                                                            prev > 0 ? prev - 1 : previewSpot.image_urls!.length - 1
                                                        )}
                                                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                                                    >
                                                        <ChevronLeft size={24} className="text-white" />
                                                    </button>
                                                    <button
                                                        onClick={() => setCurrentPhotoIndex(prev =>
                                                            prev < previewSpot.image_urls!.length - 1 ? prev + 1 : 0
                                                        )}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                                                    >
                                                        <ChevronRight size={24} className="text-white" />
                                                    </button>
                                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                                                        {currentPhotoIndex + 1} / {previewSpot.image_urls.length}
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Thumbnails */}
                                        {previewSpot.image_urls.length > 1 && (
                                            <div className="grid grid-cols-5 gap-2 mt-3">
                                                {previewSpot.image_urls.map((url, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() => setCurrentPhotoIndex(idx)}
                                                        className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${idx === currentPhotoIndex ? 'border-sky-500 scale-105' : 'border-transparent hover:border-slate-300'
                                                            }`}
                                                    >
                                                        <img src={url} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-slate-50 rounded-xl p-4">
                                        <p className="text-xs text-slate-500 mb-1">Difficulté</p>
                                        <p className="font-bold text-slate-900">{previewSpot.difficulty}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-4">
                                        <p className="text-xs text-slate-500 mb-1">Hauteur</p>
                                        <p className="font-bold text-slate-900">{previewSpot.height || '-'} m</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-4 col-span-2">
                                        <p className="text-xs text-slate-500 mb-1">Coordonnées</p>
                                        <p className="font-mono text-sm text-slate-900">
                                            {previewSpot.position[0].toFixed(6)}, {previewSpot.position[1].toFixed(6)}
                                        </p>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="mb-6">
                                    <h3 className="font-bold text-slate-800 mb-3">Description</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                                        {previewSpot.description}
                                    </p>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-6 border-t border-slate-200 flex gap-3">
                                <button
                                    onClick={() => {
                                        onSpotSelect(previewSpot);
                                        setPreviewSpot(null);
                                    }}
                                    className="flex-1 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    <MapPin size={18} />
                                    Voir sur la carte
                                </button>
                                {!previewSpot.is_approved && (
                                    <>
                                        <button
                                            onClick={() => {
                                                approveSpot(previewSpot.id);
                                                setPreviewSpot(null);
                                            }}
                                            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-colors flex items-center gap-2"
                                        >
                                            <Check size={18} />
                                            Approuver
                                        </button>
                                        <button
                                            onClick={() => {
                                                deleteSpot(previewSpot.id);
                                                setPreviewSpot(null);
                                            }}
                                            className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
