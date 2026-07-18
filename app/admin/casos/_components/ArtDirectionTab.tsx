'use client';

import { useCallback, useEffect, useState } from 'react';
import { buildSuspectPrompt, buildCoverPrompt, buildHeroPrompt } from '@/lib/engine/prompt-builder';
import { getSpec, IMAGE_SPECS, type ImageSpec } from '@/lib/domain/image-specs';
import { formatMaxSize } from '@/components/SpecPanel';
import MediaUploader from './MediaUploader';

/** Slots relevantes para un caso, en orden de aparición. */
const CASE_SPEC_SLOTS = [
  'case.cover',
  'case.hero',
  'suspect.portrait',
  'evidence.document',
  'evidence.photo',
  'evidence.vhs_still',
  'video.vhs_clip',
];

interface ArtSuspect {
  id: string;
  full_name: string;
  age: number | null;
  occupation: string | null;
  physical_description: string;
  distinctive_features: string;
  image_prompt: string;
  photo_path: string | null;
  photoUrl: string | null;
}
interface Visual {
  id: string;
  slot_name: string;
  media_kind: 'image' | 'video';
  variant_id: string | null;
  prompt: string;
  negative_prompt: string;
  technical_params: Record<string, unknown>;
  reference_notes: string;
  generated_asset_path: string | null;
  assetUrl: string | null;
  status: 'pending' | 'generated' | 'approved';
}
interface ArtData {
  case: {
    slug: string;
    title: string;
    active: boolean;
    art_direction: string;
    cover_image_prompt: string;
    hero_image_prompt: string;
    art_autoinject: boolean;
    cover_image_path: string | null;
    atmosphere_image_path: string | null;
  };
  suspects: ArtSuspect[];
  variants: { id: string; code: string; culprit: string }[];
  visualPrompts: Visual[];
}

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = useCallback((text: string, key: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    });
  }, []);
  return { copied, copy };
}

