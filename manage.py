import os
from flask_script import Manager
from flask_migrate import Migrate, MigrateCommand
from app import create_app, db
from models import Product, Activity

app = create_app(os.getenv('FLASK_CONFIG') or 'default')
migrate = Migrate(app, db)
manager = Manager(app)

manager.add_command('db', MigrateCommand)

@manager.command
def seed():
    """Seed the database with sample data"""
    from datetime import datetime, timedelta
    
    # Clear existing data
    db.session.query(Activity).delete()
    db.session.query(Product).delete()
    
    # Create sample products
    today = datetime.utcnow().date()
    products = [
        Product(
            name="Milk",
            sku="MILK001",
            category="dairy",
            quantity=40,
            price=3.99,
            expiry_date=today + timedelta(days=10),
            notes="Organic whole milk"
        ),
        Product(
            name="Bread",
            sku="BREAD001",
            category="bakery",
            quantity=20,
            price=2.49,
            expiry_date=today + timedelta(days=5),
            notes="Whole wheat bread"
        ),
        Product(
            name="Yogurt",
            sku="YOGURT001",
            category="dairy",
            quantity=30,
            price=1.99,
            expiry_date=today + timedelta(days=1),
            notes="Greek yogurt"
        )
    ]
    
    for product in products:
        db.session.add(product)
    
    # Create sample activities
    activities = [
        Activity(
            type="addition",
            title="Added Inventory",
            description="40 units of Milk added",
            created_at=datetime.utcnow() - timedelta(minutes=10)
        ),
        Activity(
            type="removal",
            title="Checkout Sale",
            description="5 units of Bread sold",
            created_at=datetime.utcnow() - timedelta(minutes=15)
        ),
        Activity(
            type="alert",
            title="Expiry Alert",
            description="10 units of Yogurt expiring tomorrow",
            created_at=datetime.utcnow() - timedelta(minutes=20)
        )
    ]
    
    for activity in activities:
        db.session.add(activity)
    
    db.session.commit()
    print("Database seeded successfully!")

if __name__ == '__main__':
    manager.run()