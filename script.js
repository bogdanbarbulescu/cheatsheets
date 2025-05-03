// DOM Elements
const cheatsheetGrid = document.getElementById('cheatsheets-grid');
const addCheatsheetBtn = document.getElementById('add-cheatsheet-btn');
const cheatsheetModal = document.getElementById('cheatsheet-modal');
const viewModal = document.getElementById('view-modal');
const modalTitle = document.getElementById('modal-title');
const cheatsheetForm = document.getElementById('cheatsheet-form');
const cancelBtn = document.getElementById('cancel-btn');
const searchInput = document.getElementById('search-input');
const allTagsContainer = document.getElementById('all-tags');
const categoriesList = document.getElementById('categories-list');
const viewBtns = document.querySelectorAll('.view-btn');
const toastElement = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const toastIcon = document.getElementById('toast-icon');
const noResults = document.getElementById('no-results');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const themeToggleIcon = document.getElementById('theme-toggle-icon');
const prismDarkThemeLink = document.getElementById('prism-dark-theme');
const prismLightThemeLink = document.getElementById('prism-light-theme');

// State
let cheatsheets = [];
let currentFilter = {
    search: '',
    category: 'all',
    tag: ''
};
let currentView = 'grid';
let editingId = null;
let currentTheme = 'dark'; // Default theme
const themeKey = 'cheatsheets-theme'; // localStorage key
const cheatsheetsKey = 'cheatsheets'; // localStorage key

// --- Theme Functions ---

// Apply the selected theme (light or dark)
function applyTheme(theme) {
    if (theme === 'light') {
        document.body.classList.add('light-theme');
        themeToggleIcon.classList.remove('fa-moon');
        themeToggleIcon.classList.add('fa-sun');
        prismDarkThemeLink.disabled = true;
        prismLightThemeLink.disabled = false;
        currentTheme = 'light';
        themeToggleBtn.setAttribute('aria-label', 'Switch to Dark Theme');
        themeToggleBtn.dataset.tooltip = 'Switch to Dark Theme'; // Update tooltip
    } else { // Default to dark
        document.body.classList.remove('light-theme');
        themeToggleIcon.classList.remove('fa-sun');
        themeToggleIcon.classList.add('fa-moon');
        prismDarkThemeLink.disabled = false;
        prismLightThemeLink.disabled = true;
        currentTheme = 'dark';
        themeToggleBtn.setAttribute('aria-label', 'Switch to Light Theme');
        themeToggleBtn.dataset.tooltip = 'Switch to Light Theme'; // Update tooltip
    }

    // Re-highlight code in the view modal if it's currently open
    const viewContent = document.getElementById('view-content');
    if (viewContent && viewModal.classList.contains('open')) {
        // Small delay to ensure CSS applies before re-highlighting
        setTimeout(() => {
             Prism.highlightAllUnder(viewContent);
        }, 50);
    }
}

// Toggle between light and dark themes
function toggleTheme() {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem(themeKey, newTheme); // Save preference
}

// Load saved theme preference from localStorage
function loadTheme() {
    const savedTheme = localStorage.getItem(themeKey);
    // Apply saved theme or default (dark)
    applyTheme(savedTheme || 'dark');
}

// --- Core App Functions ---

// Initialize the application
function init() {
    loadTheme(); // Load theme preference first
    loadCheatsheets();
    setupEventListeners();
    renderCheatsheets(); // Render initial state
    renderAllTags();
}

// Load cheatsheets from localStorage
function loadCheatsheets() {
    const storedCheatsheets = localStorage.getItem(cheatsheetsKey);
    try {
        if (storedCheatsheets) {
            cheatsheets = JSON.parse(storedCheatsheets);
            // Basic validation if needed: ensure it's an array
            if (!Array.isArray(cheatsheets)) {
                console.warn("Stored cheatsheets data is not an array. Resetting.");
                cheatsheets = [];
                localStorage.removeItem(cheatsheetsKey); // Clear invalid data
            }
        } else {
            // Provide demo data for first-time users
            cheatsheets = getDemoData();
            saveCheatsheets(); // Save demo data
        }
    } catch (e) {
        console.error("Error loading or parsing cheatsheets from localStorage:", e);
        cheatsheets = getDemoData(); // Fallback to demo data on error
        saveCheatsheets();
    }
}

