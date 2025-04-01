from flask import Flask, render_template, request, jsonify, redirect, url_for
import os
from datetime import datetime

app = Flask(__name__)

# Sample data - in a real app, this would come from a database
inventory_stats = {
    "totalProducts": 258,
    "expiringSoon": 15,
    "lowStock": 8
}

recent_activities = [
    {
        "type": "addition",
        "title": "Added Inventory",
        "description": "40 units of Milk added",
        "time": "10 minutes ago"
    },
    {
        "type": "removal",
        "title": "Checkout Sale",
        "description": "5 units of Bread sold",
        "time": "15 minutes ago"
    },
    {
        "type": "alert",
        "title": "Expiry Alert",
        "description": "10 units of Yogurt expiring tomorrow",
        "time": "20 minutes ago"
    }
]

# Routes for main pages
@app.route('/')
def index():
    return redirect(url_for('home'))

@app.route('/home')
def home():
    return render_template('home.html')

@app.route('/products')
def products():
    return render_template('products.html')

@app.route('/reports')
def reports():
    return render_template('reports.html')

@app.route('/settings')
def settings():
    return render_template('settings.html')

# Routes for entry methods
@app.route('/manual-entry')
def manual_entry():
    return render_template('manual_entry.html')

@app.route('/bulk-entry')
def bulk_entry():
    return render_template('bulk_entry.html')

@app.route('/barcode-scanner')
def barcode_scanner():
    return render_template('barcode_scanner.html')

@app.route('/ocr-scanner')
def ocr_scanner():
    return render_template('ocr_scanner.html')

# API Routes
@app.route('/api/inventory/stats')
def get_inventory_stats():
    return jsonify(inventory_stats)

@app.route('/api/activity/recent')
def get_recent_activity():
    return jsonify({"activities": recent_activities})

@app.route('/api/products/search')
def search_products():
    query = request.args.get('q', '')
    # In a real app, you would search your database here
    return jsonify({"results": []})

# Form submission routes
@app.route('/submit-manual', methods=['POST'])
def submit_manual():
    # Process manual entry form data
    # In a real app, you would save to a database
    return jsonify({"success": True, "message": "Product added successfully"})

@app.route('/submit-bulk', methods=['POST'])
def submit_bulk():
    # Process bulk entry form data
    return jsonify({"success": True, "message": "Bulk products added successfully"})

@app.route('/submit-barcode', methods=['POST'])
def submit_barcode():
    # Process barcode scan data
    return jsonify({"success": True, "message": "Barcode product added successfully"})

@app.route('/submit-ocr', methods=['POST'])
def submit_ocr():
    # Process OCR scan data
    return jsonify({"success": True, "message": "OCR product added successfully"})

if __name__ == '__main__':
    app.run(debug=True)