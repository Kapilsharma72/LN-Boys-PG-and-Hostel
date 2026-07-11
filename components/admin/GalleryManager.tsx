'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCsrfToken } from './AdminLayoutClient';

/**
 * GalleryManager (Client Component)
 *
 * Task 20.9 — Gallery upload interface (JPEG/PNG/WebP/MP4 ≤50 MB);
 * calls POST /api/gallery/upload with CSRF; shows error with file retained
 * on failure; displays existing gallery items with delete option.
 *
 * Requirements: 11.1, 11.5
 *
 * Features:
 * - File input accepting image/jpeg, image/png, image/webp, video/mp4
 * - Client-side file type and size validation (≤50 MB)
 * - Category dropdown (room | common-area | food | exterior | event)
 * - Alt text field (1–200 chars)
 * - Upload via multipart FormData with X-CSRF-Token header
 * - On upload failure: error message shown, file selection retained (req 11.5)
 * - Gallery grid showing existing items with thumbnail previews
 * - Delete with inline confirm/cancel pattern and CSRF header
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GalleryItemRow {
  _id: string;
  branchId: string;
  url: string;
  publicId: string;
  resourceType: 'image' | 'video';
  category: 'room' | 'common-area' | 'food' | 'exterior' | 'event';
  altText: string;
  uploadedAt: string;
}

type GalleryCategory = GalleryItemRow['category'];

const VALID_CATEGORIES: { value: GalleryCategory; label: string }[] = [
  { value: 'room', label: 'Room' },
  { value: 'common-area', label: 'Common Area' },
  { value: 'food', label: 'Food' },
  { value: 'exterior', label: 'Exterior' },
  { value: 'event', label: 'Event' },
];

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
const VALID_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-current"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function CategoryBadge({ category }: { category: GalleryCategory }) {
  const colorMap: Record<GalleryCategory, string> = {
    room: 'bg-blue-100 text-blue-700',
    'common-area': 'bg-purple-100 text-purple-700',
    food: 'bg-orange-100 text-orange-700',
    exterior: 'bg-green-100 text-green-700',
    event: 'bg-pink-100 text-pink-700',
  };
  const label = VALID_CATEGORIES.find((c) => c.value === category)?.label ?? category;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[category]}`}
    >
      {label}
    </span>
  );
}

function inputClass(hasError: boolean): string {
  return [
    'w-full px-3 py-2 rounded-lg border text-sm text-gray-900',
    'focus:outline-none focus:ring-2 focus:ring-[#0B0B3B] focus:border-transparent',
    'disabled:opacity-60 disabled:cursor-not-allowed',
    hasError ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white',
  ].join(' ');
}

// ---------------------------------------------------------------------------
// UploadForm — upload interface
// ---------------------------------------------------------------------------

interface UploadFormProps {
  branchId: string;
  onUploaded: (item: GalleryItemRow) => void;
}

function UploadForm({ branchId, onUploaded }: UploadFormProps) {
  const csrfToken = useCsrfToken();

  // Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<GalleryCategory>('room');
  const [altText, setAltText] = useState('');

  // Validation errors
  const [fileError, setFileError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [altTextError, setAltTextError] = useState<string | null>(null);

  // Submission state
  const [isUploading, setIsUploading] = useState(false);
  // Upload error — file is retained so admin can retry (req 11.5)
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate file on selection
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFileError(null);
    setUploadError(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!VALID_MIME_TYPES.includes(file.type)) {
      setFileError('Invalid file type. Accepted: JPEG, PNG, WebP, MP4.');
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError('File is too large. Maximum size is 50 MB.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  }, []);

  const validate = (): boolean => {
    let valid = true;

    if (!selectedFile) {
      setFileError('Please select a file to upload.');
      valid = false;
    }

    if (!category) {
      setCategoryError('Please select a category.');
      valid = false;
    } else {
      setCategoryError(null);
    }

    const trimmed = altText.trim();
    if (trimmed.length === 0) {
      setAltTextError('Alt text is required.');
      valid = false;
    } else if (trimmed.length > 200) {
      setAltTextError('Alt text must be 200 characters or fewer.');
      valid = false;
    } else {
      setAltTextError(null);
    }

    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!csrfToken) {
      setUploadError('Missing CSRF token. Please log in again.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile!);
      formData.append('branchId', branchId);
      formData.append('category', category);
      formData.append('altText', altText.trim());

      const res = await fetch('/api/gallery/upload', {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken },
        body: formData,
      });

      const json = await res.json();

      if (res.ok && json.success) {
        // Clear form on success
        setSelectedFile(null);
        setAltText('');
        setCategory('room');
        setFileError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onUploaded(json.data as GalleryItemRow);
        return;
      }

      // On failure — retain file selection (req 11.5); only show error
      setUploadError(json.error ?? `Upload failed (HTTP ${res.status}).`);
    } catch {
      // Network error — retain file selection (req 11.5)
      setUploadError('Network error. Please check your connection and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Upload gallery item form"
      className="space-y-5 p-5 bg-gray-50 rounded-xl border border-gray-200"
    >
      <h3 className="text-sm font-semibold text-gray-700">Upload New Media</h3>

      {/* Upload error banner — file retained */}
      {uploadError && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs"
        >
          <svg
            className="w-4 h-4 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            <strong>Upload failed:</strong> {uploadError} Your file selection has been retained —
            you can retry without re-selecting the file.
          </span>
        </div>
      )}

      {/* File input */}
      <div>
        <label
          htmlFor="gallery-file"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          File{' '}
          <span className="text-red-500" aria-hidden="true">
            *
          </span>
          <span className="text-xs text-gray-400 font-normal ml-1">
            (JPEG, PNG, WebP, MP4 — max 50 MB)
          </span>
        </label>
        <input
          id="gallery-file"
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4"
          onChange={handleFileChange}
          disabled={isUploading}
          aria-required="true"
          aria-invalid={!!fileError}
          aria-describedby={fileError ? 'gallery-file-error' : undefined}
          className={[
            'w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4',
            'file:rounded-lg file:border-0 file:text-sm file:font-medium',
            'file:bg-[#0B0B3B] file:text-white hover:file:bg-[#1a1a5e]',
            'file:cursor-pointer file:transition-colors',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            fileError ? 'ring-1 ring-red-500 rounded-lg' : '',
          ].join(' ')}
        />
        {selectedFile && !fileError && (
          <p className="mt-1 text-xs text-green-600">
            Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
        {fileError && (
          <p id="gallery-file-error" role="alert" className="mt-1 text-xs text-red-600">
            {fileError}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Category */}
        <div>
          <label
            htmlFor="gallery-category"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Category{' '}
            <span className="text-red-500" aria-hidden="true">
              *
            </span>
          </label>
          <select
            id="gallery-category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as GalleryCategory);
              setCategoryError(null);
            }}
            disabled={isUploading}
            aria-required="true"
            aria-invalid={!!categoryError}
            aria-describedby={categoryError ? 'gallery-category-error' : undefined}
            className={inputClass(!!categoryError)}
          >
            {VALID_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          {categoryError && (
            <p id="gallery-category-error" role="alert" className="mt-1 text-xs text-red-600">
              {categoryError}
            </p>
          )}
        </div>

        {/* Alt text */}
        <div>
          <label
            htmlFor="gallery-alt-text"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Alt Text{' '}
            <span className="text-red-500" aria-hidden="true">
              *
            </span>
            <span className="text-xs text-gray-400 font-normal ml-1">(up to 200 chars)</span>
          </label>
          <input
            id="gallery-alt-text"
            type="text"
            value={altText}
            onChange={(e) => {
              setAltText(e.target.value);
              setAltTextError(null);
            }}
            maxLength={200}
            disabled={isUploading}
            placeholder="e.g. Spacious double room with natural light"
            aria-required="true"
            aria-invalid={!!altTextError}
            aria-describedby={altTextError ? 'gallery-alt-text-error' : undefined}
            className={inputClass(!!altTextError)}
          />
          {altTextError && (
            <p id="gallery-alt-text-error" role="alert" className="mt-1 text-xs text-red-600">
              {altTextError}
            </p>
          )}
        </div>
      </div>

      {/* Submit */}
      <div className="pt-1">
        <button
          type="submit"
          disabled={isUploading}
          className={[
            'inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-[#0B0B3B]',
            'transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
            'focus-visible:outline-[#0B0B3B]',
            isUploading
              ? 'bg-yellow-300 cursor-not-allowed opacity-70'
              : 'bg-[#F5C518] hover:bg-yellow-400',
          ].join(' ')}
        >
          {isUploading ? (
            <>
              <Spinner />
              Uploading…
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Upload
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// GalleryItemCard — single gallery item with delete
// ---------------------------------------------------------------------------

interface GalleryItemCardProps {
  item: GalleryItemRow;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  deleteError: string | null;
}

function GalleryItemCard({ item, onDelete, isDeleting, deleteError }: GalleryItemCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const uploadDate = new Date(item.uploadedAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Media preview */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        {item.resourceType === 'image' ? (
          <Image
            src={item.url}
            alt={item.altText}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          /* Video placeholder */
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="sr-only">Video: {item.altText}</span>
          </div>
        )}

        {/* Resource type badge */}
        <div className="absolute top-2 left-2">
          {item.resourceType === 'video' ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-900/70 text-white backdrop-blur-sm">
              VIDEO
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-900/70 text-white backdrop-blur-sm">
              IMG
            </span>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="p-3 space-y-2">
        {/* Category + date */}
        <div className="flex items-center justify-between gap-2">
          <CategoryBadge category={item.category} />
          <span className="text-xs text-gray-400">{uploadDate}</span>
        </div>

        {/* Alt text */}
        <p
          className="text-xs text-gray-600 truncate"
          title={item.altText}
        >
          {item.altText}
        </p>

        {/* Delete error */}
        {deleteError && (
          <p role="alert" className="text-xs text-red-600">
            {deleteError}
          </p>
        )}

        {/* Delete controls */}
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={isDeleting}
            aria-label={`Delete gallery item: ${item.altText}`}
            className="
              w-full inline-flex items-center justify-center gap-1.5
              px-3 py-1.5 text-xs font-medium rounded-lg
              bg-red-50 text-red-700 hover:bg-red-100
              transition-colors focus-visible:outline focus-visible:outline-2
              focus-visible:outline-[#0B0B3B] disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {isDeleting ? (
              <Spinner />
            ) : (
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            )}
            Delete
          </button>
        ) : (
          <div
            className="flex items-center gap-2"
            role="group"
            aria-label="Confirm delete"
          >
            <span className="text-xs text-gray-600">Delete?</span>
            <button
              type="button"
              onClick={() => {
                setConfirmDelete(false);
                onDelete(item._id);
              }}
              disabled={isDeleting}
              className="
                inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold
                rounded-lg bg-red-600 text-white hover:bg-red-700
                transition-colors focus-visible:outline focus-visible:outline-2
                focus-visible:outline-red-800 disabled:opacity-50
              "
            >
              {isDeleting ? <Spinner /> : 'Yes, delete'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              disabled={isDeleting}
              className="
                inline-flex items-center px-2.5 py-1.5 text-xs font-medium
                rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200
                transition-colors focus-visible:outline focus-visible:outline-2
                focus-visible:outline-[#0B0B3B] disabled:opacity-50
              "
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// GalleryManager — main exported component
// ---------------------------------------------------------------------------

interface GalleryManagerProps {
  branchId: string;
  initialItems: GalleryItemRow[];
}

export default function GalleryManager({ branchId, initialItems }: GalleryManagerProps) {
  const router = useRouter();
  const csrfToken = useCsrfToken();

  const [items, setItems] = useState<GalleryItemRow[]>(initialItems);

  // Per-item delete loading / error state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<{ id: string; message: string } | null>(null);

  // Active category filter for the grid
  const [filterCategory, setFilterCategory] = useState<GalleryCategory | 'all'>('all');

  // Handle newly uploaded item
  const handleUploaded = (item: GalleryItemRow) => {
    setItems((prev) => [item, ...prev]);
    router.refresh();
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (deletingId) return;
    if (!csrfToken) {
      setDeleteError({ id, message: 'Missing CSRF token. Please log in again.' });
      return;
    }

    setDeletingId(id);
    setDeleteError(null);

    try {
      const item = items.find((i) => i._id === id);
      if (!item) return;

      const res = await fetch(`/api/branches/${branchId}/gallery/${id}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrfToken },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Request failed with status ${res.status}`);
      }

      setItems((prev) => prev.filter((i) => i._id !== id));
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete item.';
      setDeleteError({ id, message });
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered items for display
  const displayedItems =
    filterCategory === 'all'
      ? items
      : items.filter((i) => i.category === filterCategory);

  return (
    <div className="space-y-8">
      {/* ---------------------------------------------------------------- */}
      {/* Upload form                                                       */}
      {/* ---------------------------------------------------------------- */}
      <UploadForm branchId={branchId} onUploaded={handleUploaded} />

      {/* ---------------------------------------------------------------- */}
      {/* Existing gallery items                                            */}
      {/* ---------------------------------------------------------------- */}
      <section aria-labelledby="gallery-items-heading">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h3 id="gallery-items-heading" className="text-sm font-semibold text-gray-700">
              Existing Gallery Items
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              <span className="font-medium text-gray-800">{items.length}</span>{' '}
              {items.length === 1 ? 'item' : 'items'} total
            </p>
          </div>

          {/* Category filter tabs */}
          {items.length > 0 && (
            <div
              role="tablist"
              aria-label="Filter gallery by category"
              className="flex items-center gap-1 flex-wrap"
            >
              {[{ value: 'all' as const, label: 'All' }, ...VALID_CATEGORIES].map(
                ({ value, label }) => (
                  <button
                    key={value}
                    role="tab"
                    type="button"
                    aria-selected={filterCategory === value}
                    onClick={() => setFilterCategory(value)}
                    className={[
                      'px-3 py-1 text-xs font-medium rounded-full transition-colors',
                      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B0B3B]',
                      filterCategory === value
                        ? 'bg-[#0B0B3B] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                    ].join(' ')}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Empty state */}
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <svg
              className="w-12 h-12 mb-3 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm font-medium text-gray-500">No gallery items yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Upload your first image or video using the form above.
            </p>
          </div>
        )}

        {/* Filtered empty state */}
        {items.length > 0 && displayedItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-sm text-gray-500">
              No items in the &ldquo;
              {VALID_CATEGORIES.find((c) => c.value === filterCategory)?.label}
              &rdquo; category.
            </p>
          </div>
        )}

        {/* Gallery grid */}
        {displayedItems.length > 0 && (
          <ul
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            aria-label="Gallery items"
          >
            {displayedItems.map((item) => (
              <li key={item._id}>
                <GalleryItemCard
                  item={item}
                  onDelete={handleDelete}
                  isDeleting={deletingId === item._id}
                  deleteError={deleteError?.id === item._id ? deleteError.message : null}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
