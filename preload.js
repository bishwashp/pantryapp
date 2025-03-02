const { contextBridge, ipcRenderer } = require('electron');

console.log('Initializing preload script...');

const api = {
  getCategories: async () => {
    console.log('Calling getCategories');
    const result = await ipcRenderer.invoke('get-categories');
    console.log('getCategories result:', result);
    return result;
  },
  addCategory: async (name) => {
    console.log('Calling addCategory:', name);
    const result = await ipcRenderer.invoke('add-category', name);
    console.log('addCategory result:', result);
    return result;
  },
  deleteCategory: async (id) => {
    console.log('Calling deleteCategory:', id);
    const result = await ipcRenderer.invoke('delete-category', id);
    console.log('deleteCategory result:', result);
    return result;
  },
  getStocksWithLatest: async () => {
    console.log('Calling getStocksWithLatest');
    const result = await ipcRenderer.invoke('get-stocks-with-latest');
    console.log('getStocksWithLatest result:', result);
    return result;
  },
  addStock: async (stock) => {
    console.log('Calling addStock:', stock);
    const result = await ipcRenderer.invoke('add-stock', stock);
    console.log('addStock result:', result);
    return result;
  },
  updateStock: async (stock) => {
    console.log('Calling updateStock:', stock);
    const result = await ipcRenderer.invoke('update-stock', stock);
    console.log('updateStock result:', result);
    return result;
  },
  deleteStock: async (id) => {
    console.log('Calling deleteStock:', id);
    const result = await ipcRenderer.invoke('delete-stock', id);
    console.log('deleteStock result:', result);
    return result;
  },
  getHistory: async () => {
    console.log('Calling getHistory');
    const result = await ipcRenderer.invoke('get-history');
    console.log('getHistory result:', result);
    return result;
  }
};

console.log('Exposing API to renderer process...');
contextBridge.exposeInMainWorld('api', api);
console.log('Preload script initialization complete');