export default function ArtDirectionTab({ slug }: { slug: string }) {
  const [data, setData] = useState<ArtData | null>(null);
  const { copied, copy } = useCopy();

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/cases/${slug}/art-direction`, { cache: 'no-store' });
    if (res.ok) setData((await res.json()) as ArtData);
  }, [slug]);
  useEffect(() => {
    load();
  }, [load]);

  if (!data) return <div className="empty-hint">Cargando dirección de arte…</div>;

  const ad = data.case.art_direction;
  const inject = data.case.art_autoinject;

  // ----- Checklist -----
  const items: { label: string; done: boolean }[] = [
    { label: 'Portada del caso', done: !!data.case.cover_image_path },
    { label: 'Imagen hero', done: !!data.case.atmosphere_image_path },
    ...data.suspects.map((s) => ({ label: `Foto — ${s.full_name}`, done: !!s.photo_path })),
    ...data.visualPrompts.map((v) => ({ label: `Asset — ${v.slot_name}`, done: !!v.generated_asset_path })),
  ];
  const done = items.filter((i) => i.done).length;

  return (
    <div className="cpanel wide art-tab">
      {/* ============ Sección 1: estilo ============ */}
      <section className="art-sec">
        <h3 className="art-h">1 · Estilo general del caso</h3>
        <StyleEditor slug={slug} initial={ad} inject={inject} onSaved={load} />
      </section>

      {/* ============ Sección 2: imágenes principales ============ */}
      <section className="art-sec">
        <h3 className="art-h">2 · Imágenes principales</h3>
        <MainImage
          slug={slug}
          label="Portada del catálogo"
          field="cover_image_prompt"
          promptValue={data.case.cover_image_prompt}
          imagePath={data.case.cover_image_path}
          uploadCategory="cover"
          casePathField="cover_image_path"
          specSlot="case.cover"
          builder={(scene) => buildCoverPrompt(scene, ad, inject, getSpec('case.cover'))}
          copy={copy}
          copied={copied}
          onChanged={load}
        />
        <MainImage
          slug={slug}
          label="Imagen hero (detalle)"
          field="hero_image_prompt"
          promptValue={data.case.hero_image_prompt}
          imagePath={data.case.atmosphere_image_path}
          uploadCategory="atmosphere"
          casePathField="atmosphere_image_path"
          specSlot="case.hero"
          builder={(scene) => buildHeroPrompt(scene, ad, inject, getSpec('case.hero'))}
          copy={copy}
          copied={copied}
          onChanged={load}
        />
      </section>

      {/* ============ Sección 3: sospechosos ============ */}
      <section className="art-sec">
        <h3 className="art-h">3 · Sospechosos</h3>
        <p className="field-hint" style={{ marginTop: -6 }}>
          El botón “Generar prompt” combina descripción física + rasgos distintivos + dirección de arte.
        </p>
        <div className="art-suspects">
          {data.suspects.map((s) => (
            <SuspectArt key={s.id} slug={slug} suspect={s} artDirection={ad} inject={inject} copy={copy} copied={copied} onChanged={load} />
          ))}
          {data.suspects.length === 0 && <div className="empty-hint">Agrega sospechosos en su tab primero.</div>}
        </div>
      </section>

      {/* ============ Sección 4: assets adicionales ============ */}
      <section className="art-sec">
        <h3 className="art-h">4 · Assets adicionales (escena, VHS, evidencia)</h3>
        <VisualPrompts slug={slug} visuals={data.visualPrompts} variants={data.variants} copy={copy} copied={copied} onChanged={load} />
      </section>

      {/* ============ Sección 5: referencia de tamaños ============ */}
      <section className="art-sec">
        <h3 className="art-h">5 · Referencia de tamaños</h3>
        <SizeReference caseTitle={data.case.title} />
      </section>

      {/* ============ Sección 6: checklist ============ */}
      <section className="art-sec">
        <h3 className="art-h">6 · Checklist de assets</h3>
        <div className="art-checklist">
          <div className="art-progress">
            <b className="mono">{done}</b> de <b className="mono">{items.length}</b> assets con imagen generada
          </div>
          {data.case.active && done < items.length && (
            <div className="note-error" style={{ marginTop: 10 }}>
              ⚠ El caso está <b>activo</b> pero faltan {items.length - done} asset(s) por generar.
            </div>
          )}
          <ul className="art-check-list">
            {items.map((it, i) => (
              <li key={i} className={it.done ? 'ok' : ''}>
                <span>{it.done ? '✓' : '○'}</span> {it.label}
              </li>
            ))}
          </ul>
          <a className="btn ghost" href={`/api/admin/cases/${slug}/art-guide`} target="_blank" rel="noreferrer">
            Descargar GUIA-DE-ARTE.md
          </a>
        </div>
      </section>
    </div>
  );
}

/* ---------------- Subcomponentes ---------------- */

function StyleEditor({ slug, initial, inject, onSaved }: { slug: string; initial: string; inject: boolean; onSaved: () => void }) {
  const [val, setVal] = useState(initial);
  const [autoInject, setAutoInject] = useState(inject);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <div>
      <textarea
        className="input tall"
        value={val}
        onChange={(e) => { setVal(e.target.value); setSaved(false); }}
        placeholder="Ej: Fotografía de época noir de los años 40, blanco y negro con grano fino, iluminación dramática de claroscuro, atmósfera lluviosa nocturna, paleta desaturada con acentos de rojo carmín."
      />
      <label className="toggle" style={{ marginTop: 10 }}>
        <input type="checkbox" checked={autoInject} onChange={(e) => { setAutoInject(e.target.checked); setSaved(false); }} />
        <span className="track" />
        <span>Auto-inyectar este estilo en todos los prompts del caso</span>
      </label>
      <div className="row-actions" style={{ marginTop: 12 }}>
        <button
          className="btn primary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await fetch(`/api/admin/cases/${slug}/art-direction`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ art_direction: val, art_autoinject: autoInject }),
            });
            setBusy(false);
            setSaved(true);
            onSaved();
          }}
        >
          {busy ? 'Guardando…' : 'Guardar estilo'}
        </button>
        {saved && <span className="note-ok" style={{ padding: '6px 10px' }}>Guardado</span>}
      </div>
    </div>
  );
}

function MainImage(props: {
  slug: string;
  label: string;
  field: 'cover_image_prompt' | 'hero_image_prompt';
  promptValue: string;
  imagePath: string | null;
  uploadCategory: string;
  casePathField: 'cover_image_path' | 'atmosphere_image_path';
  specSlot: string;
  builder: (scene: string) => string;
  copy: (t: string, k: string) => void;
  copied: string | null;
  onChanged: () => void;
}) {
  const [prompt, setPrompt] = useState(props.promptValue);
  const [scene, setScene] = useState('');
  const key = props.field;

  async function savePrompt() {
    await fetch(`/api/admin/cases/${props.slug}/art-direction`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [props.field]: prompt }),
    });
    props.onChanged();
  }

  return (
    <div className="art-main">
      <div className="art-main-head">
        <b>{props.label}</b>
        {props.imagePath && <span className="badge-state teal">generada</span>}
      </div>
      <input className="input" placeholder="Escena (para regenerar): ej. cabina de radio a oscuras, micrófono volcado" value={scene} onChange={(e) => setScene(e.target.value)} />
      <textarea className="input tall" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Prompt de imagen…" style={{ marginTop: 8 }} />
      <div className="row-actions" style={{ marginTop: 8, flexWrap: 'wrap' }}>
        <button className="btn ghost" onClick={() => props.copy(prompt, key)}>{props.copied === key ? '¡Copiado!' : 'Copiar prompt'}</button>
        <button className="btn ghost" onClick={() => setPrompt(props.builder(scene || 'escena emblemática del caso'))}>Regenerar prompt</button>
        <button className="btn primary" onClick={savePrompt}>Guardar prompt</button>
      </div>
      <div style={{ marginTop: 10 }}>
        <MediaUploader
          caseSlug={props.slug}
          kind="image"
          category={props.uploadCategory}
          value={props.imagePath}
          label="Subir asset generado"
          spec={getSpec(props.specSlot)}
          onUploaded={async (path) => {
            await fetch(`/api/admin/cases/${props.slug}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ [props.casePathField]: path }),
            });
            props.onChanged();
          }}
        />
      </div>
    </div>
  );
}

