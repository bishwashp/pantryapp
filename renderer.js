// Cache for stocks data
console.log('=== RENDERER.JS LOADED ===');
console.log('Current time:', new Date().toISOString());
let stocksCache = null;
let categoriesCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

// Global DOM references
let modal, categoryModal, form, categoryForm, editStockId = null;

// Simplified initialization function
function initializeApp() {
  console.log('Initializing app...');
  
  // Get DOM elements
  modal = document.getElementById('modal');
  categoryModal = document.getElementById('category-modal');
  form = document.getElementById('stock-form');
  categoryForm = document.getElementById('category-form');
  
  console.log('DOM elements initialized:', {
    modal: !!modal,
    categoryModal: !!categoryModal,
    form: !!form,
    categoryForm: !!categoryForm
  });
  
  // Add event listeners for modal close buttons
  if (modal) {
    const modalClose = modal.querySelector('.modal-close');
    const modalCancel = modal.querySelector('.secondary-button');
    if (modalClose) modalClose.addEventListener('click', () => modal.style.display = 'none');
    if (modalCancel) modalCancel.addEventListener('click', () => modal.style.display = 'none');
  }
  
  if (categoryModal) {
    const catModalClose = categoryModal.querySelector('.modal-close');
    const catModalCancel = categoryModal.querySelector('.secondary-button');
    if (catModalClose) catModalClose.addEventListener('click', () => categoryModal.style.display = 'none');
    if (catModalCancel) catModalCancel.addEventListener('click', () => categoryModal.style.display = 'none');
  }
  
  // Add button event listeners
  const addBtn = document.getElementById('add-stock-btn');
  if (addBtn) addBtn.addEventListener('click', () => openModal());
  
  const addCategoryBtn = document.getElementById('add-category-btn');
  if (addCategoryBtn) addCategoryBtn.addEventListener('click', addNewCategory);
  
  // Form submit handlers
  if (form) form.addEventListener('submit', handleFormSubmit);
  
  if (categoryForm) {
    console.log('Attaching submit handler to category form');
    categoryForm.addEventListener('submit', categoryFormSubmitHandler);
  }
  
  // Add toggle functionality
  const toggleContainer = document.querySelector('.toggle-container');
  if (toggleContainer) {
    const toggleOptions = toggleContainer.querySelectorAll('.toggle-option');
    toggleOptions.forEach(option => {
      option.addEventListener('click', () => {
        const value = option.dataset.value;
        toggleOptions.forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        toggleContainer.dataset.active = value;
        toggleFields(value);
      });
    });
  }
  
  // Initialize tabs
  initializeTabs();
  
  // Load home tab initially
  loadHome();
}

// The category form submit handler as a separate function
async function categoryFormSubmitHandler(e) {
  e.preventDefault();
  console.log('Category form submitted');
  
  const errorMsg = document.getElementById('category-error-msg');
  const submitBtn = e.target.querySelector('.submit-btn');
  const categoryNameInput = document.getElementById('category-name');
  
  try {
    const name = categoryNameInput.value.trim();
    console.log('Submitting category form with name:', name);
    
    if (!name) {
      throw new Error('Name is required');
    }
    
    console.log('Adding new category:', name);
    // Add the category to the database using debug API
    try {
      console.log('Calling debug.addTestCategory with name:', name);
      const newCategoryId = await window.api.debug.addTestCategory(name);
      console.log('New category added with ID:', newCategoryId);
      
      // Show success state
      submitBtn.classList.add('success');
      submitBtn.style.background = '#34C759';
      
      // Force cache invalidation
      console.log('Invalidating cache...');
      invalidateCache();
      
      // Check if we're in the stock modal context
      if (modal && modal.style.display === 'block') {
        console.log('Refreshing category dropdown in stock modal...');
        // Get fresh categories
        const categories = await window.api.getCategories();
        
        // Update the category dropdown
        const categorySelect = document.getElementById('stock-category');
        if (categorySelect) {
          // Save current selection if any
          const currentSelection = categorySelect.value;
          
          // Clear existing options
          categorySelect.innerHTML = '';
          
          // Add options for each category
          categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
          });
          
          // Set selection to the new category
          categorySelect.value = newCategoryId;
        }
      } else {
        // Reload settings page with fresh data
        console.log('Reloading settings...');
        await loadSettings();
        
        // Find and expand the Categories section
        const categoriesSection = document.querySelector('.settings-section');
        if (categoriesSection) {
          const list = categoriesSection.querySelector('.settings-list');
          const indicator = categoriesSection.querySelector('.collapse-indicator');
          list.classList.remove('collapsed');
          indicator.textContent = '▼';
        }
      }
      
      // Verify the new category is in the database
      console.log('Verifying category was added...');
      const updatedCategories = await window.api.debug.inspectCategories();
      console.log('Updated categories after adding:', updatedCategories);
      
      const addedCategory = updatedCategories.find(c => c.id === newCategoryId);
      if (addedCategory) {
        console.log('Successfully verified new category:', addedCategory);
      } else {
        console.warn('Could not find newly added category with ID:', newCategoryId);
      }
      
      // Close modal and reset form after a short delay
      setTimeout(() => {
        submitBtn.classList.remove('success');
        submitBtn.style.background = '#007AFF';
        categoryModal.style.display = 'none';
        
        // Reset form state
        categoryNameInput.value = '';
        categoryNameInput.style.borderColor = '#E5E5EA';
        errorMsg.textContent = '';
        errorMsg.style.display = 'none';
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        submitBtn.style.cursor = 'not-allowed';
      }, 1500);
    } catch (err) {
      console.error('Failed to add category:', err);
      throw new Error(err.message || 'Failed to save category');
    }
  } catch (err) {
    console.error('Category form submission failed:', err);
    errorMsg.textContent = err.message || 'Failed to save category';
    errorMsg.style.display = 'block';
    categoryNameInput.style.borderColor = '#FF3B30';
  }
}

