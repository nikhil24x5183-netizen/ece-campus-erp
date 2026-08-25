if (!global.fetch) {
  global.fetch = async () => ({ json: async () => ({ db: null }) });
}
if (!global.localStorage) {
  const store = {};
  global.localStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = v; },
    removeItem: (k) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}
if (!global.sessionStorage) {
  const store = {};
  global.sessionStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = v; },
    removeItem: (k) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}
if (!global.Toast) {
  global.Toast = { success: console.log, error: console.error, warning: console.warn, info: console.log };
}

require('./static/js/api.js');
require('./static/js/utils/exporter.js');

async function testExporter() {
  console.log("=== TESTING EXPORTER & REPORTS EXCEL MASTER SHEET ===");

  if (typeof global.Exporter.downloadCSV !== 'function') {
    console.error("❌ Exporter.downloadCSV is not defined!");
    process.exit(1);
  }
  console.log("✅ Exporter.downloadCSV exists!");

  if (typeof global.Exporter.exportMultiSheetXLSX !== 'function') {
    console.error("❌ Exporter.exportMultiSheetXLSX is not defined!");
    process.exit(1);
  }
  console.log("✅ Exporter.exportMultiSheetXLSX exists!");

  console.log("=== EXPORTER VERIFICATION PASSED SUCCESSFULLY ===");
}

testExporter().catch(err => {
  console.error("Test failure:", err);
  process.exit(1);
});
