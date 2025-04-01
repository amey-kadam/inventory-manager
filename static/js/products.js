document.addEventListener('DOMContentLoaded', function() {
    // Initial page setup
    fetchInventoryStats();
    loadProducts();
    
    // Add event listeners
    document.getElementById('productSearch').addEventListener('input', debounce(function() {
        filterProducts();
    }, 300));
    
    document.getElementById('categoryFilter').addEventListener('change', function() {
        filterProducts();
    });
    
    document.getElementById('selectAll').addEventListener('change', function() {
        toggleSelectAll(this.checked);
    });
    
    document.querySelectorAll('.page-btn').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelector('.page-btn.active').classList.remove('active');
            this.classList.add('active');
            loadProducts();
        });
    });
    
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', function() {
            closeAllModals();
        });
    });
    
    document.getElementById('exportSelectedBtn').addEventListener('click', function() {
        exportSelected();
    });
    
    document.getElementById('printLabelsBtn').addEventListener('click', function() {
        printLabels();
    });
    
    document.getElementById('removeSelectedBtn').addEventListener('click', function() {
        removeSelected();
    });
    
    document.getElementById('editProductBtn').addEventListener('click', function() {
        editProduct();
    });
    
    document.getElementById('deleteProductBtn').addEventListener('click', function() {
        showDeleteConfirmation();
    });
    
    document.getElementById('cancelDeleteBtn').addEventListener('click', function() {
        closeModal('deleteConfirmModal');
    });
    
    document.getElementById('confirmDeleteBtn').addEventListener('click', function() {
        deleteProduct();
    });
    
    document.getElementById('closeNotification').addEventListener('click', function() {
        hideNotification();
    });
    
    // Sort functionality for table headers
    document.querySelectorAll('.product-table th i.fas.fa-sort').forEach(icon => {
        icon.addEventListener('click', function() {
            const column = this.parentElement.textContent.trim().toLowerCase();
            sortTable(column);
        });
    });
});

// Fetch inventory statistics
function fetchInventoryStats() {
    // In a real app, this would fetch from the server
    // Here, we'll simulate a server response
    fetch('/api/inventory/stats')
        .then(response => response.json())
        .then(data => {
            document.getElementById('totalProductsCount').textContent = data.totalProducts;
            document.getElementById('expiringSoonCount').textContent = data.expiringSoon;
            document.getElementById('lowStockCount').textContent = data.lowStock;
        })
        .catch(error => {
            console.error('Error fetching inventory stats:', error);
            // Fallback to sample data
            document.getElementById('totalProductsCount').textContent = 128;
            document.getElementById('expiringSoonCount').textContent = 15;
            document.getElementById('lowStockCount').textContent = 8;
        });
}

// Load products into the table
function loadProducts() {
    // In a real app, this would fetch from the server
    // Here, we'll use sample data
    const sampleProducts = [
        {
            id: 1, 
            name: 'Organic Milk', 
            category: 'dairy',
            quantity: 25, 
            price: 3.99, 
            expiryDate: '2025-04-15',
            sku: 'DY-MK-001',
            notes: 'Locally sourced, hormone-free',
            createdAt: '2025-03-20 08:45:32'
        },
        {
            id: 2, 
            name: 'Whole Wheat Bread', 
            category: 'bakery',
            quantity: 12, 
            price: 2.49, 
            expiryDate: '2025-04-05',
            sku: 'BK-BR-002',
            notes: 'Contains wheat, made fresh daily',
            createdAt: '2025-03-25 10:15:00'
        },
        {
            id: 3, 
            name: 'Granny Smith Apples', 
            category: 'produce',
            quantity: 50, 
            price: 1.29, 
            expiryDate: '2025-04-20',
            sku: 'PR-AP-003',
            notes: 'Organic, Washington grown',
            createdAt: '2025-03-22 13:30:45'
        },
        {
            id: 4, 
            name: 'Ground Beef', 
            category: 'meat',
            quantity: 8, 
            price: 5.99, 
            expiryDate: '2025-04-03',
            sku: 'MT-BF-004',
            notes: '85% lean, grass-fed',
            createdAt: '2025-03-30 15:20:10'
        },
        {
            id: 5, 
            name: 'Vanilla Ice Cream', 
            category: 'frozen',
            quantity: 15, 
            price: 4.49, 
            expiryDate: '2025-08-15',
            sku: 'FZ-IC-005',
            notes: 'Premium, made with real vanilla',
            createdAt: '2025-03-26 11:05:32'
        }
    ];
    
    renderProductTable(sampleProducts);
}