function invalidateCache() {
  stocksCache = null;
  categoriesCache = null;
  lastFetchTime = 0;
}

async function getStocksWithCache() {
  const now = Date.now();
  if (!stocksCache || now - lastFetchTime > CACHE_DURATION) {
    try {
      console.log('Cache miss, fetching fresh stocks data...');
      stocksCache = await window.api.getStocksWithLatest();
      console.log('Received stocks data from API:', stocksCache);
      if (!stocksCache || !Array.isArray(stocksCache)) {
        console.error('Invalid stocks data format:', stocksCache);
        throw new Error('Invalid stocks data format');
      }
      if (stocksCache.length === 0) {
        console.log('No stocks data received from API');
      } else {
        console.log('Received', stocksCache.length, 'stocks from API');
        stocksCache.forEach(stock => {
          console.log('Stock:', {
            id: stock.id,
            name: stock.name,
            category: stock.category_name,
            percentage: stock.percentage
          });
        });
      }
      lastFetchTime = now;
    } catch (err) {
      console.error('Failed to fetch stocks:', err);
      throw new Error('Failed to fetch stocks data');
    }
  } else {
    console.log('Using cached stocks data:', stocksCache);
  }
  return stocksCache;
}

// Add a new function to get categories with cache
async function getCategoriesWithCache() {
  const now = Date.now();
  if (!categoriesCache || now - lastFetchTime > CACHE_DURATION) {
    try {
      console.log('Cache miss, fetching fresh categories data...');
      categoriesCache = await window.api.getCategories();
      console.log('Received categories from API:', categoriesCache);
      if (!categoriesCache || !Array.isArray(categoriesCache)) {
        console.error('Invalid categories data format:', categoriesCache);
        throw new Error('Invalid categories data format');
      }
      lastFetchTime = now;
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      throw new Error('Failed to fetch categories data');
    }
  } else {
    console.log('Using cached categories data:', categoriesCache);
  }
  return categoriesCache;
}

function toggleFields(type = 'basic') {
  document.getElementById('basic-fields').style.display = type === 'basic' ? 'block' : 'none';
  document.getElementById('exact-fields').style.display = type === 'exact' ? 'block' : 'none';
}