// Save cheatsheets to localStorage
function saveCheatsheets() {
    try {
        localStorage.setItem(cheatsheetsKey, JSON.stringify(cheatsheets));
    } catch (e) {
        console.error("Error saving cheatsheets to localStorage:", e);
        showToast("Could not save changes. Storage might be full.", "error");
    }
}

// Filter and render cheatsheets
function renderCheatsheets() {
    const searchLower = currentFilter.search.toLowerCase();
    const categoryFilter = currentFilter.category;
    const tagFilter = currentFilter.tag; // Already lowercase from renderAllTags interaction

    const filteredCheatsheets = cheatsheets.filter(sheet => {
        const titleMatch = sheet.title.toLowerCase().includes(searchLower);
        const contentMatch = sheet.content.toLowerCase().includes(searchLower);
        const tagsMatch = sheet.tags.some(tag => tag.toLowerCase().includes(searchLower));
        const searchMatch = titleMatch || contentMatch || tagsMatch;

        const categoryMatch = categoryFilter === 'all' || sheet.category.toLowerCase() === categoryFilter;

        // Tags are stored potentially mixed-case, filter lowercase against lowercase
        const tagMatch = tagFilter === '' || sheet.tags.some(tag => tag.toLowerCase() === tagFilter);

        return searchMatch && categoryMatch && tagMatch;
    });

    // Update UI based on filtered results
    updateNoResultsMessage(filteredCheatsheets.length);

    if (filteredCheatsheets.length > 0) {
        if (currentView === 'grid') {
            renderGridView(filteredCheatsheets);
        } else {
            renderListView(filteredCheatsheets);
        }
    } else {
        cheatsheetGrid.innerHTML = ''; // Clear grid if no results
    }
}

// Update the "No Results" message visibility and content
function updateNoResultsMessage(count) {
    if (count === 0) {
        if (currentFilter.search === '' && currentFilter.category === 'all' && currentFilter.tag === '') {
            noResults.innerHTML = `
                <i class="fas fa-book-open"></i>
                <p>Your cheat sheet library is empty. Click 'New Sheet' to add one!</p>
            `;
        } else {
            noResults.innerHTML = `
                <i class="fas fa-search"></i>
                <p>No cheat sheets found. Try adjusting your search or filters.</p>
            `;
        }
        noResults.classList.remove('hidden');
    } else {
        noResults.classList.add('hidden');
    }
}

// Render cheatsheets in grid view
function renderGridView(sheets) {
    cheatsheetGrid.className = 'cheatsheets-grid';
    cheatsheetGrid.innerHTML = ''; // Clear previous items

    const fragment = document.createDocumentFragment(); // Use fragment for performance
    sheets.forEach(sheet => {
        const card = createCheatsheetCard(sheet);
        fragment.appendChild(card);
    });
    cheatsheetGrid.appendChild(fragment);
}

// Render cheatsheets in list view
function renderListView(sheets) {
    cheatsheetGrid.className = 'cheatsheets-list';
    cheatsheetGrid.innerHTML = ''; // Clear previous items

    const fragment = document.createDocumentFragment();
    sheets.forEach(sheet => {
        const listItem = createCheatsheetListItem(sheet);
        fragment.appendChild(listItem);
    });
    cheatsheetGrid.appendChild(fragment);
}

