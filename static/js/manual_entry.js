document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const manualTab = document.getElementById('manualTab');
    const bulkTab = document.getElementById('bulkTab');
    const manualForm = document.getElementById('manualForm');
    const bulkForm = document.getElementById('bulkForm');

    manualTab.addEventListener('click', function() {
        manualTab.classList.add('active');
        bulkTab.classList.remove('active');
        manualForm.classList.add('active');
        bulkForm.classList.remove('active');
    });

    bulkTab.addEventListener('click', function() {
        bulkTab.classList.add('active');
        manualTab.classList.remove('active');
        bulkForm.classList.add('active');
        manualForm.classList.remove('active');
    });

    // Set default expiry date (current date plus 7 days)
    const setDefaultExpiryDate = () => {
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        
        const defaultDate = nextWeek.toISOString().split('T')[0];
        document.getElementById('productExpiryDate').value = defaultDate;
        
        // Also set for any existing bulk entries
        const expiryInputs = document.querySelectorAll('input[name="expiry[]"]');
        expiryInputs.forEach(input => {
            if (!input.value) {
                input.value = defaultDate;
            }
        });
    };
    
    setDefaultExpiryDate();

    // Manual entry form submission
    const singleProductForm = document.getElementById('singleProductForm');
    singleProductForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const productData = {
            name: document.getElementById('productName').value,
            sku: document.getElementById('productSKU').value,
            category: document.getElementById('productCategory').value,
            quantity: parseInt(document.getElementById('productQuantity').value),
            price: parseFloat(document.getElementById('productPrice').value),
            expiryDate: document.getElementById('productExpiryDate').value,
            notes: document.getElementById('productNotes').value,
            isMultiPack: document.getElementById('isMultiPack').checked
        };
        
        submitManualEntry(productData);
    });

    // Bulk entry functionality
    const bulkProductForm = document.getElementById('bulkProductForm');
    const addRowBtn = document.getElementById('addRowBtn');
    const clearBulkBtn = document.getElementById('clearBulkBtn');
    const importCSVBtn = document.getElementById('importCSVBtn');
    const csvFileInput = document.getElementById('csvFileInput');
    const bulkEntryTable = document.getElementById('bulkEntryTable').querySelector('tbody');

    // Add new row to bulk entry table
    addRowBtn.addEventListener('click', function() {
        addNewBulkRow();
    });

    // Clear all rows in bulk entry
    clearBulkBtn.addEventListener('click', function() {
        clearBulkTable();
        addNewBulkRow(); // Add a single empty row
    });

    // Import CSV handler
    importCSVBtn.addEventListener('click', function() {
        csvFileInput.click();
    });

    csvFileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                processCSV(event.target.result);
            };
            reader.readAsText(file);
        }
    });

    // Process CSV data
    function processCSV(csvData) {
        const rows = csvData.split('\n');
        const headers = rows[0].split(',').map(header => header.trim().toLowerCase());
        
        // Check required headers
        const requiredHeaders = ['name', 'quantity', 'price', 'expiry'];
        const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
        
        if (missingHeaders.length > 0) {
            showNotification(`CSV missing required columns: ${missingHeaders.join(', ')}`, 'error');
            return;
        }
        
        // Clear existing table
        clearBulkTable();
        
        // Add rows from CSV
        for (let i = 1; i < rows.length; i++) {
            if (rows[i].trim() === '') continue;
            
            const values = rows[i].split(',').map(val => val.trim());
            if (values.length !== headers.length) {
                showNotification(`Row ${i} has incorrect number of columns`, 'error');
                continue;
            }
            
            const rowData = {};
            headers.forEach((header, index) => {
                rowData[header] = values[index];
            });
            
            addNewBulkRow(rowData);
        }
        
        showNotification('CSV data imported successfully', 'success');
    }

    // Add a new row to the bulk entry table
    function addNewBulkRow(data = null) {
        const row = document.createElement('tr');
        
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 7);
        const defaultExpiryDate = defaultDate.toISOString().split('T')[0];
        
        row.innerHTML = `
            <td><input type="text" name="name[]" required value="${data ? data.name : ''}"></td>
            <td>
                <select name="category[]">
                    <option value="">Select</option>
                    <option value="dairy" ${data && data.category === 'dairy' ? 'selected' : ''}>Dairy</option>
                    <option value="bakery" ${data && data.category === 'bakery' ? 'selected' : ''}>Bakery</option>
                    <option value="produce" ${data && data.category === 'produce' ? 'selected' : ''}>Produce</option>
                    <option value="meat" ${data && data.category === 'meat' ? 'selected' : ''}>Meat</option>
                    <option value="frozen" ${data && data.category === 'frozen' ? 'selected' : ''}>Frozen</option>
                    <option value="beverages" ${data && data.category === 'beverages' ? 'selected' : ''}>Beverages</option>
                    <option value="snacks" ${data && data.category === 'snacks' ? 'selected' : ''}>Snacks</option>
                    <option value="other" ${data && data.category === 'other' ? 'selected' : ''}>Other</option>
                </select>
            </td>
            <td><input type="number" name="quantity[]" min="1" value="${data ? data.quantity : '1'}" required></td>
            <td><input type="number" name="price[]" step="0.01" min="0" value="${data ? data.price : ''}" required></td>
            <td><input type="date" name="expiry[]" value="${data ? data.expiry : defaultExpiryDate}" required></td>
            <td class="action-cell">
                <button type="button" class="icon-btn delete-row"><i class="fas fa-trash"></i></button>
            </td>
        `;
        
        bulkEntryTable.appendChild(row);
        
        // Add event listener to the new delete button
        row.querySelector('.delete-row').addEventListener('click', function() {
            if (bulkEntryTable.children.length > 1) {
                row.remove();
            } else {
                showNotification('At least one row is required', 'error');
            }
        });
    }

    // Clear all rows from bulk entry table
    function clearBulkTable() {
        while (bulkEntryTable.firstChild) {
            bulkEntryTable.removeChild(bulkEntryTable.firstChild);
        }
    }

    // Initialize delete row buttons
    document.querySelectorAll('.delete-row').forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            if (bulkEntryTable.children.length > 1) {
                row.remove();
            } else {
                showNotification('At least one row is required', 'error');
            }
        });
    });

    // Bulk form submission
    bulkProductForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const nameInputs = document.querySelectorAll('input[name="name[]"]');
        const categorySelects = document.querySelectorAll('select[name="category[]"]');
        const quantityInputs = document.querySelectorAll('input[name="quantity[]"]');
        const priceInputs = document.querySelectorAll('input[name="price[]"]');
        const expiryInputs = document.querySelectorAll('input[name="expiry[]"]');
        
        const products = [];
        
        for (let i = 0; i < nameInputs.length; i++) {
            products.push({
                name: nameInputs[i].value,
                category: categorySelects[i].value,
                quantity: parseInt(quantityInputs[i].value),
                price: parseFloat(priceInputs[i].value),
                expiryDate: expiryInputs[i].value
            });
        }
        
        submitBulkEntry(products);
    });

    // Submit manual entry to server
    function submitManualEntry(productData) {
        fetch('/submit-manual', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification(data.message, 'success');
                singleProductForm.reset();
                setDefaultExpiryDate();
            } else {
                showNotification(data.message || 'An error occurred', 'error');
            }
        })
        .catch(error => {
            showNotification('Failed to add product: ' + error.message, 'error');
        });
    }

    // Submit bulk entry to server
    function submitBulkEntry(productsData) {
        fetch('/submit-bulk', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ products: productsData })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification(data.message, 'success');
                clearBulkTable();
                addNewBulkRow();
            } else {
                showNotification(data.message || 'An error occurred', 'error');
            }
        })
        .catch(error => {
            showNotification('Failed to add products: ' + error.message, 'error');
        });
    }

    // Notification system
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notificationMessage');
    const closeNotification = document.getElementById('closeNotification');

    function showNotification(message, type) {
        notificationMessage.textContent = message;
        notification.className = 'notification show ' + type;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            hideNotification();
        }, 5000);
    }

    function hideNotification() {
        notification.classList.remove('show');
    }

    closeNotification.addEventListener('click', hideNotification);
});