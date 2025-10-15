from flask import Flask, render_template, request, redirect, url_for, session, jsonify, flash
import sqlite3
from datetime import datetime, timedelta
import os
import random

app = Flask(__name__)
app.secret_key = 'yatrasetu_secret_key_2024'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)
# //test
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
    print("✅ Created users table")
    
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
    print("✅ Created rides table")
    
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
    print("✅ Created bookings table")
    
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
    print("✅ Created sos_alerts table")
    
    # Check if we need to add sample data
    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]
    
    if user_count == 0:
        print("📝 Adding sample data...")
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
        
        # Create sample rides
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
        
        print("✅ Sample data added successfully!")
    
    conn.commit()
    conn.close()
    print("🎉 Database initialization complete!")

# Check and initialize database
def check_database():
    if not os.path.exists('yatrasetu.db'):
        print("🆕 Creating new database...")
        init_db()
        return
    
    # Check if all tables exist
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT 1 FROM users LIMIT 1")
        cursor.execute("SELECT 1 FROM rides LIMIT 1")
        cursor.execute("SELECT 1 FROM bookings LIMIT 1")
        cursor.execute("SELECT 1 FROM sos_alerts LIMIT 1")
        print("✅ All database tables exist")
    except sqlite3.OperationalError as e:
        print(f"🔄 Recreating missing tables: {e}")
        init_db()
    finally:
        conn.close()

# Routes
@app.route('/')
def index():
    user_stats = {}
    if 'user_id' in session:
        conn = get_db_connection()
        
        try:
            # Get user stats
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
            
            # Calculate days since joining
            join_date = conn.execute(
                'SELECT member_since FROM users WHERE id = ?',
                (session['user_id'],)
            ).fetchone()[0]
            if join_date:
                join_date = datetime.strptime(join_date, '%Y-%m-%d %H:%M:%S')
                user_stats['days_joined'] = (datetime.now() - join_date).days
            else:
                user_stats['days_joined'] = 1
                
        except sqlite3.OperationalError as e:
            print(f"Database error: {e}")
            user_stats = {'active_rides': 0, 'total_bookings': 0, 'rating': 5.0, 'days_joined': 1}
        finally:
            conn.close()
    
    return render_template('index.html', user_stats=user_stats)

@app.route('/find-ride')
def find_ride():
    return render_template('find_ride.html')


@app.route('/booking/<int:ride_id>')
def booking(ride_id):
    # Ensure user is logged in to book
    if 'user_id' not in session:
        flash('Please login to book a ride', 'warning')
        return redirect(url_for('login'))

    conn = get_db_connection()
    ride = conn.execute(
        'SELECT r.*, u.name as driver_name, u.phone as driver_phone FROM rides r JOIN users u ON r.user_id = u.id WHERE r.id = ?',
        (ride_id,)
    ).fetchone()
    conn.close()

    if not ride:
        flash('Ride not found or may have been removed', 'error')
        return redirect(url_for('find_ride'))

    # Convert to dict for easier use in template
    ride_dict = dict(ride)

    return render_template('booking.html', ride=ride_dict)

@app.route('/post-ride')
def post_ride():
    if 'user_id' not in session:
        flash('Please login to post a ride', 'warning')
        return redirect(url_for('login'))
    return render_template('post_ride.html')

@app.route('/my-rides')
def my_rides():
    if 'user_id' not in session:
        flash('Please login to view your rides', 'warning')
        return redirect(url_for('login'))
    
    conn = get_db_connection()
    try:
        rides = conn.execute('''
            SELECT r.*, COUNT(b.id) as bookings_count
            FROM rides r 
            LEFT JOIN bookings b ON r.id = b.ride_id 
            WHERE r.user_id = ? 
            GROUP BY r.id 
            ORDER BY r.created_at DESC
        ''', (session['user_id'],)).fetchall()
    except sqlite3.OperationalError:
        rides = []
    finally:
        conn.close()
    
    return render_template('my_rides.html', rides=rides)

@app.route('/my-bookings')
def my_bookings():
    if 'user_id' not in session:
        flash('Please login to view your bookings', 'warning')
        return redirect(url_for('login'))
    
    conn = get_db_connection()
    try:
        bookings = conn.execute('''
            SELECT b.*, r.*, u.name as driver_name
            FROM bookings b
            JOIN rides r ON b.ride_id = r.id
            JOIN users u ON r.user_id = u.id
            WHERE b.passenger_id = ?
            ORDER BY b.booked_at DESC
        ''', (session['user_id'],)).fetchall()
    except sqlite3.OperationalError:
        bookings = []
    finally:
        conn.close()
    
    return render_template('my_bookings.html', bookings=bookings)

