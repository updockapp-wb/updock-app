import { X, MapPin, Camera, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import { type StartType } from '../data/spots';
import { useSpots } from '../context/useSpots';
import { useLanguage } from '../context/useLanguage';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

interface AddSpotFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    position: [number, number] | null;
}

export default function AddSpotForm({ isOpen, onClose, onSubmit, position }: AddSpotFormProps) {
    const [name, setName] = useState('');
    const [type, setType] = useState<StartType[]>(['Dockstart']);
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Extreme'>('Medium');
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    const { addSpot } = useSpots();
    const { t } = useLanguage();
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showNoPhotoConfirm, setShowNoPhotoConfirm] = useState(false);

    // Miroir de `imagePreviews` dans un ref — SANS cleanup. L'ancien effet révoquait les
    // URLs à chaque changement de `imagePreviews` (son cleanup se rejoue avant chaque re-run),
    // ce qui révoquait des aperçus ENCORE AFFICHÉS dès qu'une nouvelle image était ajoutée.
    const previewsRef = useRef<string[]>([]);
    useEffect(() => {
        previewsRef.current = imagePreviews;
    }, [imagePreviews]);

    // Libère toutes les object URLs encore vivantes. Idempotent : le ref est vidé après coup,
    // un second appel ne re-révoque rien.
    const revokeAll = useCallback(() => {
        previewsRef.current.forEach(url => URL.revokeObjectURL(url));
        previewsRef.current = [];
    }, []);

    const resetForm = () => {
        revokeAll();
        setName('');
        setType(['Dockstart']);
        setDescription('');
        setDifficulty('Medium');
        setImageFiles([]);
        setImagePreviews([]);
        setIsSending(false);
    };

    useEffect(() => {
        if (isOpen) {
            resetForm();
        }
    }, [isOpen]);

    // Filet de sécurité au démontage RÉEL. À lui seul il ne suffirait pas : `AddSpotForm` est
    // rendu inconditionnellement par `Map.tsx`, seul son contenu interne est monté/démonté par
    // `AnimatePresence` — le composant ne démonte donc jamais en usage normal.
    useEffect(() => () => revokeAll(), [revokeAll]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const remainingSlots = 5 - imageFiles.length;
            const filesToAdd = newFiles.slice(0, remainingSlots);

            const newPreviews = filesToAdd.map(file => URL.createObjectURL(file));

            setImageFiles(prev => [...prev, ...filesToAdd]);
            setImagePreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const handleRemoveImage = (index: number) => {
        URL.revokeObjectURL(imagePreviews[index]);
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const toggleType = (t: StartType) => {
        if (type.includes(t)) {
            // Prevent unselecting if it's the only one? Or just allow empty -> validation?
            // Let's allow unselect but maybe show warning if none?
            // Better behavior: toggle. If 0 left, handle gracefully or require 1.
            const newTypes = type.filter(Typ => Typ !== t);
            if (newTypes.length > 0) setType(newTypes);
        } else {
            setType([...type, t]);
        }
    };

    // Soumission effective (upload + addSpot + callbacks + reset). Réutilisée par le chemin
    // "avec photo" et par la confirmation douce "sans photo" (D-04).
    const doSubmit = async () => {
        if (!position) return;

        setIsSending(true);

        try {
            await addSpot({
                name,
                type,
                position: position,
                description,
                difficulty: difficulty,
            }, imageFiles.length > 0 ? imageFiles : undefined);


            // Success
            onSubmit({ name, type, description, position });
            onClose();
            resetForm();

        } catch (err) {
            console.error('Failed to add spot:', err);
            // Données conservées (pas de reset sur échec) + message inline (ROBUST-01).
            setError(t('form.error.submit_failed'));
            setIsSending(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation client (D-02 : nom ≤100 / description ≤2000 ; D-03 : ≥1 type).
        // Rappel : garde UX uniquement — la garde autoritaire reste RLS/Postgres (T-04-V2).
        setError(null);
        const trimmed = name.trim();
        if (!trimmed) { setError(t('form.error.name_required')); return; }
        if (trimmed.length > 100) { setError(t('form.error.name_too_long')); return; }
        if (!description.trim()) { setError(t('form.error.desc_required')); return; }
        if (description.length > 2000) { setError(t('form.error.desc_too_long')); return; }
        if (type.length === 0) { setError(t('form.error.type_required')); return; }

        if (!position) return;

        // Confirmation douce D-04 : soumission valide sans photo → dialogue non bloquant
        // (jamais culpabilisant), au lieu d'appeler addSpot directement.
        if (imageFiles.length === 0) {
            setShowNoPhotoConfirm(true);
            return;
        }

        doSubmit();
    };

    return (
        <>
        {/* `onExitComplete` : libère les aperçus une fois l'animation de fermeture terminée,
            donc APRÈS que le contenu (et ses <img>) soit démonté — aucune image cassée pendant
            la sortie. Sans cela, les URLs de la dernière session resteraient vivantes jusqu'à la
            réouverture du formulaire (la fuite mesurée dans 02-BASELINE.md). */}
        <AnimatePresence onExitComplete={revokeAll}>
            {isOpen && (
                <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center pointer-events-none">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={onClose} />

                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        className="bg-white w-full max-w-lg sm:rounded-3xl rounded-t-3xl p-6 shadow-2xl pointer-events-auto relative max-h-[90vh] overflow-y-auto"
                    >
                        <div className="w-full flex justify-center mb-6">
                            <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
                        </div>

                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">{t('add.title')}</h2>
                            <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                                <X size={20} className="text-slate-600" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Location Preview */}
                            <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-3 border border-slate-100">
                                <MapPin className="text-sky-500" />
                                <div className="flex-1">
                                    <p className="text-xs text-slate-400 uppercase font-bold">{t('add.location')}</p>
                                    <p className="font-mono text-sm text-slate-700">
                                        {position ? `${position[0].toFixed(4)}, ${position[1].toFixed(4)}` : t('add.select_map')}
                                    </p>
                                </div>
                            </div>

                            {/* Type Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">{t('add.type')}</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Dockstart', 'Rockstart', 'Dropstart', 'Deadstart', 'Rampstart', 'Beachstart'].map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => toggleType(t as StartType)}
                                            className={`py-2 px-3 rounded-xl text-xs font-bold border-2 transition-all flex-grow
                                                ${type.includes(t as StartType)
                                                    ? 'border-sky-500 bg-sky-50 text-sky-600'
                                                    : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Difficulty */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">{t('spot.difficulty')}</label>
                                <select
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(e.target.value as any)}
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-sky-500 focus:outline-none font-medium appearance-none"
                                >
                                    <option value="Easy">Easy</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
                                    <option value="Extreme">Extreme</option>
                                </select>
                            </div>

                            {/* Name Input */}
                            <Input
                                surface="light"
                                label={t('add.name')}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('add.placeholder_name')}
                                maxLength={100}
                            />

                            {/* Description */}
                            <Input
                                surface="light"
                                multiline
                                label={t('add.desc')}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={t('add.placeholder_desc')}
                                maxLength={2000}
                            />

                            {/* Photo Upload - Multiple Photos */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    {t('add.photo')} ({imageFiles.length}/5)
                                </label>

                                {/* Photo Grid */}
                                <div className="grid grid-cols-3 gap-3 mb-3">
                                    {imagePreviews.map((preview, index) => (
                                        <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 group">
                                            <img src={preview} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(index)}
                                                className="absolute top-2 right-2 p-2 bg-rose-500 hover:bg-rose-600 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={14} className="text-white" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Photo Button */}
                                {imageFiles.length < 5 && (
                                    <label className="block cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={handleImageSelect}
                                        />
                                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-sky-300 transition-all">
                                            <Camera size={32} className="mb-2" />
                                            <span className="text-sm font-medium">{t('add.photo')}</span>
                                            <span className="text-xs mt-1">Max 5 photos</span>
                                        </div>
                                    </label>
                                )}
                            </div>
                            {error && (
                                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
                            )}
                            <Button type="submit" variant="primary" size="lg" loading={isSending} className="w-full">
                                {isSending ? t('add.sending') : t('add.submit')}
                            </Button>
                        </form>
                    </motion.div>
                </div>
            )
            }
        </AnimatePresence >

            {/* Confirmation douce « pas de photo » (D-04) — Modal light+center, non bloquant,
                deux actions positives, jamais culpabilisant. */}
            <Modal isOpen={showNoPhotoConfirm} onClose={() => setShowNoPhotoConfirm(false)} surface="light" layout="center">
                <div className="text-center space-y-4">
                    <h3 className="text-xl font-bold text-slate-800">{t('form.confirm.no_photo.title')}</h3>
                    <p className="text-sm text-slate-500">{t('form.confirm.no_photo.body')}</p>
                    <div className="flex flex-col gap-2 pt-2">
                        <Button
                            variant="primary"
                            size="lg"
                            className="w-full"
                            onClick={() => { setShowNoPhotoConfirm(false); doSubmit(); }}
                        >
                            {t('form.confirm.no_photo.confirm')}
                        </Button>
                        <Button
                            variant="secondary"
                            size="lg"
                            className="w-full"
                            onClick={() => setShowNoPhotoConfirm(false)}
                        >
                            {t('form.confirm.no_photo.cancel')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
