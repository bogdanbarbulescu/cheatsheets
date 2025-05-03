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

// State
let cheatsheets = [];
let currentFilter = {
    search: '',
    category: 'all',
    tag: ''
};
let currentView = 'grid';
let editingId = null;

// Initialize the application
function init() {
    loadCheatsheets();
    renderCheatsheets();
    setupEventListeners();
    renderAllTags();
}

// Load cheatsheets from localStorage
function loadCheatsheets() {
    const storedCheatsheets = localStorage.getItem('cheatsheets');
    if (storedCheatsheets) {
        cheatsheets = JSON.parse(storedCheatsheets);
    } else {
        // Demo data for first time users
        cheatsheets = [
            {
                id: 'js-array-methods',
                title: 'JavaScript Array Methods',
                category: 'javascript',
                tags: ['arrays', 'methods', 'basics'],
                content: `# JavaScript Array Methods

\`\`\`javascript
// Creating arrays
const arr1 = [1, 2, 3];
const arr2 = new Array(4, 5, 6);
const arr3 = Array.from('string'); // ['s', 't', 'r', 'i', 'n', 'g']

// Basic methods
arr1.push(4);       // Add to end: [1, 2, 3, 4]
arr1.pop();         // Remove from end: [1, 2, 3]
arr1.unshift(0);    // Add to beginning: [0, 1, 2, 3]
arr1.shift();       // Remove from beginning: [1, 2, 3]

// Transforming arrays
const mapped = arr1.map(x => x * 2);         // [2, 4, 6]
const filtered = arr1.filter(x => x > 1);    // [2, 3]
const reduced = arr1.reduce((a, b) => a + b, 0); // 6

// Finding elements
arr1.indexOf(2);              // 1
arr1.find(x => x > 2);        // 3
arr1.findIndex(x => x > 2);   // 2
arr1.includes(4);             // false

// Other useful methods
arr1.slice(1, 2);             // [2]
arr1.splice(1, 1, 'two');     // [1, 'two', 3]
arr1.concat(arr2);            // [1, 'two', 3, 4, 5, 6]
arr1.join('-');               // "1-two-3"
arr1.reverse();               // [3, 'two', 1]
arr1.sort();                  // [1, 3, 'two']
\`\`\`

Arrays are zero-indexed, ordered collections of values. JavaScript arrays are resizable and can contain a mix of different data types.`
            },
            {
                id: 'css-flexbox',
                title: 'CSS Flexbox Cheat Sheet',
                category: 'css',
                tags: ['layout', 'flexbox', 'responsive'],
                content: `# CSS Flexbox Cheat Sheet

## Container Properties

\`\`\`css
.container {
  display: flex; /* or inline-flex */
  flex-direction: row | row-reverse | column | column-reverse;
  flex-wrap: nowrap | wrap | wrap-reverse;
  flex-flow: <flex-direction> <flex-wrap>;
  justify-content: flex-start | flex-end | center | space-between | space-around | space-evenly;
  align-items: stretch | flex-start | flex-end | center | baseline;
  align-content: flex-start | flex-end | center | space-between | space-around | stretch;
  gap: <row-gap> <column-gap>;
}
\`\`\`

## Item Properties

\`\`\`css
.item {
  order: <integer>;
  flex-grow: <number>;
  flex-shrink: <number>;
  flex-basis: auto | <width>;
  flex: none | <flex-grow> <flex-shrink> <flex-basis>;
  align-self: auto | flex-start | flex-end | center | baseline | stretch;
}
\`\`\`

Flexbox is a one-dimensional layout method designed for laying out items in rows or columns.`
            },
            {
                id: 'git-commands',
                title: 'Git Commands',
                category: 'git',
                tags: ['version control', 'basics', 'commands'],
                content: `# Git Commands Cheat Sheet

## Setup & Configuration
\`\`\`bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
git config --list
\`\`\`

## Creating Repositories
\`\`\`bash
git init                    # Initialize a new repository
git clone <repo-url>        # Clone an existing repository
\`\`\`

## Basic Snapshotting
\`\`\`bash
git status                  # Check status
git add <file>              # Add a file to staging
git add .                   # Add all files to staging
git commit -m "message"     # Commit changes
git commit -am "message"    # Add & commit in one step
\`\`\`

## Branching & Merging
\`\`\`bash
git branch                  # List branches
git branch <branch-name>    # Create a new branch
git checkout <branch-name>  # Switch to a branch
git merge <branch-name>     # Merge branch into current branch
git branch -d <branch-name> # Delete a branch
\`\`\`

## Remote Repositories
\`\`\`bash
git remote add origin <repo-url>   # Add remote repository
git push -u origin <branch-name>   # Push to remote
git pull                           # Pull latest changes
git fetch                          # Fetch changes without merging
\`\`\`

Git is a distributed version control system designed to handle everything from small to very large projects with speed and efficiency.`
            }
        ];
        saveCheatsheets();
    }
}

