'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { caseGeneralSchema, type CaseGeneralInput } from '@/lib/domain/schemas';
import { ERA_PROFILES, type Case } from '@/lib/domain';
import { slugify } from '@/lib/ui/slug';
import MediaUploader from './MediaUploader';

export default function CaseGeneralForm({
  mode,
  initial,
}: {
  mode: 'create' | 'edit';
  initial?: Case;
}) {
  const router = useRouter();
  const slugEdited = useRef(mode === 'edit');
  const [serverError, setServerError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CaseGeneralInput>({
    resolver: zodResolver(caseGeneralSchema),
    defaultValues: {
      title: initial?.title ?? '',
      slug: initial?.slug ?? '',
      synopsis: initial?.synopsis ?? '',
      city: initial?.city ?? '',
      era_year: initial?.era_year ?? 1989,
      era_profile: initial?.era_profile ?? 'vhs-80s',
      time_limit_min: initial?.time_limit_min ?? 150,
      price_ref_mxn: initial?.price_ref_mxn ?? undefined,
      active: initial?.active ?? false,
      briefing_voice_path: initial?.briefing_voice_path ?? null,
    },
  });

  const briefingPath = watch('briefing_voice_path');
  const active = watch('active');

  async function onSubmit(values: CaseGeneralInput) {
    setServerError(null);
    const url = mode === 'create' ? '/api/admin/cases' : `/api/admin/cases/${initial!.slug}`;
    const method = mode === 'create' ? 'POST' : 'PATCH';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      setServerError(
        data.error === 'slug_taken' ? 'Ese slug ya existe, elige otro.' : 'No se pudo guardar. Revisa los campos.',
      );
      return;
    }
    if (mode === 'create') {
      router.push(`/admin/casos/${data.slug}/editar`);
    } else {
      setSavedAt(new Date().toLocaleTimeString('es-MX'));
      if (data.slug && data.slug !== initial!.slug) router.replace(`/admin/casos/${data.slug}/editar`);
      router.refresh();
    }
  }

  return (
    <form className="cpanel" onSubmit={handleSubmit(onSubmit)}>
      {serverError && <div className="note-error tab-error">{serverError}</div>}

      <div className="form-grid">
        <div className="full">
          <label className="label">Título</label>
          <input
            className="input"
            {...register('title', {
              onChange: (e) => {
                if (!slugEdited.current) setValue('slug', slugify(e.target.value));
              },
            })}
          />
          {errors.title && <div className="note-error" style={{ marginTop: 6 }}>{errors.title.message}</div>}
        </div>

        <div>
          <label className="label">Slug (URL)</label>
          <input
            className="input mono"
            {...register('slug', { onChange: () => (slugEdited.current = true) })}
          />
          {errors.slug && <div className="note-error" style={{ marginTop: 6 }}>{errors.slug.message}</div>}
        </div>
        <div>
          <label className="label">Ciudad</label>
          <input className="input" {...register('city')} />
          {errors.city && <div className="note-error" style={{ marginTop: 6 }}>{errors.city.message}</div>}
        </div>

        <div className="full">
          <label className="label">Sinopsis</label>
          <textarea className="input tall" {...register('synopsis')} />
        </div>

        <div>
          <label className="label">Año de la época</label>
          <input className="input mono" type="number" {...register('era_year')} />
        </div>
        <div>
          <label className="label">Perfil de época</label>
          <select className="input" {...register('era_profile')}>
            {ERA_PROFILES.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Duración (min)</label>
          <input className="input mono" type="number" {...register('time_limit_min')} />
        </div>
        <div>
          <label className="label">Precio de referencia (MXN)</label>
          <input className="input mono" type="number" placeholder="350" {...register('price_ref_mxn')} />
        </div>

        <div className="full">
          <label className="toggle">
            <input type="checkbox" {...register('active')} />
            <span className="track" />
            <span>Activo — aparece en el catálogo público</span>
          </label>
        </div>

        {mode === 'edit' && (
          <div className="full">
            <MediaUploader
              caseSlug={initial!.slug}
              kind="audio"
              category="briefing"
              value={briefingPath ?? null}
              onUploaded={(path) => setValue('briefing_voice_path', path, { shouldDirty: true })}
              label="Voz de briefing (mp3)"
            />
          </div>
        )}
      </div>

      <div className="sticky-save">
        <button className="btn primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : mode === 'create' ? 'Crear caso y continuar' : 'Guardar general'}
        </button>
        {mode === 'edit' && active === false && (
          <span className="field-hint">Está en borrador: no aparece en el catálogo.</span>
        )}
        {savedAt && <span className="note-ok" style={{ padding: '6px 10px' }}>Guardado {savedAt}</span>}
      </div>
    </form>
  );
}
