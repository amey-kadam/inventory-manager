from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_migrate import Migrate
from datetime import datetime, timedelta
import os
from config import config
from models import db, Product, Activity

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)
    
    # Sample data for dashboard - in a real app, this would be calculated from the database
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
        with app.app_context():
            total_products = Product.query.count()
            today = datetime.utcnow().date()
            week_from_now = today + timedelta(days=7)
            expiring_soon = Product.query.filter(
                Product.expiry_date.between(today, week_from_now)
            ).count()
            
            # Low stock threshold (example: less than 10)
            low_stock = Product.query.filter(Product.quantity < 10).count()
            
            inventory_stats = {
                "totalProducts": total_products,
                "expiringSoon": expiring_soon,
                "lowStock": low_stock
            }
            
            return jsonify(inventory_stats)

    @app.route('/api/activity/recent')
    def get_recent_activity():
        with app.app_context():
            recent_activities = Activity.query.order_by(
                Activity.created_at.desc()
            ).limit(10).all()
            
            return jsonify({
                "activities": [activity.to_dict() for activity in recent_activities]
            })

    @app.route('/api/products/search')
    def search_products():
        query = request.args.get('q', '')
        
        if not query:
            return jsonify({"results": []})
        
        # Search for products that match the query
        products = Product.query.filter(
            Product.name.ilike(f'%{query}%') | 
            Product.sku.ilike(f'%{query}%')
        ).limit(10).all()
        
        return jsonify({
            "results": [product.to_dict() for product in products]
        })

    # Form submission routes
    @app.route('/submit-manual', methods=['POST'])
    def submit_manual():
        try:
            data = request.json
            
            # Create new product
            new_product = Product(
                name=data.get('name'),
                sku=data.get('sku') if data.get('sku') else None,
                category=data.get('category'),
                quantity=data.get('quantity', 1),
                price=data.get('price', 0.0),
                expiry_date=datetime.strptime(data.get('expiryDate'), '%Y-%m-%d').date(),
                notes=data.get('notes'),
                is_multi_pack=data.get('isMultiPack', False)
            )
            
            db.session.add(new_product)
            
            # Create activity log
            activity = Activity(
                type="addition",
                title="Added Inventory",
                description=f"{new_product.quantity} units of {new_product.name} added"
            )
            
            db.session.add(activity)
            db.session.commit()
            
            return jsonify({
                "success": True, 
                "message": f"{new_product.name} added successfully"
            })
            
        except Exception as e:
            db.session.rollback()
            return jsonify({
                "success": False, 
                "message": f"Error adding product: {str(e)}"
            })

    @app.route('/submit-bulk', methods=['POST'])
    def submit_bulk():
        try:
            data = request.json
            products = data.get('products', [])
            
            added_count = 0
            added_names = []
            
            for product_data in products:
                # Create new product for each entry
                new_product = Product(
                    name=product_data.get('name'),
                    category=product_data.get('category'),
                    quantity=product_data.get('quantity', 1),
                    price=product_data.get('price', 0.0),
                    expiry_date=datetime.strptime(product_data.get('expiryDate'), '%Y-%m-%d').date()
                )
                
                db.session.add(new_product)
                added_count += 1
                added_names.append(new_product.name)
            
            # Create activity log for the bulk addition
            activity = Activity(
                type="addition",
                title="Bulk Addition",
                description=f"{added_count} products added: {', '.join(added_names[:3])}{'...' if len(added_names) > 3 else ''}"
            )
            
            db.session.add(activity)
            db.session.commit()
            
            return jsonify({
                "success": True, 
                "message": f"{added_count} products added successfully"
            })
            
        except Exception as e:
            db.session.rollback()
            return jsonify({
                "success": False, 
                "message": f"Error adding products: {str(e)}"
            })

    return app

if __name__ == '__main__':
    app = create_app(os.getenv('FLASK_CONFIG') or 'default')
    app.run(debug=True)