'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3005';

export default function CreateEventPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    date: '',
    location: '',
    description: '',
    price: '',
    imageEmoji: '🎫',
    requiresKyc: true,
    minAge: 18,
    minReputation: 0,
    maxTickets: 1000,
  });

  // ── Image handling ─────────────────────────────────────────────────────────
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPG, PNG, WEBP, etc.)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  }, []);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const removeImage = () => { setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; };

  // ── Form handling ──────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${BACKEND_URL}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          imageUrl: imagePreview || null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        router.push('/');
      } else {
        setError(data.error || 'Failed to create event');
      }
    } catch {
      setError('Network error. Please check if the backend is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const emojiOptions = ['🎫', '🏎️', '💻', '🎵', '₿', '🎪', '🎭', '🏆', '🎨', '🎬', '⚽', '🎸'];

  const inputClass =
    'mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 shadow-sm focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 focus:outline-none px-4 py-2.5 text-sm transition-all duration-200';

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── PAGE HEADER ─────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden border-b border-gray-100"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #f5c51820 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      >
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
          <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-600 hover:text-yellow-700 mb-4 transition-colors">
            ← Back to Dashboard
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/50 bg-yellow-50 px-3 py-1 mb-3 block">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
            <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest">New Event</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900">Create Event</h1>
          <p className="mt-1 text-sm text-gray-500">Add a new event to the RacePass platform.</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── COVER IMAGE UPLOAD ────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 hover:border-yellow-300 transition-colors duration-200">
            <h2 className="text-xs font-bold text-yellow-600 uppercase tracking-widest mb-5">Cover Image</h2>

            {imagePreview ? (
              /* Preview */
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 group">
                <img
                  src={imagePreview}
                  alt="Event cover preview"
                  className="w-full h-56 object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-gray-800 shadow-lg hover:bg-yellow-50 transition-colors"
                  >
                    Change Image
                  </button>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="rounded-xl bg-red-500 px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-red-400 transition-colors"
                  >
                    Remove
                  </button>
                </div>
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1 text-[10px] font-bold text-white">
                  Cover Image Set
                </div>
              </div>
            ) : (
              /* Drop zone */
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer h-44 flex flex-col items-center justify-center gap-3 ${isDragging
                    ? 'border-yellow-400 bg-yellow-50 scale-[1.01]'
                    : 'border-gray-200 bg-gray-50 hover:border-yellow-300 hover:bg-yellow-50/50'
                  }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? 'bg-yellow-400' : 'bg-gray-100'}`}>
                  <svg className={`w-6 h-6 ${isDragging ? 'text-black' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-700">
                    {isDragging ? 'Drop to upload' : 'Drag & drop or click to upload'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP — max 5 MB</p>
                </div>
                {!isDragging && (
                  <span className="text-xs text-gray-400 absolute bottom-3">
                    If no image is uploaded, the emoji will be shown instead
                  </span>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* ── BASIC INFO ──────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 hover:border-yellow-300 transition-colors duration-200">
            <h2 className="text-xs font-bold text-yellow-600 uppercase tracking-widest mb-5">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">
                  Event Name <span className="text-yellow-500">*</span>
                </label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange}
                  className={inputClass} placeholder="Formula E Championship 2026" required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-1">
                    Event Date <span className="text-yellow-500">*</span>
                  </label>
                  <input type="date" id="date" name="date" value={formData.date} onChange={handleChange}
                    className={inputClass} required />
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-1">
                    Location <span className="text-yellow-500">*</span>
                  </label>
                  <input type="text" id="location" name="location" value={formData.location} onChange={handleChange}
                    className={inputClass} placeholder="Mumbai, India" required />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea id="description" name="description" value={formData.description} onChange={handleChange}
                  rows={3} className={inputClass + ' resize-none'} placeholder="Experience the future of racing with electric vehicles" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-semibold text-gray-700 mb-1">Ticket Price</label>
                  <input type="text" id="price" name="price" value={formData.price} onChange={handleChange}
                    className={inputClass} placeholder="₹5,000" />
                </div>
                <div>
                  <label htmlFor="imageEmoji" className="block text-sm font-semibold text-gray-700 mb-1">
                    Fallback Emoji
                    <span className="ml-1 text-[10px] text-gray-400 font-normal">(shown if no image uploaded)</span>
                  </label>
                  <select id="imageEmoji" name="imageEmoji" value={formData.imageEmoji} onChange={handleChange}
                    className={inputClass + ' text-xl'}>
                    {emojiOptions.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ── ACCESS REQUIREMENTS ─────────────────────────────────────────── */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 hover:border-yellow-300 transition-colors duration-200">
            <h2 className="text-xs font-bold text-yellow-600 uppercase tracking-widest mb-5">Access Requirements</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" id="requiresKyc" name="requiresKyc" checked={formData.requiresKyc}
                  onChange={handleChange} className="w-4 h-4 accent-yellow-400 rounded" />
                <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                  Require KYC Verification
                </span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="minAge" className="block text-sm font-semibold text-gray-700 mb-1">Minimum Age</label>
                  <input type="number" id="minAge" name="minAge" value={formData.minAge} onChange={handleChange}
                    className={inputClass} min="0" max="100" />
                </div>
                <div>
                  <label htmlFor="minReputation" className="block text-sm font-semibold text-gray-700 mb-1">Minimum Reputation</label>
                  <input type="number" id="minReputation" name="minReputation" value={formData.minReputation}
                    onChange={handleChange} className={inputClass} min="0" max="1000" />
                  <p className="mt-1 text-xs text-gray-400">Set to 0 for open access</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── CAPACITY ────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 hover:border-yellow-300 transition-colors duration-200">
            <h2 className="text-xs font-bold text-yellow-600 uppercase tracking-widest mb-5">Event Capacity</h2>
            <div>
              <label htmlFor="maxTickets" className="block text-sm font-semibold text-gray-700 mb-1">Maximum Tickets Available</label>
              <input type="number" id="maxTickets" name="maxTickets" value={formData.maxTickets}
                onChange={handleChange} className={inputClass} min="1" max="100000" />
            </div>
          </div>

          {/* ── ERROR ───────────────────────────────────────────────────────── */}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
              <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-red-700 font-semibold">{error}</p>
            </div>
          )}

          {/* ── ACTIONS ─────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 pb-8">
            <Link href="/" className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-6 py-2.5 text-sm font-semibold text-gray-600 transition-all duration-200">
              Cancel
            </Link>
            <button
              type="submit"
              id="submit-event-btn"
              disabled={isSubmitting}
              className={`rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-200 ${isSubmitting
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-lg shadow-yellow-400/20 hover:-translate-y-0.5'
                }`}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  Creating…
                </span>
              ) : (
                'Create Event →'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