@app.route('/profile')
def profile():
    if 'user_id' not in session:
        flash('Please login to view your profile', 'warning')
        return redirect(url_for('login'))
    
    conn = get_db_connection()
    user = conn.execute(
        'SELECT * FROM users WHERE id = ?', 
        (session['user_id'],)
    ).fetchone()
    conn.close()
    
    return render_template('profile.html', user=user)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        
        conn = get_db_connection()
        user = conn.execute(
            'SELECT * FROM users WHERE email = ? AND password = ?',
            (email, password)
        ).fetchone()
        conn.close()
        
        if user:
            session['user_id'] = user['id']
            session['user_name'] = user['name']
            session['user_email'] = user['email']
            session['user_type'] = user['user_type']
            session['user_phone'] = user['phone']
            
            flash(f'Welcome back, {user["name"]}!', 'success')
            return redirect(url_for('index'))
        else:
            flash('Invalid email or password', 'error')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        phone = request.form['phone']
        password = request.form['password']
        user_type = request.form.get('user_type', 'passenger')
        
        try:
            conn = get_db_connection()
            
            # Check if email already exists
            existing_user = conn.execute(
                'SELECT id FROM users WHERE email = ?', 
                (email,)
            ).fetchone()
            
            if existing_user:
                flash('Email already exists. Please use a different email.', 'error')
                return render_template('register.html')
            
            # Insert new user
            cursor = conn.cursor()
            cursor.execute(
                'INSERT INTO users (name, email, phone, password, user_type) VALUES (?, ?, ?, ?, ?)',
                (name, email, phone, password, user_type)
            )
            conn.commit()
            
            # Get the new user
            user = conn.execute(
                'SELECT * FROM users WHERE email = ?', 
                (email,)
            ).fetchone()
            conn.close()
            
            # Auto login
            session['user_id'] = user['id']
            session['user_name'] = user['name']
            session['user_email'] = user['email']
            session['user_type'] = user['user_type']
            session['user_phone'] = user['phone']
            
            flash(f'Account created successfully! Welcome to YatraSetu, {name}!', 'success')
            return redirect(url_for('index'))
            
        except Exception as e:
            print(f"Registration error: {str(e)}")
            flash('Error creating account. Please try again.', 'error')
    
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out successfully', 'info')
    return redirect(url_for('index'))