// Save cheatsheets to localStorage
function saveCheatsheets() {
    localStorage.setItem('cheatsheets', JSON.stringify(cheatsheets));
}

// Render cheatsheets based on current filter
function renderCheatsheets() {
    // Filter cheatsheets based on current filter
    const filteredCheatsheets = cheatsheets.filter(sheet => {
        // Filter by search term
        const searchMatch = sheet.title.toLowerCase().includes(currentFilter.search.toLowerCase()) ||
                           sheet.content.toLowerCase().includes(currentFilter.search.toLowerCase()) ||
                           sheet.tags.some(tag => tag.toLowerCase().includes(currentFilter.search.toLowerCase()));
        
        // Filter by category
        const categoryMatch = currentFilter.category === 'all' || sheet.category === currentFilter.category;
        
        // Filter by tag
        const tagMatch = currentFilter.tag === '' || sheet.tags.includes(currentFilter.tag);
        
        return searchMatch && categoryMatch && tagMatch;
    });
    
    // Show or hide no results message
    if (filteredCheatsheets.length === 0) {
        noResults.classList.remove('hidden');
        cheatsheetGrid.innerHTML = '';
        return;
    } else {
        noResults.classList.add('hidden');
    }
    
    // Render cheatsheets in grid or list view
    if (currentView === 'grid') {
        renderGridView(filteredCheatsheets);
    } else {
        renderListView(filteredCheatsheets);
    }
}

// Render cheatsheets in grid view
function renderGridView(sheets) {
    cheatsheetGrid.className = 'cheatsheets-grid';
    cheatsheetGrid.innerHTML = '';
    
    sheets.forEach(sheet => {
        const preview = sheet.content.split('\n').slice(1, 4).join('\n');
        
        const card = document.createElement('div');
        card.className = 'cheatsheet-card';
        card.setAttribute('data-id', sheet.id);
        
        card.innerHTML = `
            <div class="card-header">
                <h3 class="card-title">${sheet.title}</h3>
                <div class="card-category">
                    <i class="fas ${getCategoryIcon(sheet.category)}"></i>
                    ${capitalize(sheet.category)}
                </div>
            </div>
            <div class="card-content">
                ${preview}
            </div>
            <div class="card-footer">
                <div class="card-tags">
                    ${sheet.tags.slice(0, 3).map(tag => `<span class="card-tag">${tag}</span>`).join('')}
                    ${sheet.tags.length > 3 ? `<span class="card-tag">+${sheet.tags.length - 3}</span>` : ''}
                </div>
                <div class="card-actions">
                    <button class="card-action-btn edit-btn" data-id="${sheet.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="card-action-btn delete-btn" data-id="${sheet.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        cheatsheetGrid.appendChild(card);
    });
    
    // Add event listeners to cards and buttons
    document.querySelectorAll('.cheatsheet-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.card-action-btn')) {
                openViewModal(card.getAttribute('data-id'));
            }
        });
    });
    
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openEditModal(btn.getAttribute('data-id'));
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteCheatsheet(btn.getAttribute('data-id'));
        });
    });
}

// Render cheatsheets in list view
function renderListView(sheets) {
    cheatsheetGrid.className = 'cheatsheets-list';
    cheatsheetGrid.innerHTML = '';
    
    sheets.forEach(sheet => {
        const listItem = document.createElement('div');
        listItem.className = 'list-item';
        listItem.setAttribute('data-id', sheet.id);
        
        listItem.innerHTML = `
            <div class="list-item-details">
                <div class="list-item-icon">
                    <i class="fas ${getCategoryIcon(sheet.category)}"></i>
                </div>
                <div class="list-item-info">
                    <h3>${sheet.title}</h3>
                    <div class="list-item-meta">
                        ${capitalize(sheet.category)} • ${sheet.tags.length} tags
                    </div>
                </div>
            </div>
            <div class="card-actions">
                <button class="card-action-btn edit-btn" data-id="${sheet.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="card-action-btn delete-btn" data-id="${sheet.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        cheatsheetGrid.appendChild(listItem);
    });
    
    // Add event listeners to list items and buttons
    document.querySelectorAll('.list-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.card-action-btn')) {
                openViewModal(item.getAttribute('data-id'));
            }
        });
    });
    
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openEditModal(btn.getAttribute('data-id'));
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteCheatsheet(btn.getAttribute('data-id'));
        });
    });
}

