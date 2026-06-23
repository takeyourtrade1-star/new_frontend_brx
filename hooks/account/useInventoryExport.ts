import { useCallback, useState } from 'react';
import {
  downloadBlob,
  escapeCsvCell,
  itemToExportRow,
} from '@/lib/inventory/inventory-export-utils';

type ExportItem = Parameters<typeof itemToExportRow>[0];

/**
 * Piano 1.4 — seam "export" estratto da OggettiContent.
 * Gestisce lo stato del menu export e gli handler CSV (selezione / inventario
 * filtrato) e JSON. Logica spostata fedelmente; usa gli helper già esistenti in
 * `lib/inventory/inventory-export-utils`.
 */
export function useInventoryExport({
  filteredInventoryItems,
  selectedIds,
}: {
  filteredInventoryItems: ExportItem[];
  selectedIds: Set<number>;
}) {
  const [exportModalOpen, setExportModalOpen] = useState(false);

  /** Export selezione in CSV. */
  const handleExportSelectionCSV = useCallback(() => {
    const selectedItems = filteredInventoryItems.filter((item) => selectedIds.has(item.id));
    if (selectedItems.length === 0) return;

    const rows = selectedItems.map(itemToExportRow);
    const headers = Object.keys(rows[0] as object);
    const csvLines = [
      headers.map(escapeCsvCell).join(','),
      ...rows.map((r) => headers.map((h) => escapeCsvCell((r as Record<string, unknown>)[h])).join(',')),
    ];
    const csv = csvLines.join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const filename = `selezione-ebartex-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadBlob(blob, filename);
  }, [filteredInventoryItems, selectedIds]);

  /** Export in CSV (tutto l'inventario filtrato). */
  const handleExportCSV = useCallback(() => {
    const rows = filteredInventoryItems.map(itemToExportRow);
    if (rows.length === 0) {
      return;
    }
    const headers = Object.keys(rows[0] as object);
    const csvLines = [
      headers.map(escapeCsvCell).join(','),
      ...rows.map((r) => headers.map((h) => escapeCsvCell((r as Record<string, unknown>)[h])).join(',')),
    ];
    const csv = csvLines.join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const filename = `collezione-ebartex-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadBlob(blob, filename);
    setExportModalOpen(false);
  }, [filteredInventoryItems]);

  /** Export in JSON (solo dati in memoria, nessuna chiamata API). */
  const handleExportJSON = useCallback(() => {
    const data = {
      exported_at: new Date().toISOString(),
      total_items: filteredInventoryItems.length,
      total_quantity: filteredInventoryItems.reduce((s, i) => s + (i.quantity ?? 0), 0),
      items: filteredInventoryItems.map(itemToExportRow),
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const filename = `collezione-ebartex-${new Date().toISOString().slice(0, 10)}.json`;
    downloadBlob(blob, filename);
    setExportModalOpen(false);
  }, [filteredInventoryItems]);

  return {
    exportModalOpen,
    setExportModalOpen,
    handleExportSelectionCSV,
    handleExportCSV,
    handleExportJSON,
  };
}