// Render products in the table
function renderProductTable(products) {
    const tableBody = document.getElementById('productTableBody');
    tableBody.innerHTML = '';
    
    if (products.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-table">No products found. Try adjusting your filters.</td>
            </tr>
        `;
        return;
    }
    
    products.forEach(product => {
        // Calculate status
        let status = 'ok';
        let statusText = 'In Stock';
        
        const today = new Date();
        const expiryDate = new Date(product.expiryDate);
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
            status = 'warning';
            statusText = 'Expiring Soon';
        } else if (daysUntilExpiry <= 0) {
            status = 'danger';
            statusText = 'Expired';
        } else if (product.quantity < 10) {
            status = 'warning';
            statusText = 'Low Stock';
        }
        
        const row = document.createElement('tr');
        row.setAttribute('data-product-id', product.id);
        
        row.innerHTML = `
            <td>
                <input type="checkbox" class="product-checkbox">
            </td>
            <td><span class="product-name" onclick="showProductDetails(${product.id})">${product.name}</span></td>
            <td><span class="category-badge">${capitalizeFirstLetter(product.category)}</span></td>
            <td>${product.quantity}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td>${formatDate(product.expiryDate)}</td>
            <td><span class="status-badge ${status}">${statusText}</span></td>
            <td class="action-buttons">
                <button class="icon-btn" onclick="showProductDetails(${product.id})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="icon-btn" onclick="editProductRedirect(${product.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="icon-btn delete" onclick="showDeleteConfirmation(${product.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Show product details in modal
function showProductDetails(productId) {
    // In a real app, this would fetch specific product details from the server
    // Here, we'll use sample data
    const productDetails = {
        id: productId,
        name: 'Organic Milk',
        category: 'Dairy',
        quantity: 25,
        price: 3.99,
        expiryDate: '2025-04-15',
        sku: 'DY-MK-001',
        notes: 'Locally sourced, hormone-free milk from certified organic farms.',
        createdAt: '2025-03-20 08:45:32'
    };
    
    document.getElementById('modalProductName').textContent = productDetails.name;
    document.getElementById('modalProductSKU').textContent = productDetails.sku || 'N/A';
    document.getElementById('modalProductCategory').textContent = productDetails.category;
    document.getElementById('modalProductQuantity').textContent = productDetails.quantity + ' units';
    document.getElementById('modalProductPrice').textContent = '$' + productDetails.price.toFixed(2);
    document.getElementById('modalProductExpiry').textContent = formatDate(productDetails.expiryDate);
    document.getElementById('modalProductNotes').textContent = productDetails.notes || 'No notes available';
    document.getElementById('modalProductAdded').textContent = formatDateTime(productDetails.createdAt);
    
    document.getElementById('editProductBtn').setAttribute('data-product-id', productId);
    document.getElementById('deleteProductBtn').setAttribute('data-product-id', productId);
    
    showModal('productModal');
}

// Show delete confirmation modal
function showDeleteConfirmation(productId) {
    // If productId is provided via click, use that
    // Otherwise use the one from the product details modal
    if (!productId) {
        productId = document.getElementById('deleteProductBtn').getAttribute('data-product-id');
    }
    
    // In a real app, fetch the product name from the server or cache
    // For this example, we'll use a placeholder or find it in the table
    let productName = 'this product';
    
    const tableRow = document.querySelector(`tr[data-product-id="${productId}"]`);
    if (tableRow) {
        productName = tableRow.querySelector('.product-name').textContent;
    }
    
    document.getElementById('deleteProductName').textContent = productName;
    document.getElementById('confirmDeleteBtn').setAttribute('data-product-id', productId);
    
    // Hide the product details modal if it's open
    closeModal('productModal');
    
    // Show the delete confirmation modal
    showModal('deleteConfirmModal');
}

// Delete product
function deleteProduct() {
    const productId = document.getElementById('confirmDeleteBtn').getAttribute('data-product-id');
    
    // In a real app, this would send a delete request to the server
    // Here, we'll simulate a successful deletion
    
    // Remove the product from the table
    const tableRow = document.querySelector(`tr[data-product-id="${productId}"]`);
    if (tableRow) {
        tableRow.remove();
    }
    
    // Close the modal
    closeModal('deleteConfirmModal');
    
    // Show success notification
    showNotification('Product deleted successfully!', 'success');
    
    // Update the inventory stats (in a real app, this would be handled by the server response)
    const totalProductsEl = document.getElementById('totalProductsCount');
    const currentTotal = parseInt(totalProductsEl.textContent);
    totalProductsEl.textContent = Math.max(0, currentTotal - 1);
}

// Edit product redirect
function editProductRedirect(productId) {
    // In a real app, this would redirect to the edit page
    // Here we'll just log and show a notification
    console.log('Redirecting to edit product page for product ID:', productId);
    window.location.href = `/edit-product/${productId}`;
}

// Edit product from modal
function editProduct() {
    const productId = document.getElementById('editProductBtn').getAttribute('data-product-id');
    closeModal('productModal');
    editProductRedirect(productId);
}

// Filter products based on search and category filter
function filterProducts() {
    const searchTerm = document.getElementById('productSearch').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value.toLowerCase();
    
    // In a real app, this would send filter params to the server
    // Here, we'll filter the sample data
    const sampleProducts = [
        {
            id: 1, 
            name: 'Organic Milk', 
            category: 'dairy',
            quantity: 25, 
            price: 3.99, 
            expiryDate: '2025-04-15'
        },
        {
            id: 2, 
            name: 'Whole Wheat Bread', 
            category: 'bakery',
            quantity: 12, 
            price: 2.49, 
            expiryDate: '2025-04-05'
        },
        {
            id: 3, 
            name: 'Granny Smith Apples', 
            category: 'produce',
            quantity: 50, 
            price: 1.29, 
            expiryDate: '2025-04-20'
        },
        {
            id: 4, 
            name: 'Ground Beef', 
            category: 'meat',
            quantity: 8, 
            price: 5.99, 
            expiryDate: '2025-04-03'
        },
        {
            id: 5, 
            name: 'Vanilla Ice Cream', 
            category: 'frozen',
            quantity: 15, 
            price: 4.49, 
            expiryDate: '2025-08-15'
        }
    ];
    
    const filteredProducts = sampleProducts.filter(product => {
        const matchesSearch = searchTerm === '' || 
            product.name.toLowerCase().includes(searchTerm) || 
            product.category.toLowerCase().includes(searchTerm);
        
        const matchesCategory = categoryFilter === '' || 
            product.category.toLowerCase() === categoryFilter;
        
        return matchesSearch && matchesCategory;
    });
    
    renderProductTable(filteredProducts);
}

// Toggle select all checkboxes
function toggleSelectAll(checked) {
    document.querySelectorAll('.product-checkbox').forEach(checkbox => {
        checkbox.checked = checked;
    });
}

// Export selected products
function exportSelected() {
    const selectedProducts = getSelectedProductIds();
    
    if (selectedProducts.length === 0) {
        showNotification('Please select at least one product to export.', 'warning');
        return;
    }
    
    // In a real app, this would trigger a download of selected products
    console.log('Exporting products:', selectedProducts);
    
    // Show success notification
    showNotification(`${selectedProducts.length} products exported successfully.`, 'success');
}

// Print labels for selected products
function printLabels() {
    const selectedProducts = getSelectedProductIds();
    
    if (selectedProducts.length === 0) {
        showNotification('Please select at least one product to print labels.', 'warning');
        return;
    }
    
    // In a real app, this would open a print dialog
    console.log('Printing labels for products:', selectedProducts);
    
    // Show success notification
    showNotification(`Preparing to print ${selectedProducts.length} labels.`, 'info');
}

// Remove selected products
function removeSelected() {
    const selectedProducts = getSelectedProductIds();
    
    if (selectedProducts.length === 0) {
        showNotification('Please select at least one product to remove.', 'warning');
        return;
    }
    
    // In a real app, this would show a confirmation dialog
    // and then send a bulk delete request to the server
    console.log('Removing products:', selectedProducts);
    
    // Remove selected rows from the table
    selectedProducts.forEach(productId => {
        const tableRow = document.querySelector(`tr[data-product-id="${productId}"]`);
        if (tableRow) {
            tableRow.remove();
        }
    });
    
    // Update the inventory stats (in a real app, this would be handled by the server response)
    const totalProductsEl = document.getElementById('totalProductsCount');
    const currentTotal = parseInt(totalProductsEl.textContent);
    totalProductsEl.textContent = Math.max(0, currentTotal - selectedProducts.length);
    
    // Show success notification
    showNotification(`${selectedProducts.length} products removed successfully.`, 'success');
}

// Get selected product IDs
function getSelectedProductIds() {
    const selectedProducts = [];
    
    document.querySelectorAll('.product-checkbox:checked').forEach(checkbox => {
        const row = checkbox.closest('tr');
        const productId = row.getAttribute('data-product-id');
        selectedProducts.push(productId);
    });
    
    return selectedProducts;
}

// Sort table by column
function sortTable(column) {
    const tableBody = document.getElementById('productTableBody');
    const rows = Array.from(tableBody.querySelectorAll('tr'));
    
    let columnIndex;
    switch (column) {
        case 'product name':
            columnIndex = 1;
            break;
        case 'quantity':
            columnIndex = 3;
            break;
        case 'price':
            columnIndex = 4;
            break;
        case 'expiry date':
            columnIndex = 5;
            break;
        default:
            return;
    }
    
    // Check current sort direction
    const currentDirection = tableBody.getAttribute('data-sort-dir') || 'asc';
    const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
    
    // Sort the rows
    rows.sort((a, b) => {
        let aValue = a.cells[columnIndex].textContent.trim();
        let bValue = b.cells[columnIndex].textContent.trim();
        
        // Handle numeric or date values
        if (column === 'quantity') {
            aValue = parseInt(aValue);
            bValue = parseInt(bValue);
        } else if (column === 'price') {
            aValue = parseFloat(aValue.replace('$', ''));
            bValue = parseFloat(bValue.replace('$', ''));
        } else if (column === 'expiry date') {
            aValue = new Date(aValue);
            bValue = new Date(bValue);
        }
        
        // Compare values
        if (aValue < bValue) {
            return newDirection === 'asc' ? -1 : 1;
        } else if (aValue > bValue) {
            return newDirection === 'asc' ? 1 : -1;
        }
        return 0;
    });
    
    // Update the table with sorted rows
    rows.forEach(row => tableBody.appendChild(row));
    
    // Update sort direction attribute
    tableBody.setAttribute('data-sort-dir', newDirection);
    
    // Update sort indicators in table headers
    document.querySelectorAll('.product-table th i.fas.fa-sort').forEach(icon => {
        icon.className = 'fas fa-sort';
    });
    
    const headerCell = document.querySelector(`.product-table th:nth-child(${columnIndex + 1}) i`);
    if (headerCell) {
        headerCell.className = `fas fa-sort-${newDirection === 'asc' ? 'up' : 'down'}`;
    }
}

// Show modal
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.classList.add('modal-open');
    }
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
    }
}

// Close all modals
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.classList.remove('modal-open');
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notificationMessage');
    const notificationIcon = notification.querySelector('.notification-icon');
    
    // Set message
    notificationMessage.textContent = message;
    
    // Remove all type classes
    notification.classList.remove('success', 'warning', 'danger', 'info');
    
    // Add appropriate type class
    notification.classList.add(type);
    
    // Set appropriate icon
    switch (type) {
        case 'success':
            notificationIcon.className = 'notification-icon fas fa-check-circle';
            break;
        case 'warning':
            notificationIcon.className = 'notification-icon fas fa-exclamation-triangle';
            break;
        case 'danger':
            notificationIcon.className = 'notification-icon fas fa-times-circle';
            break;
        default:
            notificationIcon.className = 'notification-icon fas fa-info-circle';
    }
    
    // Show notification
    notification.classList.add('active');
    
    // Auto-hide after 5 seconds
    setTimeout(hideNotification, 5000);
}

// Hide notification
function hideNotification() {
    const notification = document.getElementById('notification');
    notification.classList.remove('active');
}

// Helper functions
function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Make functions available to inline event handlers
window.showProductDetails = showProductDetails;
window.editProductRedirect = editProductRedirect;
window.showDeleteConfirmation = showDeleteConfirmation;