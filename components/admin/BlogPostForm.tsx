'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PostCreateSchema } from '@/lib/validations/post';
import { useCsrfToken } from './AdminLayoutClient';

// ---------------------------------------------------------------------------
// Form-level schema
// Uses z.string() for publishedAt so react-hook-form can handle it as a
// controlled string input (date picker returns "YYYY-MM-DD"), converted to
// Date only on submit.
// ---------------------------------------------------------------------------
const BlogPostFormSchema = PostCreateSchema.extend({
  publishedAt: z.string().min(1, 'Publish date is required'),
});
// Use output type (with defaults resolved) so useForm gets fully-required fields
type BlogPostFormValues = z.output<typeof BlogPostFormSchema>;

/**
 * BlogPostForm (Client Component)
 *
 * Task 21.3 — Shared form component for creating and editing blog posts
 *
 * Requirements: 8.3
 *
 * Features:
 * - React Hook Form + Zod client-side validation (onBlur mode)
 * - Field-level inline errors on blur/change
 * - Auto-generate slug from title (lowercase, hyphens, no special chars)
 * - Live Markdown preview using marked + DOMPurify (split layout desktop / tabs mobile)
 * - Tags: comma-separated input → stored as string[], max 10
 * - publishedAt: date input (ISO date string → coerced to Date by Zod)
 * - published: checkbox toggle
 * - Submits POST (create) or PATCH (edit) with X-CSRF-Token header
 * - 201 → redirect to /admin/blog; 200 → success message in-place
 * - 422 server errors displayed inline without clearing fields
 * - Loading spinner during submit
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BlogPostInitialValues {
  _id?: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: Date | string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  published: boolean;
}

interface BlogPostFormProps {
  mode: 'create' | 'edit';
  postId?: string;
  initialValues?: BlogPostInitialValues;
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

// ---------------------------------------------------------------------------
// Slug helpers
// ---------------------------------------------------------------------------

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')   // strip non-alphanumeric (except spaces/hyphens)
    .trim()
    .replace(/[\s-]+/g, '-')         // replace whitespace/multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '');        // trim leading/trailing hyphens
}

// ---------------------------------------------------------------------------
// Shared class helper
// ---------------------------------------------------------------------------

const inputClass = (hasError: boolean) =>
  [
    'w-full px-3 py-2 rounded-lg border text-sm text-gray-900',
    'focus:outline-none focus:ring-2 focus:ring-[#0B0B3B] focus:border-transparent',
    'disabled:opacity-60 disabled:cursor-not-allowed',
    hasError ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white',
  ].join(' ');

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BlogPostForm({ mode, postId, initialValues }: BlogPostFormProps) {
  const router = useRouter();
  const csrfToken = useCsrfToken();

  const [formStatus, setFormStatus] = useState<FormStatus>('idle');
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Markdown preview state
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

  // Tags — stored as comma-separated string in UI, converted to array on submit
  const initialTagsString = initialValues?.tags?.join(', ') ?? '';
  const [tagsInput, setTagsInput] = useState<string>(initialTagsString);

  // Derive form defaults from initialValues
  const defaultPublishedAt = initialValues?.publishedAt
    ? new Date(initialValues.publishedAt).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BlogPostFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(BlogPostFormSchema) as any,
    defaultValues: initialValues
      ? {
          slug: initialValues.slug,
          title: initialValues.title,
          excerpt: initialValues.excerpt,
          content: initialValues.content,
          author: initialValues.author,
          publishedAt: defaultPublishedAt,
          tags: initialValues.tags ?? [],
          metaTitle: initialValues.metaTitle,
          metaDescription: initialValues.metaDescription,
          published: initialValues.published ?? false,
        }
      : {
          slug: '',
          title: '',
          excerpt: '',
          content: '',
          author: '',
          publishedAt: new Date().toISOString().slice(0, 10),
          tags: [],
          metaTitle: '',
          metaDescription: '',
          published: false,
        },
    mode: 'onBlur',
  });

  const titleValue = watch('title');
  const contentValue = watch('content');

  // -------------------------------------------------------------------------
  // Auto-generate slug from title (only in create mode or when slug is empty)
  // -------------------------------------------------------------------------

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(mode === 'edit');

  useEffect(() => {
    if (!slugManuallyEdited && titleValue) {
      setValue('slug', generateSlug(titleValue), { shouldValidate: false });
    }
  }, [titleValue, slugManuallyEdited, setValue]);

  // -------------------------------------------------------------------------
  // Live Markdown preview
  // -------------------------------------------------------------------------

  const updatePreview = useCallback(async (md: string) => {
    if (!md) {
      setPreviewHtml('');
      return;
    }
    try {
      const { marked } = await import('marked');
      const DOMPurify = (await import('dompurify')).default;
      const raw = await marked.parse(md);
      setPreviewHtml(DOMPurify.sanitize(raw));
    } catch {
      setPreviewHtml('<p class="text-gray-400 text-sm">Preview unavailable</p>');
    }
  }, []);

  useEffect(() => {
    updatePreview(contentValue ?? '');
  }, [contentValue, updatePreview]);

  // -------------------------------------------------------------------------
  // Submit handler
  // -------------------------------------------------------------------------

  const onSubmit = async (data: BlogPostFormValues) => {
    setFormStatus('submitting');
    setServerError(null);
    setSuccessMessage(null);

    // Parse tags from comma-separated input
    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 10);

    // Convert date string to Date for API
    const payload = {
      ...data,
      publishedAt: new Date(data.publishedAt),
      tags: parsedTags,
    };

    try {
      const url = mode === 'create' ? '/api/posts' : `/api/posts/${postId}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.status === 201 && json.success) {
        // New post created — redirect to blog list
        router.push('/admin/blog');
        router.refresh();
        return;
      }

      if (res.status === 200 && json.success) {
        // Post updated — stay on page, show success message
        setFormStatus('success');
        setSuccessMessage('Post updated successfully.');
        return;
      }

      // Any error (422, 400, 5xx) — show message without clearing fields
      setFormStatus('error');
      setServerError(json.error ?? 'An error occurred. Please try again.');
    } catch {
      setFormStatus('error');
      setServerError('Network error. Please check your connection and try again.');
    }
  };

  const isSubmitting = formStatus === 'submitting';

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label={mode === 'create' ? 'Create blog post form' : 'Edit blog post form'}
      className="space-y-8"
    >
      {/* ---------------------------------------------------------------- */}
      {/* Server error banner                                               */}
      {/* ---------------------------------------------------------------- */}
      {formStatus === 'error' && serverError && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
        >
          <svg
            className="w-5 h-5 flex-shrink-0 mt-0.5"
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
          <span>{serverError}</span>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Success banner (edit mode)                                        */}
      {/* ---------------------------------------------------------------- */}
      {formStatus === 'success' && successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm"
        >
          <svg
            className="w-5 h-5 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {/* ================================================================ */}
      {/* Section: Core post details                                        */}
      {/* ================================================================ */}
      <fieldset className="space-y-5 border border-gray-200 rounded-xl p-5">
        <legend className="px-2 text-sm font-semibold text-gray-700">Post Details</legend>

        {/* Title */}
        <div>
          <label htmlFor="post-title" className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="post-title"
            type="text"
            maxLength={120}
            aria-required="true"
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? 'post-title-error' : undefined}
            disabled={isSubmitting}
            placeholder="e.g. 5 Tips for Choosing the Best PG in Jaipur"
            className={inputClass(!!errors.title)}
            {...register('title')}
          />
          {errors.title && (
            <p id="post-title-error" role="alert" className="mt-1 text-xs text-red-600">
              {errors.title.message}
            </p>
          )}
        </div>

        {/* Slug */}
        <div>
          <label htmlFor="post-slug" className="block text-sm font-medium text-gray-700 mb-1">
            Slug <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="post-slug"
            type="text"
            maxLength={100}
            aria-required="true"
            aria-invalid={!!errors.slug}
            aria-describedby={errors.slug ? 'post-slug-error' : 'post-slug-hint'}
            disabled={isSubmitting}
            placeholder="e.g. tips-for-choosing-best-pg-jaipur"
            className={inputClass(!!errors.slug) + ' font-mono'}
            {...register('slug', {
              onChange: () => setSlugManuallyEdited(true),
            })}
          />
          <p id="post-slug-hint" className="mt-1 text-xs text-gray-500">
            Auto-generated from title. Lowercase alphanumeric words separated by hyphens.
          </p>
          {errors.slug && (
            <p id="post-slug-error" role="alert" className="mt-1 text-xs text-red-600">
              {errors.slug.message}
            </p>
          )}
        </div>

        {/* Excerpt */}
        <div>
          <label htmlFor="post-excerpt" className="block text-sm font-medium text-gray-700 mb-1">
            Excerpt <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <textarea
            id="post-excerpt"
            rows={3}
            maxLength={300}
            aria-required="true"
            aria-invalid={!!errors.excerpt}
            aria-describedby={errors.excerpt ? 'post-excerpt-error' : 'post-excerpt-hint'}
            disabled={isSubmitting}
            placeholder="A short summary shown on the blog listing page (max 300 chars)"
            className={inputClass(!!errors.excerpt) + ' resize-none'}
            {...register('excerpt')}
          />
          <p id="post-excerpt-hint" className="mt-1 text-xs text-gray-500">
            Max 300 characters. Displayed on the blog listing page.
          </p>
          {errors.excerpt && (
            <p id="post-excerpt-error" role="alert" className="mt-1 text-xs text-red-600">
              {errors.excerpt.message}
            </p>
          )}
        </div>

        {/* Author */}
        <div>
          <label htmlFor="post-author" className="block text-sm font-medium text-gray-700 mb-1">
            Author <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="post-author"
            type="text"
            maxLength={80}
            aria-required="true"
            aria-invalid={!!errors.author}
            aria-describedby={errors.author ? 'post-author-error' : undefined}
            disabled={isSubmitting}
            placeholder="e.g. LN Hostel Team"
            className={inputClass(!!errors.author)}
            {...register('author')}
          />
          {errors.author && (
            <p id="post-author-error" role="alert" className="mt-1 text-xs text-red-600">
              {errors.author.message}
            </p>
          )}
        </div>

        {/* Published At */}
        <div>
          <label htmlFor="post-published-at" className="block text-sm font-medium text-gray-700 mb-1">
            Publish Date <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="post-published-at"
            type="date"
            aria-required="true"
            aria-invalid={!!errors.publishedAt}
            aria-describedby={errors.publishedAt ? 'post-published-at-error' : undefined}
            disabled={isSubmitting}
            defaultValue={defaultPublishedAt}
            className={inputClass(!!errors.publishedAt)}
            {...register('publishedAt')}
          />
          {errors.publishedAt && (
            <p id="post-published-at-error" role="alert" className="mt-1 text-xs text-red-600">
              {errors.publishedAt.message}
            </p>
          )}
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="post-tags" className="block text-sm font-medium text-gray-700 mb-1">
            Tags
            <span className="text-xs text-gray-400 font-normal ml-1">(comma-separated, max 10)</span>
          </label>
          <input
            id="post-tags"
            type="text"
            disabled={isSubmitting}
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="e.g. hostel, jaipur, pg life, student living"
            className={inputClass(false)}
          />
          <p className="mt-1 text-xs text-gray-500">
            Separate tags with commas.
          </p>
        </div>

        {/* Published toggle */}
        <div className="flex items-center gap-3">
          <input
            id="post-published"
            type="checkbox"
            aria-describedby="post-published-hint"
            disabled={isSubmitting}
            className="w-4 h-4 rounded border-gray-300 text-[#0B0B3B] focus:ring-[#0B0B3B] disabled:opacity-60"
            {...register('published')}
          />
          <div>
            <label htmlFor="post-published" className="text-sm font-medium text-gray-700 cursor-pointer">
              Published
            </label>
            <p id="post-published-hint" className="text-xs text-gray-500">
              Unchecked = draft. Check to make the post publicly visible.
            </p>
          </div>
        </div>
      </fieldset>

      {/* ================================================================ */}
      {/* Section: Content (Markdown with live preview)                    */}
      {/* ================================================================ */}
      <fieldset className="space-y-4 border border-gray-200 rounded-xl p-5">
        <legend className="px-2 text-sm font-semibold text-gray-700">
          Content <span className="text-xs font-normal text-gray-400">(Markdown)</span>
        </legend>

        {/* Mobile: tab switcher */}
        <div className="flex gap-1 border-b border-gray-200 lg:hidden" role="tablist" aria-label="Content editor tabs">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'write'}
            aria-controls="content-write-panel"
            onClick={() => setActiveTab('write')}
            className={[
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === 'write'
                ? 'border-[#0B0B3B] text-[#0B0B3B]'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            Write
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'preview'}
            aria-controls="content-preview-panel"
            onClick={() => setActiveTab('preview')}
            className={[
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === 'preview'
                ? 'border-[#0B0B3B] text-[#0B0B3B]'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            Preview
          </button>
        </div>

        {/* Desktop: split layout / Mobile: tab panels */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-4">
          {/* Write panel */}
          <div
            id="content-write-panel"
            role="tabpanel"
            aria-labelledby="write-tab"
            className={activeTab === 'write' ? 'block' : 'hidden lg:block'}
          >
            <textarea
              id="post-content"
              rows={18}
              aria-required="true"
              aria-invalid={!!errors.content}
              aria-describedby={errors.content ? 'post-content-error' : 'post-content-hint'}
              aria-label="Post content (Markdown)"
              disabled={isSubmitting}
              placeholder="Write your post content in Markdown…&#10;&#10;## Heading&#10;&#10;Paragraph text with **bold** and *italic*."
              className={inputClass(!!errors.content) + ' resize-y font-mono text-xs leading-relaxed'}
              {...register('content')}
            />
            <p id="post-content-hint" className="mt-1 text-xs text-gray-500">
              Supports Markdown. Max 100,000 characters.
            </p>
            {errors.content && (
              <p id="post-content-error" role="alert" className="mt-1 text-xs text-red-600">
                {errors.content.message}
              </p>
            )}
          </div>

          {/* Preview panel */}
          <div
            id="content-preview-panel"
            role="tabpanel"
            aria-labelledby="preview-tab"
            aria-label="Markdown preview"
            className={[
              'rounded-lg border border-gray-200 bg-gray-50 p-4 overflow-auto',
              'min-h-[18rem] max-h-[36rem] text-sm',
              activeTab === 'preview' ? 'block' : 'hidden lg:block',
            ].join(' ')}
          >
            {previewHtml ? (
              <div
                className="prose prose-sm max-w-none"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <p className="text-gray-400 text-sm italic">
                Start writing to see the preview…
              </p>
            )}
          </div>
        </div>
      </fieldset>

      {/* ================================================================ */}
      {/* Section: SEO                                                      */}
      {/* ================================================================ */}
      <fieldset className="space-y-5 border border-gray-200 rounded-xl p-5">
        <legend className="px-2 text-sm font-semibold text-gray-700">SEO</legend>

        {/* Meta Title */}
        <div>
          <label htmlFor="post-meta-title" className="block text-sm font-medium text-gray-700 mb-1">
            Meta Title{' '}
            <span className="text-red-500" aria-hidden="true">*</span>{' '}
            <span className="text-xs text-gray-400 font-normal">(max 70 chars)</span>
          </label>
          <input
            id="post-meta-title"
            type="text"
            maxLength={70}
            aria-required="true"
            aria-invalid={!!errors.metaTitle}
            aria-describedby={errors.metaTitle ? 'post-meta-title-error' : undefined}
            disabled={isSubmitting}
            placeholder="e.g. 5 Tips for Choosing the Best PG | LN Boys PG Blog"
            className={inputClass(!!errors.metaTitle)}
            {...register('metaTitle')}
          />
          {errors.metaTitle && (
            <p id="post-meta-title-error" role="alert" className="mt-1 text-xs text-red-600">
              {errors.metaTitle.message}
            </p>
          )}
        </div>

        {/* Meta Description */}
        <div>
          <label htmlFor="post-meta-description" className="block text-sm font-medium text-gray-700 mb-1">
            Meta Description{' '}
            <span className="text-red-500" aria-hidden="true">*</span>{' '}
            <span className="text-xs text-gray-400 font-normal">(max 160 chars)</span>
          </label>
          <textarea
            id="post-meta-description"
            rows={3}
            maxLength={160}
            aria-required="true"
            aria-invalid={!!errors.metaDescription}
            aria-describedby={errors.metaDescription ? 'post-meta-desc-error' : undefined}
            disabled={isSubmitting}
            placeholder="A concise description of this post for search engines (max 160 chars)"
            className={inputClass(!!errors.metaDescription) + ' resize-none'}
            {...register('metaDescription')}
          />
          {errors.metaDescription && (
            <p id="post-meta-desc-error" role="alert" className="mt-1 text-xs text-red-600">
              {errors.metaDescription.message}
            </p>
          )}
        </div>
      </fieldset>

      {/* ================================================================ */}
      {/* Form actions                                                      */}
      {/* ================================================================ */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={() => router.push('/admin/blog')}
          disabled={isSubmitting}
          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          aria-disabled={isSubmitting}
          className={[
            'inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-[#0B0B3B] transition-colors',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B0B3B]',
            isSubmitting
              ? 'bg-yellow-300 cursor-not-allowed opacity-70'
              : 'bg-[#F5C518] hover:bg-yellow-400',
          ].join(' ')}
        >
          {isSubmitting ? (
            <>
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              {mode === 'create' ? 'Creating…' : 'Saving…'}
            </>
          ) : mode === 'create' ? (
            'Create Post'
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </form>
  );
}
