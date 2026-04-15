'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';

type Row = Record<string, any>;

export default function ExcelImporter() {
  const [rows, setRows] = useState<Row[]>([]);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      if (!data) return;
      const wb = XLSX.read(data, { type: 'array' });
      const first = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Row>(first, { defval: '' });
      setRows(json.slice(0, 8));
    };
    reader.readAsArrayBuffer(file);
  }

  return (
    <div className="card stack">
      <div>
        <h3 style={{ margin: 0 }}>Vista previa de importación Excel</h3>
        <p className="muted small">Aquí validas columnas antes de mapearlas a Supabase. He dejado la base lista para convertirlo en importador definitivo.</p>
      </div>
      <input className="input" type="file" accept=".xlsx,.xls" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
      }} />
      {rows.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>{Object.keys(rows[0]).map((k) => <th key={k}>{k}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>{Object.keys(rows[0]).map((k) => <td key={k}>{String(r[k])}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