// Create HTML for a single cheatsheet card (Grid View)
function createCheatsheetCard(sheet) {
    const plainTextContent = sheet.content
        .replace(/```[\s\S]*?```/g, '[Code Block]')
        .replace(/#+\s*/g, '')
        .replace(/[*_`~]/g, '')
        .replace(/\[.*?\]\(.*?\)/g, '[Link]') // Remove markdown links
        .replace(/\n+/g, ' ')
        .trim();
    const preview = plainTextContent.substring(0, 100) + (plainTextContent.length > 100 ? '...' : '');

    const card = document.createElement('div');
    card.className = 'cheatsheet-card';
    card.setAttribute('data-id', sheet.id);
    card.setAttribute('role', 'button'); // Make it behave like a button
    card.setAttribute('tabindex', '0'); // Make it focusable
    card.setAttribute('aria-label', `View ${sheet.title}`);

    card.innerHTML = `
        <div class="card-header">
            <h3 class="card-title">${sheet.title}</h3>
            <div class="card-category">
                <i class="fas ${getCategoryIcon(sheet.category)}"></i>
                ${capitalize(sheet.category)}
            </div>
        </div>
        <div class="card-content">
            ${preview || 'No preview available.'}
        </div>
        <div class="card-footer">
            <div class="card-tags">
                ${sheet.tags.slice(0, 3).map(tag => `<span class="card-tag">${tag}</span>`).join('')}
                ${sheet.tags.length > 3 ? `<span class="card-tag">+${sheet.tags.length - 3}</span>` : ''}
            </div>
            <div class="card-actions">
                <button class="card-action-btn edit-btn" data-id="${sheet.id}" aria-label="Edit ${sheet.title}" data-tooltip="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="card-action-btn delete-btn" data-id="${sheet.id}" aria-label="Delete ${sheet.title}" data-tooltip="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    return card;
}

// Create HTML for a single cheatsheet list item (List View)
function createCheatsheetListItem(sheet) {
    const listItem = document.createElement('div');
    listItem.className = 'list-item';
    listItem.setAttribute('data-id', sheet.id);
    listItem.setAttribute('role', 'button');
    listItem.setAttribute('tabindex', '0');
    listItem.setAttribute('aria-label', `View ${sheet.title}`);


    listItem.innerHTML = `
        <div class="list-item-details">
            <div class="list-item-icon">
                <i class="fas ${getCategoryIcon(sheet.category)}"></i>
            </div>
            <div class="list-item-info">
                <h3>${sheet.title}</h3>
                <div class="list-item-meta">
                    ${capitalize(sheet.category)} • ${sheet.tags.length} tag${sheet.tags.length !== 1 ? 's' : ''}
                </div>
            </div>
        </div>
        <div class="card-actions list-item-actions">
            <button class="card-action-btn edit-btn" data-id="${sheet.id}" aria-label="Edit ${sheet.title}" data-tooltip="Edit">
                <i class="fas fa-edit"></i>
            </button>
            <button class="card-action-btn delete-btn" data-id="${sheet.id}" aria-label="Delete ${sheet.title}" data-tooltip="Delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    return listItem;
}

// Get icon for category
function getCategoryIcon(category = '') {
    const icons = {
        javascript: 'fa-js-square',
        python: 'fa-python',
        css: 'fa-css3-alt',
        html: 'fa-html5',
        git: 'fa-git-alt',
        other: 'fa-file-code' // Icon for 'Other' category
    };
    return icons[category.toLowerCase()] || 'fa-question-circle'; // Fallback icon
}

// Capitalize first letter
function capitalize(str = '') {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Open view modal
function openViewModal(id) {
    const sheet = cheatsheets.find(s => s.id === id);
    if (!sheet) return;

    document.getElementById('view-title').textContent = sheet.title;
    document.getElementById('view-category').innerHTML = `
        <i class="fas ${getCategoryIcon(sheet.category)}"></i>
        <span>${capitalize(sheet.category)}</span>
    `;

    const tagsContainer = document.getElementById('view-tags');
    tagsContainer.innerHTML = sheet.tags.map(tag => `<span class="tag">${tag}</span>`).join('');

    const viewContent = document.getElementById('view-content');

    // Configure marked.js
    marked.setOptions({
        gfm: true,          // Use GitHub Flavored Markdown
        breaks: true,       // Convert single line breaks to <br>
        pedantic: false,    // Don't be strict about syntax
        smartLists: true,   // Use smarter list behavior
        smartypants: false, // Don't convert quotes, dashes, etc.
        // Add a syntax highlighter hook for Prism
        highlight: function(code, lang) {
            const language = Prism.languages[lang] || Prism.languages.clike; // Fallback language
             if (language) {
                return Prism.highlight(code, language, lang);
             } else {
                 // If language not supported, return plain code
                 return code;
             }
        }
    });
    const htmlContent = marked.parse(sheet.content || ''); // Ensure content is not null/undefined
    viewContent.innerHTML = htmlContent;

    // Add copy buttons AFTER marked has processed and created <pre><code>
    viewContent.querySelectorAll('pre').forEach(pre => {
        const codeElement = pre.querySelector('code');
        if (!codeElement) return; // Skip if no code element found

        // Avoid adding multiple buttons if modal reopens without full refresh
        if (pre.querySelector('.copy-btn')) return;

        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn btn'; // Add base btn class
        copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
        copyBtn.setAttribute('aria-label', 'Copy code snippet');
        copyBtn.addEventListener('click', () => {
            const code = codeElement.textContent;
            navigator.clipboard.writeText(code).then(() => {
                copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                copyBtn.disabled = true;
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
                    copyBtn.disabled = false;
                }, 2000);
                showToast('Code copied to clipboard', 'success');
            }, (err) => {
                showToast('Failed to copy code. Try manually.', 'warning');
                console.error('Failed to copy text: ', err);
            });
        });
        pre.style.position = 'relative'; // Needed for absolute positioning of button
        pre.appendChild(copyBtn);
    });

    // Re-bind actions using cloning to remove old listeners
    const editBtn = document.getElementById('view-edit-btn');
    const deleteBtn = document.getElementById('view-delete-btn');
    const newEditBtn = editBtn.cloneNode(true);
    const newDeleteBtn = deleteBtn.cloneNode(true);
    editBtn.parentNode.replaceChild(newEditBtn, editBtn);
    deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);

    newEditBtn.addEventListener('click', () => {
        closeModal(viewModal);
        openEditModal(id);
    });
    newDeleteBtn.addEventListener('click', () => {
        closeModal(viewModal);
        deleteCheatsheet(id);
    });

    // Highlight code (already done by marked's highlight option, but can call again if needed)
    // Prism.highlightAllUnder(viewContent);

    openModal(viewModal);
}


// Open add/edit modal
function openEditModal(id = null) {
    const titleInput = document.getElementById('title-input');
    const categorySelect = document.getElementById('category-select');
    const tagsInput = document.getElementById('tags-input');
    const codeInput = document.getElementById('code-input');

    cheatsheetForm.reset(); // Clear form fields

    if (id) {
        const sheet = cheatsheets.find(s => s.id === id);
        if (!sheet) {
            console.error("Cheatsheet not found for editing:", id);
            showToast("Could not find the cheatsheet to edit.", "error");
            return;
        }
        modalTitle.textContent = 'Edit Cheat Sheet';
        titleInput.value = sheet.title;
        categorySelect.value = sheet.category; // Assumes category exists in options
        tagsInput.value = sheet.tags.join(', ');
        codeInput.value = sheet.content;
        editingId = id;
        cheatsheetModal.setAttribute('aria-labelledby', 'modal-title'); // Update aria if needed
    } else {
        modalTitle.textContent = 'Add New Cheat Sheet';
        editingId = null;
        cheatsheetModal.setAttribute('aria-labelledby', 'modal-title');
    }

    openModal(cheatsheetModal);
    setTimeout(() => titleInput.focus(), 100); // Focus after modal animation
}

// Store modal close handlers
const modalCloseHandlers = new Map();

// Open modal with animation
function openModal(modal) {
    modal.style.display = 'flex';
    modal.offsetHeight; // Force reflow
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    const handleClose = () => closeModal(modal);
    const handleClickOutside = (e) => { if (e.target === modal) closeModal(modal); };
    const handleEscKey = (e) => { if (e.key === 'Escape') closeModal(modal); };

    modalCloseHandlers.set(modal, { handleClose, handleClickOutside, handleEscKey });

    const closeButton = modal.querySelector('.close-btn');
    if (closeButton) closeButton.addEventListener('click', handleClose);
    modal.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscKey);
}

// Close modal with animation
function closeModal(modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';

    const handlers = modalCloseHandlers.get(modal);
    if (handlers) {
        const closeButton = modal.querySelector('.close-btn');
        if (closeButton) closeButton.removeEventListener('click', handlers.handleClose);
        modal.removeEventListener('click', handlers.handleClickOutside);
        document.removeEventListener('keydown', handlers.handleEscKey);
        modalCloseHandlers.delete(modal);
    }

    const onTransitionEnd = () => {
        modal.style.display = 'none';
        modal.removeEventListener('transitionend', onTransitionEnd);
    };
    modal.addEventListener('transitionend', onTransitionEnd);

    // Fallback timeout
    setTimeout(() => {
        if (!modal.classList.contains('open') && modal.style.display !== 'none') {
            modal.style.display = 'none';
            modal.removeEventListener('transitionend', onTransitionEnd);
        }
    }, 500); // Match or exceed CSS transition duration
}

// Delete cheatsheet
function deleteCheatsheet(id) {
    const sheetToDelete = cheatsheets.find(s => s.id === id);
    if (!sheetToDelete) return;

    // Replace confirm with a more robust confirmation modal in the future
    if (confirm(`Are you sure you want to delete "${sheetToDelete.title}"?`)) {
        cheatsheets = cheatsheets.filter(sheet => sheet.id !== id);
        saveCheatsheets();
        renderCheatsheets();
        renderAllTags();
        showToast(`"${sheetToDelete.title}" deleted`, 'warning');
    }
}

// Generate unique ID
function generateId(title) {
    const sanitizedTitle = title.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    const baseId = sanitizedTitle || 'untitled';
    const timestamp = Date.now().toString(36).slice(-6); // Longer timestamp part
    return `${baseId}-${timestamp}`;
}

// Show toast notification
let toastTimeout;
function showToast(message, type = 'success') {
    clearTimeout(toastTimeout);
    toastMessage.textContent = message;
    toastElement.className = 'toast'; // Reset classes
    toastElement.classList.add('show', type); // Add type class for styling progress bar

    switch(type) {
        case 'success': toastIcon.className = 'fas fa-check-circle'; break;
        case 'warning': toastIcon.className = 'fas fa-exclamation-triangle'; break;
        case 'error': toastIcon.className = 'fas fa-times-circle'; break;
        default: toastIcon.className = 'fas fa-info-circle'; break;
    }

    toastTimeout = setTimeout(() => {
        toastElement.classList.remove('show');
    }, 3000);
}


// Render all unique tags
function renderAllTags() {
    const allTags = [...new Set(
        cheatsheets.flatMap(sheet => sheet.tags)
                   .map(tag => tag.trim().toLowerCase())
                   .filter(tag => tag) // Ensure no empty tags
    )];
    allTags.sort((a, b) => a.localeCompare(b)); // Sort alphabetically

    allTagsContainer.innerHTML = ''; // Clear previous tags
    if (allTags.length === 0) {
        allTagsContainer.innerHTML = '<p class="no-tags-message">No tags yet.</p>';
        return;
    }

    allTags.forEach(tag => {
        const tagElement = document.createElement('button');
        tagElement.className = 'tag';
        tagElement.textContent = tag;
        tagElement.dataset.tag = tag; // Store lowercase tag value
        tagElement.setAttribute('role', 'option');
        tagElement.setAttribute('aria-pressed', 'false');

        if (currentFilter.tag === tag) {
            tagElement.classList.add('active');
            tagElement.setAttribute('aria-pressed', 'true');
        }

        tagElement.addEventListener('click', () => {
            const clickedTag = tagElement.dataset.tag;
            const currentActiveTag = allTagsContainer.querySelector('.tag.active');

            if (currentActiveTag === tagElement) { // Clicked the currently active tag
                currentFilter.tag = '';
                tagElement.classList.remove('active');
                tagElement.setAttribute('aria-pressed', 'false');
            } else { // Clicked a new or inactive tag
                if (currentActiveTag) { // Deactivate previous
                    currentActiveTag.classList.remove('active');
                    currentActiveTag.setAttribute('aria-pressed', 'false');
                }
                currentFilter.tag = clickedTag; // Set new filter
                tagElement.classList.add('active');
                tagElement.setAttribute('aria-pressed', 'true');
            }
            renderCheatsheets();
        });
        allTagsContainer.appendChild(tagElement);
    });
}

// Setup all event listeners
function setupEventListeners() {
    // Add Sheet Button
    addCheatsheetBtn.addEventListener('click', () => openEditModal());

    // Add/Edit Modal Cancel Button
    cancelBtn.addEventListener('click', () => closeModal(cheatsheetModal));

    // Add/Edit Form Submission
    cheatsheetForm.addEventListener('submit', handleFormSubmit);

    // Search Input
    let searchDebounceTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchDebounceTimeout);
        currentFilter.search = e.target.value.trim();
        searchDebounceTimeout = setTimeout(renderCheatsheets, 250); // Debounce search
    });

    // Category Filter List (Delegation)
    categoriesList.addEventListener('click', handleCategoryFilter);

    // View Options (Grid/List) Buttons
    viewBtns.forEach(btn => btn.addEventListener('click', handleViewChange));

    // Theme Toggle Button
    themeToggleBtn.addEventListener('click', toggleTheme);

    // Cheatsheet Grid/List Click Delegation (for view/edit/delete)
    cheatsheetGrid.addEventListener('click', handleGridItemClick);
    cheatsheetGrid.addEventListener('keydown', handleGridItemKeydown); // For keyboard activation
}

// Handler for form submission
function handleFormSubmit(e) {
    e.preventDefault();
    const titleInput = document.getElementById('title-input');
    const categorySelect = document.getElementById('category-select');
    const tagsInput = document.getElementById('tags-input');
    const codeInput = document.getElementById('code-input');

    const title = titleInput.value.trim();
    const category = categorySelect.value;
    const tags = tagsInput.value.split(',')
                     .map(tag => tag.trim())
                     .filter(tag => tag); // Remove empty tags
    const content = codeInput.value; // HTML 'required' handles empty

    if (!title) {
        showToast('Title is required.', 'warning');
        titleInput.focus(); return;
    }
     if (!content) { // Double check, though 'required' should handle it
        showToast('Content is required.', 'warning');
        codeInput.focus(); return;
    }

    if (editingId) { // Update
        const index = cheatsheets.findIndex(sheet => sheet.id === editingId);
        if (index !== -1) {
            cheatsheets[index] = { ...cheatsheets[index], title, category, tags, content };
            showToast(`"${title}" updated successfully`, 'success');
        } else {
            console.error("Failed to find cheatsheet for update:", editingId);
            showToast('Error updating cheat sheet.', 'error');
        }
    } else { // Add new
        const newCheatsheet = { id: generateId(title), title, category, tags, content };
        cheatsheets.push(newCheatsheet);
        showToast(`"${title}" added successfully`, 'success');
    }

    saveCheatsheets();
    renderCheatsheets();
    renderAllTags();
    closeModal(cheatsheetModal);
    editingId = null; // Reset editing state
}

// Handler for category list clicks
function handleCategoryFilter(e) {
    const targetLi = e.target.closest('li[data-category]');
    if (targetLi) {
        const category = targetLi.dataset.category;
        if (currentFilter.category === category) return; // No change

        categoriesList.querySelectorAll('li').forEach(li => {
            li.classList.remove('active');
            li.setAttribute('aria-selected', 'false');
        });
        targetLi.classList.add('active');
        targetLi.setAttribute('aria-selected', 'true');
        currentFilter.category = category;
        renderCheatsheets();
    }
}

// Handler for view change buttons
function handleViewChange(e) {
     const btn = e.currentTarget; // Use currentTarget for the attached listener
     const view = btn.dataset.view;
     if (view === currentView) return;

     viewBtns.forEach(b => {
         b.classList.remove('active');
         b.setAttribute('aria-checked', 'false');
     });
     btn.classList.add('active');
     btn.setAttribute('aria-checked', 'true');

     currentView = view;
     renderCheatsheets(); // Re-render with the new view
}

// Handler for clicks within the cheatsheet grid/list area
function handleGridItemClick(e) {
    const targetCard = e.target.closest('.cheatsheet-card, .list-item');
    if (!targetCard) return;

    const sheetId = targetCard.dataset.id;
    const editButton = e.target.closest('.edit-btn');
    const deleteButton = e.target.closest('.delete-btn');

    if (editButton) {
        openEditModal(sheetId);
    } else if (deleteButton) {
        deleteCheatsheet(sheetId);
    } else {
        // Clicked on the item itself, not an action button
        openViewModal(sheetId);
    }
}

// Handler for keyboard interactions on grid/list items
function handleGridItemKeydown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
        const targetCard = e.target.closest('.cheatsheet-card, .list-item');
         if (targetCard && document.activeElement === targetCard) { // Ensure the card/item itself is focused
             e.preventDefault(); // Prevent spacebar scrolling
             const sheetId = targetCard.dataset.id;
             openViewModal(sheetId);
         }
    }
}

// --- Demo Data ---
function getDemoData() {
    return [
        {
            id: 'js-array-methods-demo',
            title: 'JavaScript Array Methods',
            category: 'javascript',
            tags: ['arrays', 'methods', 'basics', 'es6'],
            content: `# JavaScript Array Methods

Common methods for manipulating arrays in JavaScript.

\`\`\`javascript
// Create an array
const fruits = ['Apple', 'Banana', 'Cherry'];

// Add items
fruits.push('Orange'); // Adds to end -> ['Apple', 'Banana', 'Cherry', 'Orange']
fruits.unshift('Mango'); // Adds to start -> ['Mango', 'Apple', 'Banana', 'Cherry', 'Orange']

// Remove items
const lastFruit = fruits.pop(); // Removes from end -> 'Orange'
const firstFruit = fruits.shift(); // Removes from start -> 'Mango'

// Find items
const cherryIndex = fruits.indexOf('Cherry'); // -> 1
const hasBanana = fruits.includes('Banana'); // -> true

// Iterate
fruits.forEach(fruit => console.log(fruit));

// Transform (map)
const upperFruits = fruits.map(f => f.toUpperCase());
// -> ['APPLE', 'BANANA', 'CHERRY']

// Filter
const bFruits = fruits.filter(f => f.startsWith('B'));
// -> ['Banana']

// Reduce
const numbers = [1, 2, 3, 4];
const sum = numbers.reduce((total, current) => total + current, 0); // -> 10

// Slice (doesn't modify original)
const middleFruits = fruits.slice(1, 3); // -> ['Banana', 'Cherry']

// Splice (modifies original)
// Remove 1 element at index 1, add 'Blueberry'
fruits.splice(1, 1, 'Blueberry');
// -> ['Apple', 'Blueberry', 'Cherry']
\`\`\`

Remember that methods like \`push\`, \`pop\`, \`shift\`, \`unshift\`, and \`splice\` modify the original array, while methods like \`slice\`, \`map\`, \`filter\`, and \`reduce\` return a new array or value without changing the original.`
        },
        {
            id: 'css-flexbox-demo',
            title: 'CSS Flexbox Guide',
            category: 'css',
            tags: ['layout', 'flexbox', 'responsive', 'css3'],
            content: `# CSS Flexbox Guide

A quick reference for CSS Flexible Box Layout properties.

## Flex Container Properties

Apply these to the parent element.

\`\`\`css
.container {
  display: flex; /* or inline-flex */

  /* Direction of items */
  flex-direction: row | row-reverse | column | column-reverse;

  /* Wrapping of items */
  flex-wrap: nowrap | wrap | wrap-reverse;

  /* Shorthand for direction and wrap */
  flex-flow: <flex-direction> <flex-wrap>;

  /* Alignment along the main axis */
  justify-content: flex-start | flex-end | center | space-between | space-around | space-evenly;

  /* Alignment along the cross axis (single line) */
  align-items: stretch | flex-start | flex-end | center | baseline;

  /* Alignment along the cross axis (multiple lines - requires wrap) */
  align-content: flex-start | flex-end | center | space-between | space-around | stretch;

  /* Gaps between items */
  gap: <row-gap> <column-gap>; /* e.g., gap: 1rem; or gap: 10px 20px; */
}
\`\`\`

## Flex Item Properties

Apply these to the child elements.

\`\`\`css
.item {
  /* Order of the item */
  order: <integer>; /* Default 0 */

  /* Ability to grow (proportionally) */
  flex-grow: <number>; /* Default 0 */

  /* Ability to shrink (proportionally) */
  flex-shrink: <number>; /* Default 1 */

  /* Default size before distributing space */
  flex-basis: auto | <length> | content; /* Default auto */

  /* Shorthand for grow, shrink, basis */
  flex: none | <flex-grow> <flex-shrink> <flex-basis>;
  /* Common values: flex: 0 1 auto; (default), flex: 1 1 0; (grow and shrink from 0), flex: auto; (1 1 auto) */

  /* Override container's align-items for a single item */
  align-self: auto | flex-start | flex-end | center | baseline | stretch;
}
\`\`\`

Flexbox is ideal for distributing space along a single dimension (row or column). For two-dimensional layouts, consider CSS Grid.`
        },
        {
            id: 'git-basics-demo',
            title: 'Basic Git Commands',
            category: 'git',
            tags: ['version control', 'basics', 'cli', 'commands'],
            content: `# Basic Git Commands

Essential commands for everyday Git usage.

## Setup (First time only)
\`\`\`bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
\`\`\`

## Create or Clone
\`\`\`bash
# Initialize a new repository in the current folder
git init

# Clone an existing repository from a URL
git clone <repository_url>
\`\`\`

## Staging & Committing Changes
\`\`\`bash
# Check the status of your working directory and staging area
git status

# Add a specific file to the staging area
git add <filename>

# Add all changed files (new, modified, deleted) to staging
git add .
# or
git add -A

# Commit staged changes with a descriptive message
git commit -m "Your descriptive commit message"

# Stage all tracked, modified files and commit in one step
git commit -am "Shorter message for simple changes"
\`\`\`

## Branching
\`\`\`bash
# List all local branches (* indicates current branch)
git branch

# Create a new branch
git branch <new_branch_name>

# Switch to an existing branch
git checkout <branch_name>
# or (newer syntax)
git switch <branch_name>

# Create and switch to a new branch in one step
git checkout -b <new_branch_name>
# or (newer syntax)
git switch -c <new_branch_name>

# Delete a local branch (use -D for forced deletion)
git branch -d <branch_name>
\`\`\`

## Merging
\`\`\`bash
# Switch to the branch you want to merge INTO (e.g., main)
git checkout main

# Merge changes FROM another branch INTO the current branch
git merge <branch_to_merge_from>
\`\`\`

## Remotes (Working with GitHub, GitLab, etc.)
\`\`\`bash
# List configured remote repositories
git remote -v

# Add a new remote repository (commonly named 'origin')
git remote add origin <repository_url>

# Fetch changes from the remote, but don't merge yet
git fetch origin

# Pull changes (fetch + merge) from the remote branch into your current local branch
git pull origin <branch_name> # e.g., git pull origin main

# Push your committed local changes to the remote branch
git push origin <branch_name> # e.g., git push origin feature-branch

# Set the upstream branch for the current local branch (simplifies pull/push)
git push -u origin <branch_name> # Then you can just use 'git pull' and 'git push'
\`\`\`

## Viewing History
\`\`\`bash
# Show commit history
git log

# Show compact log (one line per commit)
git log --oneline

# Show log with graph of branches
git log --graph --oneline --all
\`\`\`
`
        }
    ];
}


// Initialize app on DOMContentLoaded
document.addEventListener('DOMContentLoaded', init);