async function openModal(stock = null) {
  editStockId = stock ? stock.id : null;
  document.getElementById('modal-title').textContent = stock ? 'Edit Item' : 'Add Item';
  const categories = await window.api.getCategories();
  const categorySelect = document.getElementById('stock-category');
  
  // Find Uncategorized category
  const uncategorized = categories.find(c => c.name === 'Uncategorized');
  const otherCategories = categories.filter(c => c.name !== 'Uncategorized');
  
  // Build options with Uncategorized first
  categorySelect.innerHTML = 
    `<option value="${uncategorized ? uncategorized.id : ''}">Uncategorized</option>` +
    otherCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  
  // Create error message element for name input
  const nameInput = document.getElementById('stock-name');
  const nameWrapper = nameInput.parentElement;
  nameWrapper.style.width = '100%';
  nameWrapper.style.boxSizing = 'border-box';
  nameInput.style.width = '100%';
  nameInput.style.boxSizing = 'border-box';
  nameInput.style.padding = '12px 16px';
  nameInput.style.border = '1px solid #E5E5EA';
  nameInput.style.borderRadius = '14px';
  nameInput.style.background = '#f5f5f7';
  nameInput.style.fontSize = '15px';
  nameInput.style.color = '#1d1d1f';
  
  let errorMsg = nameWrapper.querySelector('.error-message');
  if (!errorMsg) {
    errorMsg = document.createElement('div');
    errorMsg.className = 'error-message';
    errorMsg.style.fontSize = '13px';
    errorMsg.style.color = '#FF3B30';
    errorMsg.style.marginTop = '6px';
    nameWrapper.appendChild(errorMsg);
  }
  
  // Add real-time validation
  nameInput.style.transition = 'border-color 0.2s ease';
  nameInput.style.border = '1px solid #E5E5EA';
  nameInput.style.borderRadius = '8px';
  
  // Remove any existing event listener
  const newNameInput = nameInput.cloneNode(true);
  nameInput.parentNode.replaceChild(newNameInput, nameInput);
  
  // Add new event listener for real-time validation
  newNameInput.addEventListener('input', async () => {
    const value = newNameInput.value.trim();
    const submitBtn = document.querySelector('button[type="submit"]');
    
    if (value) {
      const stocks = await getStocksWithCache();
      const duplicate = stocks.find(s => 
        s.name.toLowerCase() === value.toLowerCase() && 
        (!editStockId || s.id !== editStockId)
      );
      
      if (duplicate) {
        newNameInput.style.borderColor = '#FF3B30';
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        errorMsg.textContent = 'Already exists. Choose another name.';
      } else {
        newNameInput.style.borderColor = '#E5E5EA';
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        errorMsg.textContent = '';
      }
    } else {
      newNameInput.style.borderColor = '#E5E5EA';
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.5';
      errorMsg.textContent = '';
    }
  });
  
  if (stock) {
    newNameInput.value = stock.name;
    // Update toggle state
    const toggleContainer = document.querySelector('.toggle-container');
    const toggleOptions = toggleContainer.querySelectorAll('.toggle-option');
    toggleOptions.forEach(opt => {
      if (opt.dataset.value === stock.type) {
        opt.classList.add('active');
      } else {
        opt.classList.remove('active');
      }
    });
    toggleContainer.dataset.active = stock.type;
    toggleFields(stock.type);
    if (stock.type === 'basic') {
      document.getElementById('basic-level').value = stock.percentage;
    } else {
      document.getElementById('exact-current').value = (stock.percentage / 100) * stock.full_value;
      document.getElementById('exact-full').value = stock.full_value;
      document.getElementById('exact-unit').value = stock.unit || '';
    }
    categorySelect.value = stock.category_id;
  } else {
    document.getElementById('stock-name').value = '';
    // Reset toggle to basic
    const toggleContainer = document.querySelector('.toggle-container');
    const toggleOptions = toggleContainer.querySelectorAll('.toggle-option');
    toggleOptions.forEach(opt => {
      if (opt.dataset.value === 'basic') {
        opt.classList.add('active');
      } else {
        opt.classList.remove('active');
      }
    });
    toggleContainer.dataset.active = 'basic';
    document.getElementById('basic-level').value = '100';
    document.getElementById('exact-current').value = '';
    document.getElementById('exact-full').value = '';
    document.getElementById('exact-unit').value = '';
    toggleFields('basic');
  }
  modal.style.display = 'block';
}