// Get icon for category
function getCategoryIcon(category) {
    const icons = {
        javascript: 'fa-js',
        python: 'fa-python',
        css: 'fa-css3',
        html: 'fa-html5',
        git: 'fa-git-alt'
    };
    
    return icons[category] || 'fa-code';
}

// Capitalize first letter
function capitalize(str) {
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
    
    // Convert markdown to HTML
    const htmlContent = marked.parse(sheet.content);
    viewContent.innerHTML = htmlContent;
    
    // Add copy buttons to code blocks
    viewContent.querySelectorAll('pre').forEach(pre => {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
        copyBtn.addEventListener('click', () => {
            const code = pre.querySelector('code').textContent;
            navigator.clipboard.writeText(code).then(() => {
                copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
                }, 2000);
            });
        });
        pre.appendChild(copyBtn);
    });
    
    // Add event listener to edit button
    document.getElementById('view-edit-btn').setAttribute('data-id', id);
    document.getElementById('view-edit-btn').addEventListener('click', () => {
        closeModal(viewModal);
        openEditModal(id);
    });
    
    // Add event listener to delete button
    document.getElementById('view-delete-btn').setAttribute('data-id', id);
    document.getElementById('view-delete-btn').addEventListener('click', () => {
        closeModal(viewModal);
        deleteCheatsheet(id);
    });
    
    // Highlight code blocks
    Prism.highlightAllUnder(viewContent);
    
    // Open modal
    openModal(viewModal);
}

// Open add/edit modal
function openEditModal(id = null) {
    const titleInput = document.getElementById('title-input');
    const categorySelect = document.getElementById('category-select');
    const tagsInput = document.getElementById('tags-input');
    const codeInput = document.getElementById('code-input');
    
    // Clear form
    cheatsheetForm.reset();
    
    if (id) {
        // Edit mode
        const sheet = cheatsheets.find(s => s.id === id);
        if (!sheet) return;
        
        modalTitle.textContent = 'Edit Cheat Sheet';
        titleInput.value = sheet.title;
        categorySelect.value = sheet.category;
        tagsInput.value = sheet.tags.join(', ');
        codeInput.value = sheet.content;
        editingId = id;
    } else {
        // Add mode
        modalTitle.textContent = 'Add New Cheat Sheet';
        editingId = null;
    }
    
    openModal(cheatsheetModal);
}

