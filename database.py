import sqlite3
import os

def init_db():
    """Initialize the database with required tables"""
    print("🔄 Initializing database...")
    conn = sqlite3.connect('yatrasetu.db')
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            phone TEXT,
            user_type TEXT DEFAULT 'passenger',
            profile_image TEXT,
            rating REAL DEFAULT 5.0,
            total_rides INTEGER DEFAULT 0,
            member_since TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create rides table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS rides (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            ride_type TEXT NOT NULL,
            source_city TEXT NOT NULL,
            destination_city TEXT NOT NULL,
            departure_time TIMESTAMP NOT NULL,
            arrival_time TIMESTAMP,
            vehicle_type TEXT NOT NULL,
            vehicle_number TEXT NOT NULL,
            available_capacity INTEGER NOT NULL,
            price_per_unit DECIMAL(10,2) NOT NULL,
            additional_info TEXT,
            contact_number TEXT NOT NULL,
            preferred_language TEXT DEFAULT 'hindi',
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Create bookings table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ride_id INTEGER NOT NULL,
            passenger_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            total_amount DECIMAL(10,2) NOT NULL,
            status TEXT DEFAULT 'confirmed',
            booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ride_id) REFERENCES rides (id),
            FOREIGN KEY (passenger_id) REFERENCES users (id)
        )
    ''')
    
    # Create SOS alerts table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sos_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            latitude REAL,
            longitude REAL,
            address TEXT,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Check if we need to add sample data
    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]
    
    if user_count == 0:
        print("📝 Adding sample data...")
        sample_users = [
            ('Prasad Sharma', 'prasad@example.com', 'password123', '9876543210', 'driver'),
            ('Siddhesh Patil', 'siddhesh@example.com', 'password123', '9876543211', 'passenger'),
            ('Admin User', 'admin@yatrasetu.com', 'admin123', '9876543216', 'admin')
        ]
        
        cursor.executemany('''
            INSERT INTO users (name, email, password, phone, user_type)
            VALUES (?, ?, ?, ?, ?)
        ''', sample_users)
        
        print("✅ Sample users added!")
    
    conn.commit()
    conn.close()
    print("🎉 Database initialization complete!")

if __name__ == '__main__':
    # Delete existing database if it exists
    if os.path.exists('yatrasetu.db'):
        os.remove('yatrasetu.db')
        print("🗑️ Removed old database")
    
    # Create necessary folders
    os.makedirs('static/uploads', exist_ok=True)
    os.makedirs('invoices', exist_ok=True)
    
    # Initialize database
    init_db()