async function addNewCategory() {
  console.log('addNewCategory called');
  
  // Check if the category modal exists
  if (!categoryModal) {
    console.error('Category modal not found in the DOM');
    return;
  }

  // Show the category modal
  categoryModal.style.display = 'block';
  
  // Reset the form
  const categoryNameInput = document.getElementById('category-name');
  if (!categoryNameInput) {
    console.error('Category name input not found');
    return;
  }
  
  const submitBtn = categoryForm.querySelector('.submit-btn');
  if (!submitBtn) {
    console.error('Submit button not found');
    return;
  }
  
  const errorMsg = document.getElementById('category-error-msg');
  if (!errorMsg) {
    console.error('Error message element not found');
    return;
  }
  
  // Reset form state
  categoryNameInput.value = '';
  categoryNameInput.style.borderColor = '#E5E5EA';
  errorMsg.textContent = '';
  errorMsg.style.display = 'none';
  submitBtn.disabled = true;
  submitBtn.style.opacity = '0.5';
  submitBtn.style.cursor = 'not-allowed';
  
  // Remove any existing input event listeners by cloning
  const newInput = categoryNameInput.cloneNode(true);
  categoryNameInput.parentNode.replaceChild(newInput, categoryNameInput);
  
  // Add input event listener for validation
  newInput.addEventListener('input', async () => {
    console.log('Category input event triggered');
    const value = newInput.value.trim();
    console.log('Input value:', value);
    
    if (value) {
      // Convert to sentence case
      const sentenceCaseValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      newInput.value = sentenceCaseValue;
      
      try {
        // Get fresh categories data
        const categories = await window.api.debug.inspectCategories();
        const duplicate = categories.find(c => 
          c.name.toLowerCase() === sentenceCaseValue.toLowerCase()
        );
        
        if (duplicate) {
          console.log('Duplicate found - disabling button');
          newInput.style.borderColor = '#FF3B30';
          submitBtn.disabled = true;
          submitBtn.style.opacity = '0.5';
          submitBtn.style.cursor = 'not-allowed';
          errorMsg.textContent = 'Already exists. Choose another name.';
          errorMsg.style.display = 'block';
        } else {
          console.log('No duplicate - enabling button');
          newInput.style.borderColor = '#E5E5EA';
          submitBtn.disabled = false;
          submitBtn.style.opacity = '1';
          submitBtn.style.cursor = 'pointer';
          errorMsg.textContent = '';
          errorMsg.style.display = 'none';
        }
      } catch (err) {
        console.error('Failed to check for duplicate categories:', err);
      }
    } else {
      console.log('Empty input - disabling button');
      newInput.style.borderColor = '#E5E5EA';
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.5';
      submitBtn.style.cursor = 'not-allowed';
      errorMsg.textContent = '';
      errorMsg.style.display = 'none';
    }
  });
  
  // Focus the input field
  newInput.focus();
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const errorMsg = document.getElementById('error-msg');
  errorMsg.textContent = '';
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  try {
    const name = document.getElementById('stock-name').value.trim();
    let category_id = document.getElementById('stock-category').value;
    const type = document.querySelector('.toggle-container').dataset.active;
    let percentage, full_value = null, unit = null;

    console.log('Form data:', { name, category_id, type });

    if (!name) {
      throw new Error('Name is required');
    }

    // If no category is selected, get the Uncategorized category ID
    if (!category_id) {
      const categories = await window.api.getCategories();
      const uncategorized = categories.find(c => c.name === 'Uncategorized');
      if (!uncategorized) {
        throw new Error('Uncategorized category not found');
      }
      category_id = uncategorized.id;
    }

    // Check for duplicate stock
    const existingStocks = await getStocksWithCache();
    const duplicate = existingStocks.find(s => 
      s.name.toLowerCase() === name.toLowerCase() && 
      (!editStockId || s.id !== editStockId)
    );

    if (duplicate) {
      const editExisting = confirm(
        `An item named "${duplicate.name}" already exists. Would you like to edit it instead?`
      );
      if (editExisting) {
        // Close current modal and open edit modal for existing item
        modal.style.display = 'none';
        // Get the full stock data including category name and other details
        const stocks = await getStocksWithCache();
        const stockToEdit = stocks.find(s => s.id === duplicate.id);
        if (stockToEdit) {
          openModal(stockToEdit);
        } else {
          throw new Error('Failed to load existing item data');
        }
        return;
      } else {
        throw new Error('Please use a different name for your item');
      }
    }

    if (type === 'basic') {
      const level = document.getElementById('basic-level').value;
      console.log('Basic level selected:', level);
      switch(level) {
        case 'full':
          percentage = 100;
          break;
        case 'half':
          percentage = 50;
          break;
        case 'refill':
          percentage = 10;
          break;
        default:
          throw new Error('Invalid stock level');
      }
    } else {
      const current = parseFloat(document.getElementById('exact-current').value);
      full_value = parseFloat(document.getElementById('exact-full').value);
      unit = document.getElementById('exact-unit').value.trim();
      console.log('Exact measurements:', { current, full_value, unit });
      
      if (isNaN(current) || isNaN(full_value) || full_value <= 0) {
        throw new Error('Current amount and full value must be valid numbers greater than 0');
      }
      if (current > full_value) {
        throw new Error('Current amount cannot be greater than full value');
      }
      percentage = (current / full_value) * 100;
    }

    const stock = { name, category_id, type, full_value, unit, percentage };
    console.log('Saving stock:', stock);

    try {
      let result;
      if (editStockId) {
        console.log('Updating existing stock:', editStockId);
        stock.id = editStockId;
        result = await window.api.updateStock(stock);
      } else {
        console.log('Adding new stock');
        result = await window.api.addStock(stock);
      }
      console.log('Save operation result:', result);
      
      // Show success state
      submitBtn.classList.add('success');
      
      // Invalidate cache immediately
      console.log('Invalidating cache');
      invalidateCache();
      
      // Get current active tab
      const currentTab = document.querySelector('.tab.active').getAttribute('data-tab');
      console.log('Current tab:', currentTab);
      
      // Reload data
      console.log('Reloading data for current tab');
      if (currentTab === 'home') {
        await loadHome();
      } else if (currentTab === 'settings') {
        await loadSettings();
      }
      
      // Close modal after successful save
      setTimeout(() => {
        submitBtn.classList.remove('success');
        modal.style.display = 'none';
      }, 1000);
      
    } catch (err) {
      console.error('Database operation failed:', err);
      throw new Error('Failed to save to database. Please try again.');
    }
    
  } catch (err) {
    console.error('Form submission failed:', err);
    errorMsg.textContent = err.message || 'Failed to save stock';
  }
}

