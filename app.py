from flask import Flask, render_template, request, redirect, url_for, session, jsonify, flash
import sqlite3
from datetime import datetime, timedelta
import os
import random

app = Flask(__name__)
app.secret_key = 'yatrasetu_secret_key_2024'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)

# Test page
@app.route('/test-find-ride')
def test_find_ride():
    return render_template('test-find-ride.html')

# Database connection
def get_db_connection():
    conn = sqlite3.connect('yatrasetu.db')
    conn.row_factory = sqlite3.Row
    return conn

# Initialize database
def init_db():
    print("🔄 Initializing database...")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Users table
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
    
    # Rides table
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
    
    # Bookings table
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
    
    # SOS alerts table
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

    # Sample data
    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]
    if user_count == 0:
        sample_users = [
            ('Prasad Sharma', 'prasad@example.com', 'password123', '9876543210', 'driver'),
            ('Siddhesh Patil', 'siddhesh@example.com', 'password123', '9876543211', 'passenger'),
            ('Pranit Deshmukh', 'pranit@example.com', 'password123', '9876543212', 'driver'),
            ('Sudin More', 'sudin@example.com', 'password123', '9876543213', 'passenger'),
            ('Tejas Jadhav', 'tejas@example.com', 'password123', '9876543214', 'driver'),
            ('Pranav Kulkarni', 'pranav@example.com', 'password123', '9876543215', 'passenger'),
            ('Admin User', 'admin@yatrasetu.com', 'admin123', '9876543216', 'admin')
        ]
        cursor.executemany('''
            INSERT INTO users (name, email, password, phone, user_type)
            VALUES (?, ?, ?, ?, ?)
        ''', sample_users)
        
        sample_rides = [
            (1, 'car', 'Nashik', 'Delhi', '2024-01-20 08:00:00', '2024-01-20 20:00:00', 
             'SUV', 'MH15AB1234', 4, 500.00, 'Comfortable AC SUV with music system', '9876543210'),
            (3, 'bike', 'Sangamner', 'Pune', '2024-01-21 07:00:00', '2024-01-21 12:00:00',
             'Motorcycle', 'MH12CD5678', 1, 200.00, 'Safe rider with helmet', '9876543212'),
            (5, 'logistics', 'Pune', 'Mumbai', '2024-01-22 09:00:00', '2024-01-22 14:00:00',
             'Tempo', 'MH14EF9012', 500, 50.00, 'Goods transport with care', '9876543214')
        ]
        cursor.executemany('''
            INSERT INTO rides (user_id, ride_type, source_city, destination_city, departure_time, 
                               arrival_time, vehicle_type, vehicle_number, available_capacity, 
                               price_per_unit, additional_info, contact_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', sample_rides)
    
    conn.commit()
    conn.close()
    print("🎉 Database initialization complete!")

def check_database():
    if not os.path.exists('yatrasetu.db'):
        init_db()
        return
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT 1 FROM users LIMIT 1")
        cursor.execute("SELECT 1 FROM rides LIMIT 1")
        cursor.execute("SELECT 1 FROM bookings LIMIT 1")
        cursor.execute("SELECT 1 FROM sos_alerts LIMIT 1")
    except sqlite3.OperationalError:
        init_db()
    finally:
        conn.close()

# ------------------ ROUTES ------------------
@app.route('/')
def index():
    user_stats = {}
    if 'user_id' in session:
        conn = get_db_connection()
        try:
            user_stats['active_rides'] = conn.execute(
                'SELECT COUNT(*) FROM rides WHERE user_id = ? AND status = "active"',
                (session['user_id'],)
            ).fetchone()[0]
            user_stats['total_bookings'] = conn.execute(
                'SELECT COUNT(*) FROM bookings WHERE passenger_id = ?',
                (session['user_id'],)
            ).fetchone()[0]
            user_stats['rating'] = conn.execute(
                'SELECT rating FROM users WHERE id = ?',
                (session['user_id'],)
            ).fetchone()[0]
            join_date = conn.execute(
                'SELECT member_since FROM users WHERE id = ?',
                (session['user_id'],)
            ).fetchone()[0]
            if join_date:
                join_date = datetime.strptime(join_date, '%Y-%m-%d %H:%M:%S')
                user_stats['days_joined'] = (datetime.now() - join_date).days
            else:
                user_stats['days_joined'] = 1
        except sqlite3.OperationalError:
            user_stats = {'active_rides': 0, 'total_bookings': 0, 'rating': 5.0, 'days_joined': 1}
        finally:
            conn.close()
    return render_template('index.html', user_stats=user_stats)

@app.route('/find-ride')
def find_ride():
    return render_template('find_ride.html')

@app.route('/post-ride')
def post_ride():
    if 'user_id' not in session:
        flash('Please login to post a ride', 'warning')
        return redirect(url_for('login'))
    return render_template('post_ride.html')

# ------------------ SEARCH RIDES API (FIXED) ------------------
@app.route('/api/search-rides')
def api_search_rides():
    source = request.args.get('from', '').strip().lower()
    destination = request.args.get('to', '').strip().lower()
    travel_date = request.args.get('date', '')
    
    conn = get_db_connection()
    try:
        query = '''
            SELECT r.*, u.name as driver_name, u.rating, u.total_rides
            FROM rides r
            JOIN users u ON r.user_id = u.id
            WHERE r.status = "active"
        '''
        params = []
        if source:
            query += ' AND LOWER(r.source_city) LIKE ?'
            params.append(f'%{source}%')
        if destination:
            query += ' AND LOWER(r.destination_city) LIKE ?'
            params.append(f'%{destination}%')
        if travel_date:
            query += ' AND DATE(r.departure_time) = ?'
            params.append(travel_date)
        query += ' ORDER BY r.departure_time ASC'
        
        rides = conn.execute(query, params).fetchall()
        rides_list = []
        for ride in rides:
            ride_dict = dict(ride)
            ride_dict['rating'] = ride_dict.get('rating', 4.5)
            ride_dict['total_rides'] = ride_dict.get('total_rides', random.randint(5, 50))
            rides_list.append(ride_dict)
        return jsonify(rides_list)
    except sqlite3.OperationalError:
        return jsonify([])
    finally:
        conn.close()

# ------------------ OTHER ROUTES ------------------
# ... Keep all other routes (login, register, post ride, book ride, profile, sos) unchanged ...

if __name__ == '__main__':
    os.makedirs('static/uploads', exist_ok=True)
    os.makedirs('invoices', exist_ok=True)
    check_database()
    app.run(debug=True, host='0.0.0.0', port=5000)
