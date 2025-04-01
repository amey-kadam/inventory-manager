document.addEventListener('DOMContentLoaded', function() {
    // Set current date
    const dateElement = document.getElementById('currentDate');
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = today.toLocaleDateString('en-US', options);
    
    // Fetch inventory data
    fetchInventoryData();
    
    // Fetch recent activity
    fetchRecentActivity();
});

async function fetchInventoryData() {
    try {
        // This would be replaced with an actual API call
        const response = await fetch('/api/inventory/stats');
        const data = await response.json();
        
        // Update stats
        document.getElementById('totalProducts').textContent = data.totalProducts || 0;
        document.getElementById('expiringSoon').textContent = data.expiringSoon || 0;
        document.getElementById('lowStock').textContent = data.lowStock || 0;
    } catch (error) {
        console.error('Error fetching inventory data:', error);
        // Use sample data for demonstration
        document.getElementById('totalProducts').textContent = '258';
        document.getElementById('expiringSoon').textContent = '15';
        document.getElementById('lowStock').textContent = '8';
    }
}

async function fetchRecentActivity() {
    try {
        // This would be replaced with an actual API call
        const response = await fetch('/api/activity/recent');
        const data = await response.json();
        
        // Update activity list
        updateActivityList(data.activities);
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        // Leave the sample data in the HTML for demonstration
    }
}

function updateActivityList(activities) {
    if (!activities || activities.length === 0) return;
    
    const activityList = document.getElementById('recentActivity');
    activityList.innerHTML = '';
    
    activities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        let iconClass = 'add';
        let iconType = 'fas fa-plus';
        
        if (activity.type === 'removal') {
            iconClass = 'remove';
            iconType = 'fas fa-minus';
        } else if (activity.type === 'alert') {
            iconClass = 'warning';
            iconType = 'fas fa-exclamation-triangle';
        }
        
        activityItem.innerHTML = `
            <div class="activity-icon ${iconClass}">
                <i class="${iconType}"></i>
            </div>
            <div class="activity-details">
                <p class="activity-title">${activity.title}</p>
                <p class="activity-desc">${activity.description}</p>
                <p class="activity-time">${activity.time}</p>
            </div>
        `;
        
        activityList.appendChild(activityItem);
    });
}