async function loadHome() {
  const homeTab = document.getElementById('home');
  try {
    console.log('Starting loadHome');
    homeTab.innerHTML = '<div class="loading">Loading...</div>';
    
    // Force a fresh load by invalidating cache
    console.log('Invalidating cache before loading home');
    invalidateCache();
    
    // Fetch stocks data
    console.log('Fetching stocks data');
    const stocks = await getStocksWithCache();
    console.log('Received stocks in loadHome:', stocks);
    
    if (!stocks || !Array.isArray(stocks)) {
      console.error('Invalid stocks data in loadHome:', stocks);
      throw new Error('Failed to load stocks data');
    }
    
    if (stocks.length === 0) {
      console.log('No stocks found in loadHome');
      homeTab.innerHTML = '<div class="empty-state">No items yet. Click the + button to add some!</div>';
      return;
    }

    // Clear home content
    homeTab.textContent = '';

    // Categorize stocks by refill level
    const needsRefill = stocks.filter(item => item.percentage < 50).sort((a, b) => a.percentage - b.percentage);
    const gettingLow = stocks.filter(item => item.percentage >= 50 && item.percentage < 90).sort((a, b) => a.percentage - b.percentage);
    const wellStocked = stocks.filter(item => item.percentage >= 90).sort((a, b) => a.percentage - b.percentage);

    // Create categories
    const categories = [
      { title: 'Needs Refill', items: needsRefill, defaultOpen: true },
      { title: 'Getting Low', items: gettingLow, defaultOpen: true },
      { title: 'Well Stocked', items: wellStocked, defaultOpen: false }
    ];

    // Create and append each category section
    categories.forEach((category, index) => {
      if (category.items.length === 0) return; // Skip empty categories

      const section = document.createElement('div');
      section.className = 'stock-category-section';

      const header = document.createElement('div');
      header.className = 'category-header';
      
      const title = document.createElement('h2');
      title.innerHTML = `<span class="collapse-indicator">${category.defaultOpen ? '▼' : '▶'}</span> ${category.title} (${category.items.length})`;
      header.appendChild(title);

      const grid = document.createElement('div');
      grid.className = 'bento-grid';
      if (!category.defaultOpen) {
        grid.classList.add('collapsed');
      }

      // Add click handler for collapse/expand
      header.addEventListener('click', () => {
        const isCollapsed = grid.classList.contains('collapsed');
        
        // Collapse all other sections
        document.querySelectorAll('.stock-category-section').forEach(otherSection => {
          if (otherSection !== section) {
            otherSection.querySelector('.bento-grid').classList.add('collapsed');
            otherSection.querySelector('.collapse-indicator').textContent = '▶';
          }
        });
        
        // Toggle this section
        grid.classList.toggle('collapsed', !isCollapsed);
        header.querySelector('.collapse-indicator').textContent = isCollapsed ? '▼' : '▶';
      });

      category.items.forEach(item => {
        console.log('Creating bento item:', item);
        const card = document.createElement('div');
        card.className = 'bento-item';
        
        // Add level class to the item itself
        if (item.percentage >= 90) {
          card.classList.add('full');
        } else if (item.percentage >= 50) {
          card.classList.add('half');
        } else {
          card.classList.add('refill');
        }
        
        const title = document.createElement('h3');
        title.textContent = item.name;
        
        const categoryLabel = document.createElement('span');
        categoryLabel.className = 'category-label';
        categoryLabel.textContent = item.category_name || 'Uncategorized';
        
        const gauge = document.createElement('div');
        gauge.className = 'liquid-gauge';
        
        const fill = document.createElement('div');
        fill.className = 'liquid-fill';
        fill.style.width = `${item.percentage}%`;
        
        // Set color based on level
        if (item.percentage >= 90) {
          fill.classList.add('full');
        } else if (item.percentage >= 50) {
          fill.classList.add('half');
        } else {
          fill.classList.add('refill');
        }
        
        gauge.appendChild(fill);
        card.appendChild(title);
        card.appendChild(categoryLabel);
        card.appendChild(gauge);
        
        // Add click handler to edit
        card.onclick = () => editStock(item.id);
        
        grid.appendChild(card);
      });

      section.appendChild(header);
      section.appendChild(grid);
      homeTab.appendChild(section);
    });
    
    console.log('Home tab rendering complete');
    
  } catch (err) {
    console.error('Failed to load home:', err);
    homeTab.innerHTML = '<div class="error">Failed to load data. Please try again.</div>';
  }
}

let chart;
document.querySelectorAll('.time-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelector('.time-toggle.active')?.classList.remove('active');
    btn.classList.add('active');
    if (chart) {
      chart.options.scales.x.time.unit = btn.dataset.unit;
      chart.update();
    }
  });
});

async function loadAnalytics() {
  try {
    const history = await window.api.getHistory();
    
    if (chart) {
      chart.destroy();
    }

    // Group data by stock name and ensure timestamps are properly formatted
    const stocksData = {};
    history.forEach(h => {
      if (!h.stock_name || !h.timestamp) {
        console.warn('Invalid history entry:', h);
        return;
      }
      
      if (!stocksData[h.stock_name]) {
        stocksData[h.stock_name] = [];
      }
      
      // Ensure timestamp is properly formatted
      const timestamp = moment(h.timestamp).toDate();
      if (!isNaN(timestamp)) {
        stocksData[h.stock_name].push({
          x: timestamp,
          y: parseFloat(h.percentage) || 0
        });
      }
    });

    // Create datasets with different colors
    const colors = ['#007AFF', '#34C759', '#FF9500', '#FF2D55', '#5856D6', '#FF3B30'];
    const datasets = Object.entries(stocksData).map(([name, data], index) => ({
      label: name,
      data: data.sort((a, b) => a.x - b.x),
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length] + '20',
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 5
    }));

    const ctx = document.getElementById('analytics-chart').getContext('2d');
    chart = new Chart(ctx, {
      type: 'line',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          title: {
            display: true,
            text: 'Item Level History',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15
            }
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            titleColor: '#1d1d1f',
            bodyColor: '#1d1d1f',
            borderColor: '#e5e5e7',
            borderWidth: 1,
            padding: 10,
            displayColors: true,
            callbacks: {
              title: (context) => {
                return moment(context[0].raw.x).format('MMM D, YYYY');
              },
              label: (context) => {
                return `${context.dataset.label}: ${Math.round(context.raw.y)}%`;
              }
            }
          },
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day',
              displayFormats: {
                day: 'MMM D',
                week: 'MMM D',
                month: 'MMM YYYY'
              },
              tooltipFormat: 'MMM D, YYYY'
            },
            title: {
              display: true,
              text: 'Date'
            },
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Stock Level (%)'
            },
            grid: {
              color: '#e5e5e7'
            }
          }
        }
      }
    });

    // Remove any existing active classes
    document.querySelectorAll('.time-toggle').forEach(btn => btn.classList.remove('active'));
    // Set initial active time unit
    document.querySelector('.time-toggle[data-unit="day"]').classList.add('active');

    // Update time unit when buttons are clicked
    document.querySelectorAll('.time-toggle').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.time-toggle').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (chart) {
          chart.options.scales.x.time.unit = btn.dataset.unit;
          chart.update();
        }
      };
    });

  } catch (err) {
    console.error('Failed to load analytics:', err);
    document.getElementById('analytics').innerHTML = 
      '<div class="error">Failed to load analytics data. Please try again.</div>';
  }
}

