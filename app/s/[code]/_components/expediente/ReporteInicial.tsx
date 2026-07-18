'use client';

import type { PublicEvidence } from '../types';
import { Markdown } from '../markdown';
import EmptyState from '@/components/EmptyState';

/** Reporte inicial del caso: lo primero que se ve al entrar. */
export default function ReporteInicial({ report, sessionCode }: { report: PublicEvidence | null; sessionCode: string }) {
  if (!report) {
    return <EmptyState ill="folder" title="Sin reporte inicial" message="Este caso todavía no tiene un parte informativo cargado." />;
  }
  return (
    <div className="reporte no-select" onContextMenu={(e) => e.preventDefault()}>
      <div className="reporte-stamp mono">PARTE INFORMATIVO · LEER PRIMERO</div>
      <h2 className="reporte-title">{report.title}</h2>
      {report.mediaUrl && <img className="doc-image" src={report.mediaUrl} alt={report.title} draggable={false} />}
      {report.body_md && <div className="doc-md reporte-md"><Markdown source={report.body_md} /></div>}
      <div className="doc-watermark mono">Turno Nocturno · sesión {sessionCode}</div>
    </div>
  );
}