function SuspectArt({
  slug,
  suspect,
  artDirection,
  inject,
  copy,
  copied,
  onChanged,
}: {
  slug: string;
  suspect: ArtSuspect;
  artDirection: string;
  inject: boolean;
  copy: (t: string, k: string) => void;
  copied: string | null;
  onChanged: () => void;
}) {
  const [phys, setPhys] = useState(suspect.physical_description);
  const [feat, setFeat] = useState(suspect.distinctive_features);
  const [prompt, setPrompt] = useState(suspect.image_prompt);
  const [busy, setBusy] = useState(false);

  function generate() {
    setPrompt(
      buildSuspectPrompt(
        { name: suspect.full_name, age: suspect.age, occupation: suspect.occupation, physical_description: phys, distinctive_features: feat },
        artDirection,
        inject,
        getSpec('suspect.portrait'),
      ),
    );
  }
  async function save() {
    setBusy(true);
    await fetch(`/api/admin/suspects/${suspect.id}/prompt`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ physical_description: phys, distinctive_features: feat, image_prompt: prompt }),
    });
    setBusy(false);
    onChanged();
  }

  return (
    <div className="art-suspect">
      <div className="art-suspect-top">
        <div className="art-suspect-photo">
          {suspect.photoUrl ? <img src={suspect.photoUrl} alt={suspect.full_name} /> : <span className="mono">sin foto</span>}
        </div>
        <div>
          <b>{suspect.full_name}</b>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{suspect.occupation}</div>
        </div>
      </div>
      <label className="label">Descripción física</label>
      <textarea className="input" value={phys} onChange={(e) => setPhys(e.target.value)} placeholder="Edad, altura, complexión, cabello, ojos, tono de piel, vestimenta…" />
      <label className="label" style={{ marginTop: 8 }}>Rasgos distintivos (pistas)</label>
      <textarea className="input" value={feat} onChange={(e) => setFeat(e.target.value)} placeholder="Tatuajes, cicatrices, lentes, anillos, cojera… deben ser detectables por los jugadores." />
      <label className="label" style={{ marginTop: 8 }}>Prompt de imagen</label>
      <textarea className="input tall mono" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <div className="row-actions" style={{ marginTop: 8, flexWrap: 'wrap' }}>
        <button className="btn ghost" onClick={generate}>Generar prompt</button>
        <button className="btn ghost" onClick={() => copy(prompt, 'sus-' + suspect.id)}>{copied === 'sus-' + suspect.id ? '¡Copiado!' : 'Copiar'}</button>
        <button className="btn primary" onClick={save} disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button>
      </div>
      <div style={{ marginTop: 8 }}>
        <MediaUploader
          caseSlug={slug}
          kind="image"
          category="sospechosos"
          value={suspect.photo_path}
          label="Subir foto generada"
          spec={getSpec('suspect.portrait')}
          onUploaded={async (path) => {
            await fetch(`/api/admin/cases/${slug}/suspects`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ op: 'update', data: { id: suspect.id, full_name: suspect.full_name, photo_path: path, physical_description: phys, distinctive_features: feat, image_prompt: prompt } }),
            });
            onChanged();
          }}
        />
      </div>
    </div>
  );
}