# API Routes
@app.route('/api/post-ride', methods=['POST'])
def api_post_ride():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Please login first'})
    
    data = request.get_json()
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO rides (
                user_id, ride_type, source_city, destination_city, departure_time,
                arrival_time, vehicle_type, vehicle_number, available_capacity,
                price_per_unit, additional_info, contact_number, preferred_language
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            session['user_id'],
            data['ride_type'],
            data['source_city'],
            data['destination_city'],
            data['departure_time'],
            data.get('arrival_time'),
            data['vehicle_type'],
            data['vehicle_number'],
            data['available_capacity'],
            data['price_per_unit'],
            data.get('additional_info', ''),
            data['contact_number'],
            data.get('preferred_language', 'hindi')
        ))
        
        conn.commit()
        ride_id = cursor.lastrowid
        conn.close()
        
        return jsonify({
            'success': True, 
            'message': 'Ride posted successfully!',
            'ride_id': ride_id
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/chat')
def chat_page():
    return render_template('chat.html')


@app.route('/api/chat', methods=['POST'])
def api_chat():
    data = request.get_json() or {}
    msg = (data.get('message') or '').strip()
    if not msg:
        return jsonify({'success': False, 'reply': "Please send a message."})

    # Very small rule-based responder: expand as needed or plug an LLM here.
    lower = msg.lower()
    if 'hello' in lower or 'hi' in lower:
        reply = f"Hello! I'm the YatraSetu assistant. How can I help you today?"
    elif 'book' in lower or 'booking' in lower:
        reply = "To book a ride, search for a ride and click 'Book' on the ride card. I can open the Find Ride page for you."
    elif 'where' in lower and 'ride' in lower:
        reply = "You can see available rides on the Find Ride page. Enter source and destination and press Search."
    elif 'help' in lower:
        reply = "I can help you find rides, post rides, and view your bookings. Try: 'Find rides from Pune to Mumbai on 2024-01-22'."
    else:
        # fallback echo with guidance
        reply = "I heard: '" + msg + "'. I can help with searching rides, booking, and account info. Try asking: 'Find rides from Pune to Mumbai'."

    return jsonify({'success': True, 'reply': reply})

@app.route('/api/search-rides')
def api_search_rides():
    source = request.args.get('source', '').strip().lower()
    destination = request.args.get('destination', '').strip().lower()
    travel_date = request.args.get('travel_date', '')
    
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
        
        # Convert to list of dictionaries
        rides_list = []
        for ride in rides:
            ride_dict = dict(ride)
            # Add some sample data for demonstration
            ride_dict['rating'] = ride_dict.get('rating', 4.5)
            ride_dict['total_rides'] = ride_dict.get('total_rides', random.randint(5, 50))
            rides_list.append(ride_dict)
        
        return jsonify(rides_list)
        
    except sqlite3.OperationalError:
        return jsonify([])
    finally:
        conn.close()

@app.route('/api/book-ride', methods=['POST'])
def api_book_ride():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Please login first'})
    
    data = request.get_json()
    ride_id = data['ride_id']
    quantity = data['quantity']
    
    try:
        conn = get_db_connection()
        
        # Use a transaction to avoid race conditions on available_capacity
        cursor = conn.cursor()
        try:
            cursor.execute('BEGIN IMMEDIATE')
            ride = cursor.execute('SELECT * FROM rides WHERE id = ?', (ride_id,)).fetchone()
            if not ride:
                conn.rollback()
                return jsonify({'success': False, 'message': 'Ride not found'})

            if ride['available_capacity'] < quantity:
                conn.rollback()
                return jsonify({'success': False, 'message': 'Not enough capacity available'})

            total_amount = ride['price_per_unit'] * quantity

            cursor.execute('''
                INSERT INTO bookings (ride_id, passenger_id, quantity, total_amount)
                VALUES (?, ?, ?, ?)
            ''', (ride_id, session['user_id'], quantity, total_amount))

            cursor.execute('''
                UPDATE rides SET available_capacity = available_capacity - ?
                WHERE id = ?
            ''', (quantity, ride_id))

            conn.commit()
            booking_id = cursor.lastrowid
            return jsonify({
                'success': True,
                'message': 'Ride booked successfully!',
                'total_amount': total_amount,
                'booking_id': booking_id
            })
        except Exception as e:
            conn.rollback()
            return jsonify({'success': False, 'message': str(e)})
        finally:
            conn.close()
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/ride/<int:ride_id>')
def api_get_ride(ride_id):
    conn = get_db_connection()
    try:
        ride = conn.execute('SELECT r.*, u.name as driver_name, u.rating, u.total_rides FROM rides r JOIN users u ON r.user_id = u.id WHERE r.id = ?', (ride_id,)).fetchone()
        if not ride:
            return jsonify({'success': False, 'message': 'Ride not found'}), 404
        ride_dict = dict(ride)
        ride_dict['rating'] = ride_dict.get('rating', 4.5)
        ride_dict['total_rides'] = ride_dict.get('total_rides', random.randint(5, 50))
        return jsonify({'success': True, 'ride': ride_dict})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/city-suggest')
def api_city_suggest():
    """Proxy to Teleport cities API to avoid browser CORS/network blocks."""
    query = request.args.get('q', '').strip()
    if not query or len(query) < 2:
        return jsonify({'success': True, 'suggestions': []})

    try:
        # Use standard library to avoid adding 'requests' dependency
        from urllib import request as urlreq, parse as urlparse
        import json

        base = 'https://api.teleport.org/api/cities/'
        params = urlparse.urlencode({'search': query, 'limit': 10})
        full = f"{base}?{params}"
        with urlreq.urlopen(full, timeout=5) as resp:
            if resp.status != 200:
                return jsonify({'success': False, 'message': f'Teleport error {resp.status}'}), 502
            raw = resp.read().decode('utf-8')
            j = json.loads(raw)

        results = (j.get('_embedded') or {}).get('city:search-results', [])
        names = [item.get('matching_full_name') for item in results if item.get('matching_full_name')]
        # deduplicate while preserving order
        seen = set(); uniq = []
        for n in names:
            key = n.lower()
            if key not in seen:
                seen.add(key)
                uniq.append(n)
        return jsonify({'success': True, 'suggestions': uniq})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/sos', methods=['POST'])

def sos_emergency():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Please login first'})
    
    data = request.get_json()
    
    try:
        conn = get_db_connection()
        conn.execute('''
            INSERT INTO sos_alerts (user_id, latitude, longitude, address)
            VALUES (?, ?, ?, ?)
        ''', (
            session['user_id'],
            data.get('latitude'),
            data.get('longitude'),
            data.get('address', '')
        ))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'SOS alert sent! Emergency services have been notified.'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

if __name__ == '__main__':
    # Create necessary folders
    os.makedirs('static/uploads', exist_ok=True)
    os.makedirs('invoices', exist_ok=True)
    
    # Check and initialize database
    check_database()
    
    print("🚀 Starting YatraSetu application...")
    print("🌐 Server running at: http://localhost:5000")
    print("🔑 Test accounts:")
    print("   - Driver: prasad@example.com / password123")
    print("   - Passenger: siddhesh@example.com / password123")
    print("   - Admin: admin@yatrasetu.com / admin123")
    
    app.run(debug=True, host='0.0.0.0', port=5000)