// Open modal with animation
function openModal(modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    
    // Add event listener to close button
    modal.querySelector('.close-btn').addEventListener('click', () => {
        closeModal(modal);
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
}

// Close modal with animation
function closeModal(modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    
    // Remove event listeners
    modal.querySelector('.close-btn').removeEventListener('click', closeModal);
    modal.removeEventListener('click', closeModal);
}

// Delete cheatsheet
function deleteCheatsheet(id) {
    if (confirm('Are you sure you want to delete this cheat sheet?')) {
        cheatsheets = cheatsheets.filter(sheet => sheet.id !== id);
        saveCheatsheets();
        renderCheatsheets();
        renderAllTags();
        showToast('Cheat sheet deleted successfully', 'warning');
    }
}

// Generate unique ID
function generateId(title) {
    return title.toLowerCase()
        .replace(/[^\w\s-]/g, '')  // Remove special characters
        .replace(/\s+/g, '-')      // Replace spaces with hyphens
        .replace(/-+/g, '-')       // Remove duplicate hyphens
        + '-' + Date.now().toString().slice(-4);  // Add timestamp to ensure uniqueness
}

// Show toast notification
function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    
    if (type === 'success') {
        toastIcon.className = 'fas fa-check-circle';
    } else if (type === 'warning') {
        toastIcon.className = 'fas fa-exclamation-circle';
    }
    
    toastElement.classList.add('show');
    
    setTimeout(() => {
        toastElement.classList.remove('show');
    }, 3000);
}

// Render all unique tags
function renderAllTags() {
    // Get all unique tags
    const allTags = [...new Set(cheatsheets.flatMap(sheet => sheet.tags))];
    
    // Sort alphabetically
    allTags.sort();
    
    // Render tags
    allTagsContainer.innerHTML = '';
    allTags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'tag';
        tagElement.textContent = tag;
        
        if (currentFilter.tag === tag) {
            tagElement.classList.add('active');
        }
        
        tagElement.addEventListener('click', () => {
            // Toggle tag filter
            if (currentFilter.tag === tag) {
                currentFilter.tag = '';
                tagElement.classList.remove('active');
            } else {
                currentFilter.tag = tag;
                document.querySelectorAll('#all-tags .tag').forEach(t => t.classList.remove('active'));
                tagElement.classList.add('active');
            }
            
            renderCheatsheets();
        });
        
        allTagsContainer.appendChild(tagElement);
    });
}

// Add event listeners
function setupEventListeners() {
    // Add cheatsheet button
    addCheatsheetBtn.addEventListener('click', () => {
        openEditModal();
    });
    
    // Cancel button
    cancelBtn.addEventListener('click', () => {
        closeModal(cheatsheetModal);
    });
    
    // Form submission
    cheatsheetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const titleInput = document.getElementById('title-input');
        const categorySelect = document.getElementById('category-select');
        const tagsInput = document.getElementById('tags-input');
        const codeInput = document.getElementById('code-input');
        
        const title = titleInput.value.trim();
        const category = categorySelect.value;
        const tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);
        const content = codeInput.value;
        
        if (editingId) {
            // Update existing cheatsheet
            const index = cheatsheets.findIndex(sheet => sheet.id === editingId);
            if (index !== -1) {
                cheatsheets[index] = {
                    ...cheatsheets[index],
                    title,
                    category,
                    tags,
                    content
                };
                showToast('Cheat sheet updated successfully');
            }
        } else {
            // Add new cheatsheet
            const newCheatsheet = {
                id: generateId(title),
                title,
                category,
                tags,
                content
            };
            
            cheatsheets.push(newCheatsheet);
            showToast('Cheat sheet added successfully');
        }
        
        saveCheatsheets();
        renderCheatsheets();
        renderAllTags();
        closeModal(cheatsheetModal);
    });
    
    // Search input
    searchInput.addEventListener('input', (e) => {
        currentFilter.search = e.target.value.trim();
        renderCheatsheets();
    });
    
    // Category filter
    categoriesList.querySelectorAll('li').forEach(item => {
        item.addEventListener('click', () => {
            const category = item.getAttribute('data-category');
            
            // Update active class
            categoriesList.querySelectorAll('li').forEach(li => {
                li.classList.remove('active');
            });
            item.classList.add('active');
            
            // Update filter
            currentFilter.category = category;
            renderCheatsheets();
        });
    });
    
    // View buttons (grid/list)
    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.getAttribute('data-view');
            
            // Update active class
            viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update view
            currentView = view;
            renderCheatsheets();
        });
    });
}

// Initialize app
document.addEventListener('DOMContentLoaded', init);
