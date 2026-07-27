from flask import Flask, render_template, request, jsonify
import os
import time
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId

# Groq Library Import
try:
    from groq import Groq
except ImportError:
    Groq = None

app = Flask(__name__)

# =========================================================
# 1. GROQ AI & MONGODB CONFIGURATION
# =========================================================
GROQ_API_KEY = os.environ.get("GROQ_API_KEY") or os.environ.get("GEMINI_API_KEY")
client_ai = None

if GROQ_API_KEY and Groq:
    try:
        client_ai = Groq(api_key=GROQ_API_KEY.strip())
    except Exception as e:
        print("Groq Config Error:", e)

MONGO_URI = os.environ.get("MONGO_URI")
client = MongoClient(MONGO_URI) if MONGO_URI else None
db = client['lifelink_db'] if client is not None else None
users_collection = db['donors'] if db is not None else None

# =========================================================
# 2. DATA STRUCTURE: BINARY SEARCH TREE (BST) NODE
# =========================================================
class BSTNode:
    def __init__(self, donor):
        self.donor = donor  
        self.left = None
        self.right = None

class DonorBST:
    def __init__(self):
        self.root = None

    def insert(self, root, donor):
        if root is None:
            return BSTNode(donor)
        if donor.get('distance', 0) < root.donor.get('distance', 0):
            root.left = self.insert(root.left, donor)
        else:
            root.right = self.insert(root.right, donor)
        return root

    def get_sorted_donors(self, root, result):
        if root:
            self.get_sorted_donors(root.left, result)
            result.append(root.donor)
            self.get_sorted_donors(root.right, result)

# =========================================================
# 3. LOAD DATA FROM MONGODB TO HASH TABLE ON STARTUP
# =========================================================
donor_hash_table = {
    "O+": [], "A+": [], "B+": [], "AB+": [], 
    "O-": [], "A-": [], "B-": [], "AB-": []
}

def load_donors_from_mongo():
    if users_collection is None:
        return
    try:
        all_donors = list(users_collection.find({}))
        for donor in all_donors:
            donor['id'] = str(donor.get('_id'))
            if '_id' in donor:
                del donor['_id']
            if 'password' in donor:
                del donor['password']
            
            blood = donor.get("blood")
            if blood in donor_hash_table:
                donor_hash_table[blood].append(donor)
            else:
                donor_hash_table[blood] = [donor]
    except Exception as e:
        print("Error loading from MongoDB:", e)

load_donors_from_mongo()

# =========================================================
# 4. FLASK ROUTES
# =========================================================

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/admin/users')
def admin_users():
    return render_template('view_users.html', donor_hash_table=donor_hash_table)

@app.route('/api/request-blood', methods=['POST'])
def request_blood():
    data = request.json or {}
    blood_group = data.get('blood_group')
    
    donors_list = donor_hash_table.get(blood_group, [])
    
    # BST Sorting based on Distance
    bst = DonorBST()
    for donor in donors_list:
        bst.root = bst.insert(bst.root, donor)
        
    sorted_donors = []
    bst.get_sorted_donors(bst.root, sorted_donors)
    
    return jsonify({
        "status": "success",
        "matched_donors": sorted_donors,
        "count": len(sorted_donors)
    })

@app.route('/api/donor/add', methods=['POST'])
@app.route('/api/register', methods=['POST'])
def add_donor():
    if users_collection is None:
        return jsonify({"status": "error", "message": "Database Connection Failed! Check MONGO_URI."}), 500

    try:
        data = request.get_json(silent=True) or {}

        name = data.get('name', '').strip()
        blood = data.get('blood', '').strip()
        location = data.get('location', '').strip()
        phone = data.get('phone', '').strip()
        raw_password = data.get('password', '').strip()
        distance = float(data.get('distance') or 1.5)

        if not name or not blood or not location or not phone or not raw_password:
            return jsonify({"status": "error", "message": "All fields including password are required."}), 400

        if users_collection.find_one({"phone": phone}):
            return jsonify({"status": "error", "message": "This phone number is already registered!"}), 400

        hashed_password = generate_password_hash(raw_password)

        new_donor = {
            "name": name,
            "blood": blood,
            "location": location,
            "distance": distance,
            "phone": phone,
            "password": hashed_password
        }

        result = users_collection.insert_one(new_donor)
        
        donor_for_mem = {
            "id": str(result.inserted_id),
            "name": name,
            "blood": blood,
            "location": location,
            "distance": distance,
            "phone": phone
        }

        donor_hash_table.setdefault(blood, []).append(donor_for_mem)

        return jsonify({
            "status": "success",
            "message": "Donor registered successfully!",
            "donor": donor_for_mem
        }), 201

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login_user():
    if users_collection is None:
        return jsonify({"status": "error", "message": "Database Connection Error"}), 500

    try:
        data = request.get_json(silent=True) or {}
        identifier = (data.get('identifier') or data.get('phone') or '').strip()
        password = data.get('password', '').strip()

        if not identifier or not password:
            return jsonify({"status": "error", "message": "Phone and password are required."}), 400

        user = users_collection.find_one({"phone": identifier})
        
        if not user:
            return jsonify({"status": "error", "message": "User not found!"}), 404

        if check_password_hash(user.get("password", ""), password):
            return jsonify({
                "status": "success", 
                "message": "Login successful!",
                "user": {
                    "name": user.get("name"), 
                    "blood": user.get("blood"), 
                    "phone": user.get("phone"),
                    "location": user.get("location")
                }
            }), 200
        else:
            return jsonify({"status": "error", "message": "Incorrect password!"}), 401

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/donor/delete', methods=['DELETE'])
def delete_donor():
    data = request.json or {}
    donor_id = data.get('id')
    blood = data.get('blood')
    
    if blood in donor_hash_table:
        donor_hash_table[blood] = [d for d in donor_hash_table[blood] if d.get('id') != donor_id]
        try:
            if users_collection is not None:
                users_collection.delete_one({"_id": ObjectId(donor_id)})
        except Exception:
            pass
        return jsonify({"status": "success", "message": "Donor removed successfully!"})
    
    return jsonify({"status": "error", "message": "Donor not found!"}), 404

# =========================================================
# 5. GROQ AI CHAT ROUTE (GUARANTEED NO 429 ERRORS)
# =========================================================
@app.route('/api/chat', methods=['POST'])
def ai_chat():
    if not client_ai:
        return jsonify({"status": "error", "reply": "GROQ_API_KEY is missing or invalid in Render Environment!"}), 500

    data = request.json or {}
    user_prompt = data.get('message', '').strip()
    
    if not user_prompt:
        return jsonify({"status": "error", "reply": "Please send a valid message."}), 400

    system_prompt = "You are LifeLink AI, an emergency medical and first-aid assistant. Provide short, precise, and practical advice."
    
    try:
        response = client_ai.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=300
        )
        if response and response.choices and len(response.choices) > 0:
            return jsonify({"status": "success", "reply": response.choices[0].message.content})
        else:
            return jsonify({"status": "error", "reply": "Received empty response from AI."}), 500
            
    except Exception as e:
        return jsonify({"status": "error", "reply": f"AI Error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
