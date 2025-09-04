// DOM Elements
const todoInput = document.getElementById('todo-input');
const dateInput = document.getElementById('date-input');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');
const sortBtn = document.getElementById('sort-btn');
const filterBtn = document.getElementById('filter-btn');
const deleteAllBtn = document.getElementById('delete-all-btn');
const filterModal = document.getElementById('filter-modal');
const closeFilterModalBtn = document.getElementById('close-filter-modal');
const applyFilterBtn = document.getElementById('apply-filter');
const statusFilter = document.getElementById('status-filter');
const dateFromFilter = document.getElementById('date-from');
const dateToFilter = document.getElementById('date-to');

// Error elements
const todoError = document.getElementById('todo-error');
const dateError = document.getElementById('date-error');

// Stats elements
const totalTasksEl = document.getElementById('total-tasks');
const completedTasksEl = document.getElementById('completed-tasks');
const pendingTasksEl = document.getElementById('pending-tasks');
const progressPercentageEl = document.getElementById('progress-percentage');

// State
let todos = JSON.parse(localStorage.getItem('todos')) || [];
let currentFilter = {
    status: 'all',
    dateFrom: '',
    dateTo: '',
    searchTerm: ''
};
let sortDirection = 'asc'; // 'asc' or 'desc'
let editingId = null;

// Initialize the app
function init() {
    // Set today as the minimum date for date input
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    dateInput.value = today;
    
    // Load todos from localStorage
    renderTodos();
    updateStats();
    
    // Set up event listeners
    addBtn.addEventListener('click', handleAddTodo);
    todoInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') handleAddTodo();
    });
    searchInput.addEventListener('input', handleSearch);
    sortBtn.addEventListener('click', handleSort);
    filterBtn.addEventListener('click', () => {
        filterModal.classList.remove('hidden');
    });
    closeFilterModalBtn.addEventListener('click', () => {
        filterModal.classList.add('hidden');
    });
    applyFilterBtn.addEventListener('click', applyFilter);
    deleteAllBtn.addEventListener('click', handleDeleteAll);
    
    // Close modal when clicking outside
    window.addEventListener('click', e => {
        if (e.target === filterModal) {
            filterModal.classList.add('hidden');
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
        // Ctrl+F for search focus
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            searchInput.focus();
        }
    });
}

// Handle adding a new todo
function handleAddTodo() {
    const todoText = todoInput.value.trim();
    const dueDate = dateInput.value;
    
    // Validate inputs
    let isValid = true;
    
    if (!todoText) {
        todoError.classList.remove('hidden');
        isValid = false;
    } else {
        todoError.classList.add('hidden');
    }
    
    if (!dueDate) {
        dateError.classList.remove('hidden');
        isValid = false;
    } else {
        dateError.classList.add('hidden');
    }
    
    if (!isValid) return;
    
    if (editingId !== null) {
        // Update existing todo
        const index = todos.findIndex(todo => todo.id === editingId);
        if (index !== -1) {
            todos[index].text = todoText;
            todos[index].dueDate = dueDate;
            editingId = null;
            addBtn.innerHTML = '<i class="fas fa-plus"></i>';
        }
    } else {
        // Add new todo
        const newTodo = {
            id: Date.now(),
            text: todoText,
            dueDate: dueDate,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        todos.push(newTodo);
    }
    
    // Clear input fields
    todoInput.value = '';
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    
    // Save and render
    saveTodos();
    renderTodos();
    updateStats();
}

// Handle editing a todo
function handleEditTodo(id) {
    const todo = todos.find(todo => todo.id === id);
    if (!todo) return;
    
    todoInput.value = todo.text;
    dateInput.value = todo.dueDate;
    editingId = id;
    
    addBtn.innerHTML = '<i class="fas fa-save"></i>';
    todoInput.focus();
}

// Handle toggling todo completion
function handleToggleTodo(id) {
    const index = todos.findIndex(todo => todo.id === id);
    if (index !== -1) {
        todos[index].completed = !todos[index].completed;
        saveTodos();
        renderTodos();
        updateStats();
    }
}

// Handle deleting a todo
function handleDeleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    renderTodos();
    updateStats();
}

// Handle deleting all todos
function handleDeleteAll() {
    if (todos.length === 0) return;
    
    if (confirm('Are you sure you want to delete all tasks?')) {
        todos = [];
        saveTodos();
        renderTodos();
        updateStats();
    }
}