function SizeReference({ caseTitle }: { caseTitle: string }) {
  const specs = CASE_SPEC_SLOTS.map((s) => IMAGE_SPECS[s]).filter(Boolean) as ImageSpec[];

  function download() {
    const rows = specs
      .map(
        (s) =>
          `| ${s.label} | \`${s.slot}\` | ${s.width}×${s.height} px | ${s.aspectRatio} | ${formatMaxSize(
            s.maxSizeMB,
          )} | ${s.formats.map((f) => f.toUpperCase()).join(', ')}${s.durationSeconds ? ` · ${s.durationSeconds[0]}–${s.durationSeconds[1]} s` : ''} |`,
      )
      .join('\n');
    const md =
      `# Guía de tamaños — ${caseTitle}\n\n` +
      `Dimensiones y formatos recomendados para cada asset del caso. Al generar con IA, incluye el aspecto ` +
      `(\`--ar\`) y respeta el ancho mínimo para evitar imágenes borrosas.\n\n` +
      `| Asset | Slot | Dimensiones | Proporción | Peso máx | Formatos |\n` +
      `| --- | --- | --- | --- | --- | --- |\n${rows}\n\n` +
      specs
        .filter((s) => s.notes)
        .map((s) => `- **${s.label}** (${s.aspectRatio}): ${s.notes}`)
        .join('\n') +
      '\n';
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guia-de-tamanos.md';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <p className="field-hint" style={{ marginTop: -6 }}>
        Tamaños esperados por asset. Copia el aspecto en tus prompts de IA y sube imágenes de al menos el ancho mínimo.
      </p>
      <div className="size-table-wrap">
        <table className="size-table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Dimensiones</th>
              <th>Proporción</th>
              <th>Peso máx</th>
              <th>Formatos</th>
            </tr>
          </thead>
          <tbody>
            {specs.map((s) => (
              <tr key={s.slot}>
                <td>
                  {s.label}
                  <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{s.slot}</div>
                </td>
                <td className="mono">{s.width}×{s.height}{s.durationSeconds ? ` · ${s.durationSeconds[0]}–${s.durationSeconds[1]}s` : ''}</td>
                <td className="mono">{s.aspectRatio}</td>
                <td className="mono">{formatMaxSize(s.maxSizeMB)}</td>
                <td className="mono">{s.formats.map((f) => f.toUpperCase()).join(' · ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="row-actions" style={{ marginTop: 12 }}>
        <button className="btn ghost" onClick={download}>Descargar guía de tamaños</button>
      </div>
    </div>
  );
}

function VisualPrompts({
  slug,
  visuals,
  variants,
  copy,
  copied,
  onChanged,
}: {
  slug: string;
  visuals: Visual[];
  variants: { id: string; code: string; culprit: string }[];
  copy: (t: string, k: string) => void;
  copied: string | null;
  onChanged: () => void;
}) {
  const [adding, setAdding] = useState(false);

  async function op(operation: string, payload: unknown) {
    await fetch(`/api/admin/cases/${slug}/visual-prompts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: operation, data: payload }),
    });
    onChanged();
  }

  return (
    <div className="art-visuals">
      {visuals.map((v) => (
        <VisualCard key={v.id} slug={slug} v={v} variants={variants} copy={copy} copied={copied} onSave={(data) => op('update', { ...data, id: v.id })} onDelete={() => op('delete', { id: v.id })} onChanged={onChanged} />
      ))}
      {adding && (
        <VisualCard
          slug={slug}
          v={{ id: '', slot_name: '', media_kind: 'image', variant_id: null, prompt: '', negative_prompt: '', technical_params: {}, reference_notes: '', generated_asset_path: null, assetUrl: null, status: 'pending' }}
          variants={variants}
          copy={copy}
          copied={copied}
          isNew
          onSave={async (data) => { await op('create', data); setAdding(false); }}
          onCancel={() => setAdding(false)}
          onChanged={onChanged}
        />
      )}
      {!adding && <button className="btn ghost add-btn" onClick={() => setAdding(true)}>+ Agregar slot</button>}
    </div>
  );
}

function VisualCard({
  slug,
  v,
  variants,
  copy,
  copied,
  isNew,
  onSave,
  onDelete,
  onCancel,
  onChanged,
}: {
  slug: string;
  v: Visual;
  variants: { id: string; code: string; culprit: string }[];
  copy: (t: string, k: string) => void;
  copied: string | null;
  isNew?: boolean;
  onSave: (data: Partial<Visual> & { technical_params: Record<string, unknown> }) => void;
  onDelete?: () => void;
  onCancel?: () => void;
  onChanged: () => void;
}) {
  const [f, setF] = useState({
    slot_name: v.slot_name,
    media_kind: v.media_kind,
    variant_id: v.variant_id,
    prompt: v.prompt,
    negative_prompt: v.negative_prompt,
    params: typeof v.technical_params?.raw === 'string' ? (v.technical_params.raw as string) : Object.entries(v.technical_params ?? {}).map(([k, x]) => `${k}: ${x}`).join(', '),
    reference_notes: v.reference_notes,
    status: v.status,
    generated_asset_path: v.generated_asset_path,
  });
  const set = (k: string, val: unknown) => setF((p) => ({ ...p, [k]: val }));

  const fullPrompt = [f.prompt, f.negative_prompt ? `[NEGATIVE] ${f.negative_prompt}` : '', f.params ? `[PARAMS] ${f.params}` : ''].filter(Boolean).join('\n');

  return (
    <div className="art-visual entity">
      <div className="entity-body" style={{ borderTop: 'none' }}>
        <div className="form-grid">
          <div>
            <label className="label">Slot</label>
            <input className="input mono" placeholder="scene_of_crime" value={f.slot_name} onChange={(e) => set('slot_name', e.target.value.toLowerCase())} />
          </div>
          <div>
            <label className="label">Tipo</label>
            <select className="input" value={f.media_kind} onChange={(e) => set('media_kind', e.target.value)}>
              <option value="image">Imagen</option>
              <option value="video">Video</option>
            </select>
          </div>
          <div>
            <label className="label">Variante (opcional)</label>
            <select className="input" value={f.variant_id ?? ''} onChange={(e) => set('variant_id', e.target.value || null)}>
              <option value="">Todas</option>
              {variants.map((vr) => <option key={vr.id} value={vr.id}>Variante {vr.code}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Estado</label>
            <select className="input" value={f.status} onChange={(e) => set('status', e.target.value)}>
              <option value="pending">Pendiente</option>
              <option value="generated">Generado</option>
              <option value="approved">Aprobado</option>
            </select>
          </div>
          <div className="full">
            <label className="label">Prompt</label>
            <textarea className="input tall mono" value={f.prompt} onChange={(e) => set('prompt', e.target.value)} />
          </div>
          <div className="full">
            <label className="label">Negative prompt</label>
            <textarea className="input" value={f.negative_prompt} onChange={(e) => set('negative_prompt', e.target.value)} />
          </div>
          <div>
            <label className="label">Parámetros técnicos</label>
            <input className="input mono" placeholder="--ar 16:9 --s 250" value={f.params} onChange={(e) => set('params', e.target.value)} />
          </div>
          <div>
            <label className="label">Notas de referencia</label>
            <input className="input" value={f.reference_notes} onChange={(e) => set('reference_notes', e.target.value)} />
          </div>
        </div>

        <div className="row-actions" style={{ flexWrap: 'wrap' }}>
          <button className="btn ghost" onClick={() => copy(fullPrompt, 'vp-' + (v.id || f.slot_name))}>{copied === 'vp-' + (v.id || f.slot_name) ? '¡Copiado!' : 'Copiar prompt completo'}</button>
          <button
            className="btn primary"
            disabled={!f.slot_name}
            onClick={() => onSave({ slot_name: f.slot_name, media_kind: f.media_kind, variant_id: f.variant_id, prompt: f.prompt, negative_prompt: f.negative_prompt, technical_params: { raw: f.params }, reference_notes: f.reference_notes, status: f.status, generated_asset_path: f.generated_asset_path })}
          >
            Guardar
          </button>
          {isNew ? <button className="btn ghost" onClick={onCancel}>Cancelar</button> : <button className="btn ghost" style={{ color: 'var(--alert)' }} onClick={onDelete}>Eliminar</button>}
        </div>

        {!isNew && (
          <div style={{ marginTop: 8 }}>
            <MediaUploader
              caseSlug={slug}
              kind={f.media_kind === 'video' ? 'video' : 'image'}
              category={'assets/' + (f.slot_name || 'slot')}
              value={f.generated_asset_path}
              label="Subir asset generado"
              spec={getSpec(f.media_kind === 'video' ? 'video.vhs_clip' : f.slot_name.includes('vhs') ? 'evidence.vhs_still' : 'evidence.photo')}
              onUploaded={(path) => { set('generated_asset_path', path); onSave({ slot_name: f.slot_name, media_kind: f.media_kind, variant_id: f.variant_id, prompt: f.prompt, negative_prompt: f.negative_prompt, technical_params: { raw: f.params }, reference_notes: f.reference_notes, status: 'generated', generated_asset_path: path }); }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
