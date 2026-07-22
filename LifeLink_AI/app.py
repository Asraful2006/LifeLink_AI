import sqlite3
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# ডাটাবেজ ও টেবিল তৈরির ফাংশন
def init_db():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            blood TEXT NOT NULL,
            location TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

init_db()

@app.route('/')
def home():
    return render_template('index.html')

# রেজিস্ট্রেশন ডাটা রিসিভ ও সেভ করার রাউট
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    name = data.get('name')
    phone = data.get('phone')
    blood = data.get('blood')
    location = data.get('location')

    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('INSERT INTO users (name, phone, blood, location) VALUES (?, ?, ?, ?)', 
                   (name, phone, blood, location))
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "message": "Registered successfully!"})

# নতুন রেজিস্টার্ড ইউজারদের তালিকা দেখার অ্যাডমিন রাউট
@app.route('/admin/users')
def view_users():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users')
    users = cursor.fetchall()
    conn.close()
    
    html = "<h2>Registered Users List</h2><table border='1' cellpadding='8'><tr><th>ID</th><th>Name</th><th>Phone</th><th>Blood</th><th>Location</th></tr>"
    for user in users:
        html += f"<tr><td>{user[0]}</td><td>{user[1]}</td><td>{user[2]}</td><td>{user[3]}</td><td>{user[4]}</td></tr>"
    html += "</table>"
    return html

if __name__ == '__main__':
    app.run(debug=True)