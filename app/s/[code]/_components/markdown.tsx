// Render mínimo y seguro de Markdown (contenido de autoría del admin).
// Soporta: #/##/### encabezados, **negrita**, *itálica*, listas con "- ",
// y párrafos separados por línea en blanco. No inyecta HTML crudo.
import React from 'react';

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[2] !== undefined) nodes.push(<strong key={`${keyBase}-b${i}`}>{m[2]}</strong>);
    else if (m[3] !== undefined) nodes.push(<em key={`${keyBase}-i${i}`}>{m[3]}</em>);
    last = m.index + m[0].length;
    i += 1;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Markdown({ source }: { source: string }) {
  const blocks = source.split(/\n{2,}/);
  return (
    <>
      {blocks.map((block, bi) => {
        const lines = block.split('\n');
        // Lista
        if (lines.every((l) => l.trim().startsWith('- '))) {
          return (
            <ul key={bi} className="md-ul">
              {lines.map((l, li) => (
                <li key={li}>{renderInline(l.trim().slice(2), `${bi}-${li}`)}</li>
              ))}
            </ul>
          );
        }
        // Encabezados (si el bloque es una sola línea con #)
        const h = block.match(/^(#{1,3})\s+(.*)$/);
        if (h) {
          const level = h[1].length;
          const content = renderInline(h[2], `h${bi}`);
          if (level === 1) return <h3 key={bi} className="md-h1">{content}</h3>;
          if (level === 2) return <h4 key={bi} className="md-h2">{content}</h4>;
          return <h5 key={bi} className="md-h3">{content}</h5>;
        }
        // Párrafo con saltos de línea simples
        return (
          <p key={bi} className="md-p">
            {lines.map((l, li) => (
              <React.Fragment key={li}>
                {renderInline(l, `${bi}-${li}`)}
                {li < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}