async function loadSettings() {
  const settings = document.getElementById('settings');
  try {
    console.log('Loading settings tab...');
    if (!settings) {
      console.error('Settings element not found');
      return;
    }
    settings.innerHTML = '<div class="loading">Loading...</div>';

    // Always get fresh data from the database
    console.log('Fetching fresh data for settings page...');
    
    console.log('Fetching stocks...');
    const stocks = await window.api.getStocksWithLatest();
    console.log('Fetched stocks:', stocks);
    
    console.log('Fetching categories directly from database...');
    // Get fresh categories data directly from the API (no cache)
    const categories = await window.api.debug.inspectCategories();
    console.log('Fetched categories directly from database:', categories);
    
    console.log('Loaded fresh data for settings:', { stocks, categories });
    
    // Clear the loading message
    settings.textContent = '';

    // Create container for settings sections
    const settingsContainer = document.createElement('div');
    settingsContainer.className = 'settings-container';
    settings.appendChild(settingsContainer);

    // Function to create a section
    const createSection = (title, content, addButton = null) => {
      const section = document.createElement('div');
      section.className = 'settings-section';
      
      const header = document.createElement('div');
      header.className = 'settings-header';
      
      const titleElement = document.createElement('h2');
      titleElement.innerHTML = `<span class="collapse-indicator">▶</span> ${title}`;
      
      header.appendChild(titleElement);
      if (addButton) {
        header.appendChild(addButton);
      }
      
      const list = document.createElement('div');
      list.className = 'settings-list collapsed';
      
      // Add click handler for collapsible functionality
      header.addEventListener('click', (e) => {
        // Don't collapse if clicking the add button
        if (e.target.tagName === 'BUTTON') return;
        
        const indicator = header.querySelector('.collapse-indicator');
        const isCollapsed = list.classList.contains('collapsed');
        
        // First collapse all sections
        document.querySelectorAll('.settings-section').forEach(otherSection => {
          if (otherSection !== section) {
            const otherList = otherSection.querySelector('.settings-list');
            const otherIndicator = otherSection.querySelector('.collapse-indicator');
            otherList.classList.add('collapsed');
            otherIndicator.textContent = '▶';
          }
        });
        
        // Then toggle this section
        list.classList.toggle('collapsed', !isCollapsed);
        indicator.textContent = isCollapsed ? '▼' : '▶';
      });
      
      section.appendChild(header);
      section.appendChild(list);
      list.appendChild(content);
      return section;
    };
    
    // Categories section
    const addCategoryBtn = document.createElement('button');
    addCategoryBtn.innerHTML = '+ New Category';
    addCategoryBtn.style.background = '#007AFF';
    addCategoryBtn.style.color = 'white';
    addCategoryBtn.style.border = 'none';
    addCategoryBtn.style.padding = '12px 24px';
    addCategoryBtn.style.borderRadius = '12px';
    addCategoryBtn.style.cursor = 'pointer';
    addCategoryBtn.style.fontWeight = '500';
    addCategoryBtn.style.fontSize = '15px';
    addCategoryBtn.onclick = () => {
      console.log('Add category button clicked');
      addNewCategory();
    };

    const categoryList = document.createElement('div');
    categoryList.className = 'settings-list-content';
    
    console.log('All categories from database:', categories);
    const regularCategories = categories.filter(c => c.name !== 'Uncategorized');
    console.log('Regular categories to display:', regularCategories);
    
    if (!regularCategories || regularCategories.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.textContent = 'No categories yet. Add your first category!';
      categoryList.appendChild(emptyState);
    } else {
      regularCategories.forEach(c => {
        console.log('Creating category item:', c);
        const item = document.createElement('div');
        item.className = 'settings-item';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'category-name';
        
        // Count items in this category
        const categoryItems = stocks.filter(s => s.category_id === c.id);
        nameSpan.innerHTML = `${c.name} <span class="item-count">${categoryItems.length} item${categoryItems.length !== 1 ? 's' : ''}</span>`;
        
        const controls = document.createElement('div');
        controls.className = 'item-controls';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'delete-btn';
        deleteBtn.onclick = async (e) => {
          e.stopPropagation();
          try {
            // Add confirmation dialog
            const confirmDelete = confirm(`Are you sure you want to delete the category "${c.name}"?`);
            if (!confirmDelete) {
              console.log('Category deletion cancelled by user');
              return;
            }
            
            await window.api.deleteCategory(c.id);
            // Force cache invalidation
            invalidateCache();
            await loadSettings();
          } catch (err) {
            console.error('Failed to delete category:', err);
            alert(err.message || 'Failed to delete category');
          }
        };
        
        controls.appendChild(deleteBtn);
        item.appendChild(nameSpan);
        item.appendChild(controls);
        categoryList.appendChild(item);
      });
    }
    
    const categoriesSection = createSection('Categories', categoryList, addCategoryBtn);
    settingsContainer.appendChild(categoriesSection);
    
    // Expand the Categories section by default
    const categoryList2 = categoriesSection.querySelector('.settings-list');
    const indicator = categoriesSection.querySelector('.collapse-indicator');
    categoryList2.classList.remove('collapsed');
    indicator.textContent = '▼';

    // Items section
    const addItemBtn = document.createElement('button');
    addItemBtn.innerHTML = '+ Add Item';
    addItemBtn.style.background = '#007AFF';
    addItemBtn.style.color = 'white';
    addItemBtn.style.border = 'none';
    addItemBtn.style.padding = '12px 24px';
    addItemBtn.style.borderRadius = '12px';
    addItemBtn.style.cursor = 'pointer';
    addItemBtn.style.fontWeight = '500';
    addItemBtn.style.fontSize = '15px';
    addItemBtn.onclick = () => {
      console.log('Add item button clicked');
      openModal();
    };

    // Function to create stock gauge
    const createStockGauge = (percentage) => {
      const gauge = document.createElement('div');
      gauge.className = 'stock-gauge';
      
      const fill = document.createElement('div');
      fill.className = 'stock-gauge-fill';
      fill.style.width = `${percentage}%`;
      
      if (percentage >= 90) {
        fill.classList.add('full');
      } else if (percentage >= 50) {
        fill.classList.add('half');
      } else {
        fill.classList.add('refill');
      }
      
      gauge.appendChild(fill);
      return gauge;
    };

    // Sort function for stocks by percentage
    const sortByPercentage = (a, b) => a.percentage - b.percentage;

    // Update the items list creation
    const itemsList = document.createElement('div');
    itemsList.className = 'settings-list-content';
    
    const categorizedStocks = stocks.filter(s => s.category_name !== 'Uncategorized');
    
    if (!categorizedStocks || categorizedStocks.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.textContent = 'No items yet. Click the + button to add some!';
      itemsList.appendChild(emptyState);
    } else {
      // Sort stocks by percentage
      categorizedStocks.sort(sortByPercentage).forEach(s => {
        const item = document.createElement('div');
        item.className = 'settings-item';
        
        // Add level class to the item itself
        if (s.percentage >= 90) {
          item.classList.add('full');
        } else if (s.percentage >= 50) {
          item.classList.add('half');
        } else {
          item.classList.add('refill');
        }
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'item-info';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'item-name';
        nameSpan.textContent = s.name;
        
        const detailsSpan = document.createElement('span');
        detailsSpan.className = 'item-details';
        detailsSpan.textContent = s.category_name;
        
        infoDiv.appendChild(nameSpan);
        infoDiv.appendChild(detailsSpan);
        
        const controls = document.createElement('div');
        controls.className = 'item-controls';
        
        const editBtn = document.createElement('button');
        editBtn.textContent = '>';
        editBtn.className = 'edit-btn';
        editBtn.onclick = (e) => {
          e.stopPropagation();
          editStock(s.id);
        };
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'delete-btn';
        deleteBtn.onclick = async (e) => {
          e.stopPropagation();
          await deleteStock(s.id);
        };
        
        controls.appendChild(editBtn);
        controls.appendChild(deleteBtn);
        
        item.appendChild(infoDiv);
        item.appendChild(controls);
        item.onclick = () => editStock(s.id);
        
        itemsList.appendChild(item);
      });
    }
    
    settingsContainer.appendChild(createSection('Items', itemsList, addItemBtn));

    // Uncategorized section (moved to the end)
    const uncategorizedCategory = categories.find(c => c.name === 'Uncategorized');
    if (uncategorizedCategory) {
      const uncategorizedList = document.createElement('div');
      uncategorizedList.className = 'settings-list-content';
      
      const uncategorizedItems = stocks.filter(s => s.category_id === uncategorizedCategory.id);
      
      if (uncategorizedItems.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.textContent = 'No uncategorized items.';
        uncategorizedList.appendChild(emptyState);
      } else {
        // Sort uncategorized items by percentage
        uncategorizedItems.sort(sortByPercentage).forEach(s => {
          const item = document.createElement('div');
          item.className = 'settings-item';
          
          // Add level class to the item itself
          if (s.percentage >= 90) {
            item.classList.add('full');
          } else if (s.percentage >= 50) {
            item.classList.add('half');
          } else {
            item.classList.add('refill');
          }
          
          const infoDiv = document.createElement('div');
          infoDiv.className = 'item-info';
          
          const nameSpan = document.createElement('span');
          nameSpan.className = 'item-name';
          nameSpan.textContent = s.name;
          
          const detailsSpan = document.createElement('span');
          detailsSpan.className = 'item-details';
          detailsSpan.textContent = s.category_name || 'Uncategorized';
          
          infoDiv.appendChild(nameSpan);
          infoDiv.appendChild(detailsSpan);
          
          const controls = document.createElement('div');
          controls.className = 'item-controls';
          
          const editBtn = document.createElement('button');
          editBtn.textContent = '>';
          editBtn.className = 'edit-btn';
          editBtn.onclick = (e) => {
            e.stopPropagation();
            editStock(s.id);
          };
          
          controls.appendChild(editBtn);
          
          item.appendChild(infoDiv);
          item.appendChild(controls);
          item.onclick = () => editStock(s.id);
          
          uncategorizedList.appendChild(item);
        });
      }
      
      settingsContainer.appendChild(createSection('Uncategorized Items', uncategorizedList));
    }
    
    // Expand the first section by default
    const firstSection = settingsContainer.querySelector('.settings-section');
    if (firstSection) {
      const list = firstSection.querySelector('.settings-list');
      const indicator = firstSection.querySelector('.collapse-indicator');
      list.classList.add('collapsed');
      indicator.textContent = '▶';
    }
    
    console.log('Settings tab rendering complete');
    
    settings.appendChild(settingsContainer);
  } catch (err) {
    console.error('Failed to load settings:', err);
    settings.innerHTML = '<div class="error">Failed to load settings. Please try again.</div>';
  }
}

