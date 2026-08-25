/* CSV & Multi-Sheet Excel Exporter Utilities */
const Exporter = {
  downloadCSV(csvContent, filename) {
    if (!csvContent) {
      Toast.warning('No CSV data available to export.');
      return;
    }
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  exportToCSV(filename, rows) {
    if (!rows || !rows.length) {
      Toast.warning('No data available to export.');
      return;
    }

    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => headers.map(header => {
        let val = row[header] === null || row[header] === undefined ? '' : String(row[header]);
        val = val.replace(/"/g, '""');
        return `"${val}"`;
      }).join(','))
    ].join('\n');

    this.downloadCSV(csvContent, `${filename}.csv`);
  },

  exportMultiSheetXLSX(filename, sheetsMap) {
    if (typeof XLSX !== 'undefined') {
      try {
        const wb = XLSX.utils.book_new();
        Object.keys(sheetsMap).forEach(sheetName => {
          const rows = sheetsMap[sheetName];
          const wsData = (rows && rows.length > 0) ? rows : [{ 'Notice': 'No student records registered for this section.' }];
          const ws = XLSX.utils.json_to_sheet(wsData);
          XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
        });
        XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
        return true;
      } catch (e) {
        console.error('SheetJS XLSX export error:', e);
      }
    }
    return false;
  },

  printPage() {
    window.print();
  }
};

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

if (typeof window !== 'undefined') window.Exporter = Exporter;
if (typeof global !== 'undefined') global.Exporter = Exporter;

