// Clear all browser caches and reload
console.log('🗑️ Clearing all caches...');

// Clear Service Worker caches
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      console.log(`Deleting cache: ${name}`);
      caches.delete(name);
    });
  });
}

// Clear localStorage
localStorage.clear();
console.log('✅ localStorage cleared');

// Clear sessionStorage
sessionStorage.clear();
console.log('✅ sessionStorage cleared');

// Clear IndexedDB
if ('indexedDB' in window) {
  indexedDB.databases().then(dbs => {
    dbs.forEach(db => {
      console.log(`Deleting database: ${db.name}`);
      indexedDB.deleteDatabase(db.name);
    });
  });
}

console.log('✅ All caches cleared! Reloading page...');
setTimeout(() => {
  location.reload(true);
}, 1000);