window.editStock = async (id) => {
  const stocks = await window.api.getStocksWithLatest();
  const stock = stocks.find(s => s.id === id);
  openModal(stock);
};

window.deleteStock = async (id) => {
  if (confirm('Delete this stock?')) {
    try {
      await window.api.deleteStock(id);
      invalidateCache();
      const currentTab = document.querySelector('.tab.active').getAttribute('data-tab');
      await Promise.all([
        currentTab === 'home' ? loadHome() : Promise.resolve(),
        currentTab === 'settings' ? loadSettings() : Promise.resolve()
      ]);
    } catch (err) {
      console.error('Failed to delete stock:', err);
      alert('Failed to delete stock. Please try again.');
    }
  }
}

window.deleteCategory = async (id) => {
  try {
    // Get category name and check if it has items
    const categories = await window.api.getCategories();
    const category = categories.find(c => c.id === id);
    const stocks = await getStocksWithCache();
    const categoryStocks = stocks.filter(s => s.category_id === id);
    
    if (categoryStocks.length > 0) {
      const confirmDelete = confirm(
        `This category contains ${categoryStocks.length} item(s). ` +
        `If you delete this category, all items will be moved to "Uncategorized". ` +
        `\n\nDo you want to proceed anyway?`
      );
      if (!confirmDelete) return;
    } else {
      const confirmDelete = confirm(`Delete category "${category.name}"?`);
      if (!confirmDelete) return;
    }

    await window.api.deleteCategory(id);
    invalidateCache();
    
    const currentTab = document.querySelector('.tab.active').getAttribute('data-tab');
    await Promise.all([
      currentTab === 'home' ? loadHome() : Promise.resolve(),
      currentTab === 'settings' ? loadSettings() : Promise.resolve()
    ]);
  } catch (err) {
    console.error('Failed to delete category:', err);
    if (err.message === 'Cannot delete the Uncategorized category') {
      alert('The Uncategorized category cannot be deleted.');
    } else {
      alert(err.message || 'Failed to delete category. Please try again.');
    }
  };
}

// Tab switching functionality
function initializeTabs() {
  console.log('Initializing tabs...');
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      console.log('Tab clicked:', tab.getAttribute('data-tab'));
      // Remove active class from all tabs and content
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding content
      tab.classList.add('active');
      const contentId = tab.getAttribute('data-tab');
      const contentElement = document.getElementById(contentId);
      if (contentElement) {
        contentElement.classList.add('active');
        
        // Load content based on tab
        if (contentId === 'home') loadHome();
        else if (contentId === 'analytics') loadAnalytics();
        else if (contentId === 'settings') loadSettings();
      }
    });
  });
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);

async function loadCategories() {
  try {
    const categories = await window.api.getCategories();
    return categories;
  } catch (error) {
    console.error('Error loading categories:', error);
    return [];
  }
}

async function updateCategoryList() {
  try {
    const categories = await window.api.getCategories();
    const categoryList = document.getElementById('category-list');
    if (!categoryList) return;
    
    categoryList.innerHTML = '';
    categories.forEach(category => {
      const li = document.createElement('li');
      li.textContent = category.name;
      categoryList.appendChild(li);
    });
  } catch (error) {
    console.error('Error updating category list:', error);
  }
}