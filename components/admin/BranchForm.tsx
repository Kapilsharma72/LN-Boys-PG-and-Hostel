'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BranchCreateSchema, BranchCreateInput } from '@/lib/validations/branch';
import { useCsrfToken } from './AdminLayoutClient';

/**
 * BranchForm (Client Component)
 *
 * Task 20.2 — Shared form component for creating and editing branches
 *
 * Requirements: 1.8 (branchId validation), 1.9 (field-level errors), 1.10 (422 errors)
 *
 * Features:
 * - React Hook Form + Zod client-side validation
 * - Field-level inline errors on blur/change
 * - Submits POST (create) or PATCH (edit) with X-CSRF-Token header
 * - 422 server errors displayed inline without clearing field values
 * - Loading state with submit button spinner
 */

interface BranchFormProps {
  mode: 'create' | 'edit';
  branchId?: string;
  defaultValues?: Partial<BranchCreateInput>;
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export default function BranchForm({ mode, branchId, defaultValues }: BranchFormProps) {
  const router = useRouter();
  const csrfToken = useCsrfToken();
  const [formStatus, setFormStatus] = useState<FormStatus>('idle');
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<BranchCreateInput>({
    resolver: zodResolver(BranchCreateSchema),
    defaultValues: defaultValues ?? {
      branchId: '',
      name: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      phone: [''],
      whatsapp: '',
      startingPrice: 0,
      rating: 0,
      status: 'active',
      occupancyTypes: [''],
      latitude: null,
      longitude: null,
      metaTitle: null,
      metaDescription: null,
    },
    mode: 'onBlur',
  });

  // Dynamic phone array
  const {
    fields: phoneFields,
    append: appendPhone,
    remove: removePhone,
  } = useFieldArray({ control, name: 'phone' as never });

  // Dynamic occupancy types array
  const {
    fields: occupancyFields,
    append: appendOccupancy,
    remove: removeOccupancy,
  } = useFieldArray({ control, name: 'occupancyTypes' as never });

  // -------------------------------------------------------------------------
  // Submit handler
  // -------------------------------------------------------------------------

  const onSubmit = async (data: BranchCreateInput) => {
    if (!csrfToken && mode === 'edit') {
      setServerError('Missing CSRF token. Please log in again.');
      return;
    }
    setFormStatus('submitting');
    setServerError(null);

    try {
      const url = mode === 'create' ? '/api/branches' : `/api/branches/${branchId}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setFormStatus('success');
        router.push('/admin/branches');
        router.refresh();
        return;
      }

      // 422: server-side constraint error — show error without clearing fields
      setFormStatus('error');
      setServerError(json.error ?? 'An error occurred. Please try again.');
    } catch {
      setFormStatus('error');
      setServerError('Network error. Please check your connection and try again.');
    }
  };

  const isSubmitting = formStatus === 'submitting';

  // -------------------------------------------------------------------------
  // Shared input class helper
  // -------------------------------------------------------------------------

  const inputClass = (hasError: boolean) =>
    [
      'w-full px-3 py-2 rounded-lg border text-sm text-gray-900',
      'focus:outline-none focus:ring-2 focus:ring-[#0B0B3B] focus:border-transparent',
      'disabled:opacity-60 disabled:cursor-not-allowed',
      hasError ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white',
    ].join(' ');

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label={mode === 'create' ? 'Create branch form' : 'Edit branch form'}
      className="space-y-8"
    >
      {/* ---------------------------------------------------------------- */}
      {/* Server error banner (422 and other API errors)                   */}
      {/* ---------------------------------------------------------------- */}
      {formStatus === 'error' && serverError && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
        >
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{serverError}</span>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Section: Core details                                             */}
      {/* ---------------------------------------------------------------- */}
      <fieldset className="space-y-5 border border-gray-200 rounded-xl p-5">
        <legend className="px-2 text-sm font-semibold text-gray-700">Core Details</legend>

        {/* Branch ID (slug) — read-only in edit mode */}
        <div>
          <label htmlFor="branch-id" className="block text-sm font-medium text-gray-700 mb-1">
            Branch ID (slug) <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          {mode === 'edit' ? (
            <input
              id="branch-id"
              type="text"
              value={branchId}
              disabled
              readOnly
              aria-describedby="branch-id-hint"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-100 text-sm text-gray-500 font-mono cursor-not-allowed"
            />
          ) : (
            <input
              id="branch-id"
              type="text"
              aria-required="true"
              aria-invalid={!!errors.branchId}
              aria-describedby={errors.branchId ? 'branch-id-error' : 'branch-id-hint'}
              disabled={isSubmitting}
              placeholder="e.g. ln-vidhani-jecrc"
              className={inputClass(!!errors.branchId) + ' font-mono'}
              {...register('branchId')}
            />
          )}
          <p id="branch-id-hint" className="mt-1 text-xs text-gray-500">
            Lowercase alphanumeric with hyphens only, 3–80 characters. Cannot be changed after creation.
          </p>
          {errors.branchId && (
            <p id="branch-id-error" role="alert" className="mt-1 text-xs text-red-600">
              {errors.branchId.message}
            </p>
          )}
        </div>

        {/* Name */}
        <div>
          <label htmlFor="branch-name" className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="branch-name"
            type="text"
            aria-required="true"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'branch-name-error' : undefined}
            disabled={isSubmitting}
            placeholder="LN Boys PG – Vidhani"
            className={inputClass(!!errors.name)}
            {...register('name')}
          />
          {errors.name && (
            <p id="branch-name-error" role="alert" className="mt-1 text-xs text-red-600">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Status */}
        <div>
          <label htmlFor="branch-status" className="block text-sm font-medium text-gray-700 mb-1">
            Status <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <select
            id="branch-status"
            aria-required="true"
            aria-invalid={!!errors.status}
            aria-describedby={errors.status ? 'branch-status-error' : undefined}
            disabled={isSubmitting}
            className={inputClass(!!errors.status)}
            {...register('status')}
          >
            <option value="active">Active</option>
            <option value="coming-soon">Coming Soon</option>
          </select>
          {errors.status && (
            <p id="branch-status-error" role="alert" className="mt-1 text-xs text-red-600">
              {errors.status.message}
            </p>
          )}
        </div>

        {/* Starting Price */}
        <div>
          <label htmlFor="branch-starting-price" className="block text-sm font-medium text-gray-700 mb-1">
            Starting Price (₹/month) <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="branch-starting-price"
            type="number"
            step="0.01"
            min="0.01"
            max="999999.99"
            aria-required="true"
            aria-invalid={!!errors.startingPrice}
            aria-describedby={errors.startingPrice ? 'branch-price-error' : undefined}
            disabled={isSubmitting}
            placeholder="8000"
            className={inputClass(!!errors.startingPrice)}
            {...register('startingPrice', { valueAsNumber: true })}
          />
          {errors.startingPrice && (
            <p id="branch-price-error" role="alert" className="mt-1 text-xs text-red-600">
              {errors.startingPrice.message}
            </p>
          )}
        </div>

        {/* Rating */}
        <div>
          <label htmlFor="branch-rating" className="block text-sm font-medium text-gray-700 mb-1">
            Rating (0.0–5.0)
          </label>
          <input
            id="branch-rating"
            type="number"
            step="0.1"
            min="0"
            max="5"
            aria-invalid={!!errors.rating}
            aria-describedby={errors.rating ? 'branch-rating-error' : undefined}
            disabled={isSubmitting}
            placeholder="4.5"
            className={inputClass(!!errors.rating)}
            {...register('rating', { valueAsNumber: true })}
          />
          {errors.rating && (
            <p id="branch-rating-error" role="alert" className="mt-1 text-xs text-red-600">
              {errors.rating.message}
            </p>
          )}
        </div>
      </fieldset>

      {/* ---------------------------------------------------------------- */}
      {/* Section: Address                                                  */}
      {/* ---------------------------------------------------------------- */}
      <fieldset className="space-y-5 border border-gray-200 rounded-xl p-5">
        <legend className="px-2 text-sm font-semibold text-gray-700">Address</legend>

        {/* Address */}
        <div>
          <label htmlFor="branch-address" className="block text-sm font-medium text-gray-700 mb-1">
            Street Address <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <textarea
            id="branch-address"
            rows={2}
            aria-required="true"
            aria-invalid={!!errors.address}
            aria-describedby={errors.address ? 'branch-address-error' : undefined}
            disabled={isSubmitting}
            placeholder="Plot No. 12, Vidhani, Near JECRC University"
            className={inputClass(!!errors.address) + ' resize-none'}
            {...register('address')}
          />
          {errors.address && (
            <p id="branch-address-error" role="alert" className="mt-1 text-xs text-red-600">
              {errors.address.message}
            </p>
          )}
        </div>

        {/* City */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="branch-city" className="block text-sm font-medium text-gray-700 mb-1">
              City <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="branch-city"
              type="text"
              aria-required="true"
              aria-invalid={!!errors.city}
              aria-describedby={errors.city ? 'branch-city-error' : undefined}
              disabled={isSubmitting}
              placeholder="Jaipur"
              className={inputClass(!!errors.city)}
              {...register('city')}
            />
            {errors.city && (
              <p id="branch-city-error" role="alert" className="mt-1 text-xs text-red-600">
                {errors.city.message}
              </p>
            )}
          </div>

          {/* State */}
          <div>
            <label htmlFor="branch-state" className="block text-sm font-medium text-gray-700 mb-1">
              State <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="branch-state"
              type="text"
              aria-required="true"
              aria-invalid={!!errors.state}
              aria-describedby={errors.state ? 'branch-state-error' : undefined}
              disabled={isSubmitting}
              placeholder="Rajasthan"
              className={inputClass(!!errors.state)}
              {...register('state')}
            />
            {errors.state && (
              <p id="branch-state-error" role="alert" className="mt-1 text-xs text-red-600">
                {errors.state.message}
              </p>
            )}
          </div>

          {/* Pincode */}
          <div>
            <label htmlFor="branch-pincode" className="block text-sm font-medium text-gray-700 mb-1">
              Pincode <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="branch-pincode"
              type="text"
              inputMode="numeric"
              maxLength={6}
              aria-required="true"
              aria-invalid={!!errors.pincode}
              aria-describedby={errors.pincode ? 'branch-pincode-error' : undefined}
              disabled={isSubmitting}
              placeholder="302021"
              className={inputClass(!!errors.pincode) + ' font-mono'}
              {...register('pincode')}
            />
            {errors.pincode && (
              <p id="branch-pincode-error" role="alert" className="mt-1 text-xs text-red-600">
                {errors.pincode.message}
              </p>
            )}
          </div>
        </div>
      </fieldset>

      {/* ---------------------------------------------------------------- */}
      {/* Section: Contact                                                  */}
      {/* ---------------------------------------------------------------- */}
      <fieldset className="space-y-5 border border-gray-200 rounded-xl p-5">
        <legend className="px-2 text-sm font-semibold text-gray-700">Contact</legend>

        {/* Phone numbers (dynamic array, 1–5) */}
        <div>
          <p className="block text-sm font-medium text-gray-700 mb-2" id="phone-label">
            Phone Numbers <span className="text-red-500" aria-hidden="true">*</span>
            <span className="text-xs text-gray-400 font-normal ml-1">(1–5 numbers)</span>
          </p>
          <div className="space-y-2" role="group" aria-labelledby="phone-label">
            {(phoneFields as unknown as Array<{ id: string }>).map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <input
                  type="tel"
                  aria-label={`Phone number ${index + 1}`}
                  aria-invalid={!!errors.phone?.[index]}
                  aria-describedby={errors.phone?.[index] ? `phone-${index}-error` : undefined}
                  disabled={isSubmitting}
                  placeholder="+91 83858 57902"
                  className={inputClass(!!errors.phone?.[index])}
                  {...register(`phone.${index}`)}
                />
                {(phoneFields as unknown as Array<{ id: string }>).length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePhone(index)}
                    disabled={isSubmitting}
                    aria-label={`Remove phone number ${index + 1}`}
                    className="flex-shrink-0 p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
                {errors.phone?.[index] && (
                  <p id={`phone-${index}-error`} role="alert" className="mt-1 text-xs text-red-600">
                    {errors.phone[index]?.message}
                  </p>
                )}
              </div>
            ))}
          </div>
          {errors.phone && !Array.isArray(errors.phone) && (
            <p role="alert" className="mt-1 text-xs text-red-600">
              {(errors.phone as { message?: string }).message}
            </p>
          )}
          {(phoneFields as unknown as Array<{ id: string }>).length < 5 && (
            <button
              type="button"
              onClick={() => appendPhone('')}
              disabled={isSubmitting}
              className="mt-2 inline-flex items-center gap-1 text-xs text-[#0B0B3B] hover:text-[#1a1a5e] font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B0B3B] disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add phone number
            </button>
          )}
        </div>

        {/* WhatsApp */}
        <div>
          <label htmlFor="branch-whatsapp" className="block text-sm font-medium text-gray-700 mb-1">
            WhatsApp Number <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="branch-whatsapp"
            type="tel"
            aria-required="true"
            aria-invalid={!!errors.whatsapp}
            aria-describedby={errors.whatsapp ? 'branch-whatsapp-error' : undefined}
            disabled={isSubmitting}
            placeholder="+91 83858 57902"
            className={inputClass(!!errors.whatsapp)}
            {...register('whatsapp')}
          />
          {errors.whatsapp && (
            <p id="branch-whatsapp-error" role="alert" className="mt-1 text-xs text-red-600">
              {errors.whatsapp.message}
            </p>
          )}
        </div>
      </fieldset>

      {/* ---------------------------------------------------------------- */}
      {/* Section: Occupancy types                                          */}
      {/* ---------------------------------------------------------------- */}
      <fieldset className="space-y-5 border border-gray-200 rounded-xl p-5">
        <legend className="px-2 text-sm font-semibold text-gray-700">Occupancy Types</legend>

        <div>
          <p className="block text-sm font-medium text-gray-700 mb-2" id="occupancy-label">
            Occupancy Types <span className="text-red-500" aria-hidden="true">*</span>
            <span className="text-xs text-gray-400 font-normal ml-1">(1–10 entries, e.g. Single, Double, Triple)</span>
          </p>
          <div className="space-y-2" role="group" aria-labelledby="occupancy-label">
            {(occupancyFields as unknown as Array<{ id: string }>).map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <input
                  type="text"
                  aria-label={`Occupancy type ${index + 1}`}
                  aria-invalid={!!errors.occupancyTypes?.[index]}
                  disabled={isSubmitting}
                  placeholder="e.g. Single"
                  className={inputClass(!!errors.occupancyTypes?.[index])}
                  {...register(`occupancyTypes.${index}`)}
                />
                {(occupancyFields as unknown as Array<{ id: string }>).length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeOccupancy(index)}
                    disabled={isSubmitting}
                    aria-label={`Remove occupancy type ${index + 1}`}
                    className="flex-shrink-0 p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          {errors.occupancyTypes && !Array.isArray(errors.occupancyTypes) && (
            <p role="alert" className="mt-1 text-xs text-red-600">
              {(errors.occupancyTypes as { message?: string }).message}
            </p>
          )}
          {(occupancyFields as unknown as Array<{ id: string }>).length < 10 && (
            <button
              type="button"
              onClick={() => appendOccupancy('')}
              disabled={isSubmitting}
              className="mt-2 inline-flex items-center gap-1 text-xs text-[#0B0B3B] hover:text-[#1a1a5e] font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B0B3B] disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add occupancy type
            </button>
          )}
        </div>
      </fieldset>

      {/* ---------------------------------------------------------------- */}
      {/* Section: GPS coordinates (optional)                              */}
      {/* ---------------------------------------------------------------- */}
      <fieldset className="space-y-5 border border-gray-200 rounded-xl p-5">
        <legend className="px-2 text-sm font-semibold text-gray-700">GPS Coordinates <span className="text-xs font-normal text-gray-400">(optional)</span></legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="branch-latitude" className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
            <input
              id="branch-latitude"
              type="number"
              step="any"
              aria-invalid={!!errors.latitude}
              aria-describedby={errors.latitude ? 'branch-lat-error' : undefined}
              disabled={isSubmitting}
              placeholder="26.8467"
              className={inputClass(!!errors.latitude)}
              {...register('latitude', { setValueAs: (v) => (v === '' ? null : parseFloat(v)) })}
            />
            {errors.latitude && (
              <p id="branch-lat-error" role="alert" className="mt-1 text-xs text-red-600">
                {errors.latitude.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="branch-longitude" className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
            <input
              id="branch-longitude"
              type="number"
              step="any"
              aria-invalid={!!errors.longitude}
              aria-describedby={errors.longitude ? 'branch-lng-error' : undefined}
              disabled={isSubmitting}
              placeholder="75.7471"
              className={inputClass(!!errors.longitude)}
              {...register('longitude', { setValueAs: (v) => (v === '' ? null : parseFloat(v)) })}
            />
            {errors.longitude && (
              <p id="branch-lng-error" role="alert" className="mt-1 text-xs text-red-600">
                {errors.longitude.message}
              </p>
            )}
          </div>
        </div>
      </fieldset>

      {/* ---------------------------------------------------------------- */}
      {/* Section: SEO (optional)                                          */}
      {/* ---------------------------------------------------------------- */}
      <fieldset className="space-y-5 border border-gray-200 rounded-xl p-5">
        <legend className="px-2 text-sm font-semibold text-gray-700">SEO <span className="text-xs font-normal text-gray-400">(optional)</span></legend>

        <div>
          <label htmlFor="branch-meta-title" className="block text-sm font-medium text-gray-700 mb-1">
            Meta Title <span className="text-xs text-gray-400 font-normal">(max 70 chars)</span>
          </label>
          <input
            id="branch-meta-title"
            type="text"
            maxLength={70}
            aria-invalid={!!errors.metaTitle}
            aria-describedby={errors.metaTitle ? 'branch-meta-title-error' : undefined}
            disabled={isSubmitting}
            placeholder="LN Boys PG Vidhani | Best PG near JECRC Jaipur"
            className={inputClass(!!errors.metaTitle)}
            {...register('metaTitle', { setValueAs: (v) => (v === '' ? null : v) })}
          />
          {errors.metaTitle && (
            <p id="branch-meta-title-error" role="alert" className="mt-1 text-xs text-red-600">
              {errors.metaTitle.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="branch-meta-description" className="block text-sm font-medium text-gray-700 mb-1">
            Meta Description <span className="text-xs text-gray-400 font-normal">(max 160 chars)</span>
          </label>
          <textarea
            id="branch-meta-description"
            rows={3}
            maxLength={160}
            aria-invalid={!!errors.metaDescription}
            aria-describedby={errors.metaDescription ? 'branch-meta-desc-error' : undefined}
            disabled={isSubmitting}
            placeholder="Affordable PG accommodation near JECRC University, Jaipur with 3 meals/day, Wi-Fi, CCTV security."
            className={inputClass(!!errors.metaDescription) + ' resize-none'}
            {...register('metaDescription', { setValueAs: (v) => (v === '' ? null : v) })}
          />
          {errors.metaDescription && (
            <p id="branch-meta-desc-error" role="alert" className="mt-1 text-xs text-red-600">
              {errors.metaDescription.message}
            </p>
          )}
        </div>
      </fieldset>

      {/* ---------------------------------------------------------------- */}
      {/* Form actions                                                      */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={() => router.push('/admin/branches')}
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
              <svg aria-hidden="true" className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {mode === 'create' ? 'Creating…' : 'Saving…'}
            </>
          ) : (
            mode === 'create' ? 'Create Branch' : 'Save Changes'
          )}
        </button>
      </div>
    </form>
  );
}