// Handle searching todos
function handleSearch() {
    currentFilter.searchTerm = searchInput.value.trim().toLowerCase();
    renderTodos();
}

// Handle sorting todos
function handleSort() {
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    renderTodos();
}

// Apply filter from modal
function applyFilter() {
    currentFilter.status = statusFilter.value;
    currentFilter.dateFrom = dateFromFilter.value;
    currentFilter.dateTo = dateToFilter.value;
    
    filterModal.classList.add('hidden');
    renderTodos();
}

// Filter todos based on current filters
function filterTodos(todoList) {
    return todoList.filter(todo => {
        // Filter by status
        if (currentFilter.status !== 'all') {
            if (currentFilter.status === 'completed' && !todo.completed) return false;
            if (currentFilter.status === 'pending' && todo.completed) return false;
        }
        
        // Filter by date range
        if (currentFilter.dateFrom && todo.dueDate < currentFilter.dateFrom) return false;
        if (currentFilter.dateTo && todo.dueDate > currentFilter.dateTo) return false;
        
        // Filter by search term
        if (currentFilter.searchTerm && !todo.text.toLowerCase().includes(currentFilter.searchTerm)) {
            return false;
        }
        
        return true;
    });
}

// Sort todos based on current sort direction
function sortTodos(todoList) {
    return [...todoList].sort((a, b) => {
        if (sortDirection === 'asc') {
            return new Date(a.dueDate) - new Date(b.dueDate);
        } else {
            return new Date(b.dueDate) - new Date(a.dueDate);
        }
    });
}

// Render todos to the DOM
function renderTodos() {
    // Filter and sort todos
    const filteredTodos = filterTodos(todos);
    const sortedTodos = sortTodos(filteredTodos);
    
    // Clear todo list
    todoList.innerHTML = '';
    
    // Show empty state if no todos
    if (sortedTodos.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        
        // Render todos
        sortedTodos.forEach(todo => {
            const row = document.createElement('tr');
            row.className = `todo-item ${todo.completed ? 'completed' : ''} border-b border-gray-700`;
            
            const formattedDate = formatDate(todo.dueDate);
            const isOverdue = !todo.completed && new Date(todo.dueDate) < new Date() && todo.dueDate !== new Date().toISOString().split('T')[0];
            
            row.innerHTML = `
                <td class="p-4">
                    <span class="todo-text ${isOverdue ? 'text-red-400' : ''}">${todo.text}</span>
                </td>
                <td class="p-4">
                    <span class="${isOverdue ? 'text-red-400' : ''}">${formattedDate}</span>
                    ${isOverdue ? '<span class="text-xs text-red-400 ml-2">(overdue)</span>' : ''}
                </td>
                <td class="p-4">
                    <span class="status-badge ${todo.completed ? 'completed' : 'pending'}">
                        ${todo.completed ? 
                            '<i class="fas fa-check-circle"></i> Completed' : 
                            '<i class="fas fa-clock"></i> Pending'}
                    </span>
                </td>
                <td class="p-4 text-right">
                    <div class="flex gap-2 justify-end">
                        <button class="action-btn complete-btn" title="${todo.completed ? 'Mark as pending' : 'Mark as completed'}">
                            <i class="fas fa-${todo.completed ? 'undo' : 'check'}"></i>
                        </button>
                        <button class="action-btn edit-btn" title="Edit task">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" title="Delete task">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            // Add event listeners to buttons
            const completeBtn = row.querySelector('.complete-btn');
            const editBtn = row.querySelector('.edit-btn');
            const deleteBtn = row.querySelector('.delete-btn');
            
            completeBtn.addEventListener('click', () => handleToggleTodo(todo.id));
            editBtn.addEventListener('click', () => handleEditTodo(todo.id));
            deleteBtn.addEventListener('click', () => handleDeleteTodo(todo.id));
            
            todoList.appendChild(row);
        });
    }
}

// Update stats
function updateStats() {
    const totalTasks = todos.length;
    const completedTasks = todos.filter(todo => todo.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    totalTasksEl.textContent = totalTasks;
    completedTasksEl.textContent = completedTasks;
    pendingTasksEl.textContent = pendingTasks;
    progressPercentageEl.textContent = `${progressPercentage}%`;
}

// Save todos to localStorage
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Initialize the app
document.addEventListener('DOMContentLoaded', init);