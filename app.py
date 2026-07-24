from flask import Flask, render_template, request, jsonify
import google.generativeai as genai
import os
from supabase import create_client
app = Flask(__name__)

# =========================================================
# 1. GEMINI AI CONFIGURATION
# =========================================================
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')
# Supabase Configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
# =========================================================
# 2. DATA STRUCTURE: BINARY SEARCH TREE (BST) NODE
# =========================================================
class BSTNode:
    def __init__(self, donor):
        self.donor = donor  # donor dict: {id, name, blood, location, distance, phone}
        self.left = None
        self.right = None

class DonorBST:
    def __init__(self):
        self.root = None

    def insert(self, root, donor):
        if root is None:
            return BSTNode(donor)
        if donor['distance'] < root.donor['distance']:
            root.left = self.insert(root.left, donor)
        else:
            root.right = self.insert(root.right, donor)
        return root

    # In-order traversal: কাছের ডোনারদের দূরত্ব অনুযায়ী আগে সাজিয়ে আনবে
    def get_sorted_donors(self, root, result):
        if root:
            self.get_sorted_donors(root.left, result)
            result.append(root.donor)
            self.get_sorted_donors(root.right, result)

# =========================================================
# 3. DATA STRUCTURE: HASH TABLE (Blood Group -> Donors List)
# =========================================================
donor_hash_table = {
    "O+": [
        {"id": 1, "name": "Ayesha Rahman", "blood": "O+", "location": "Dhanmondi", "distance": 0.8, "phone": "01611-889900"},
        {"id": 2, "name": "Riad Hasan", "blood": "O+", "location": "Dhanmondi", "distance": 1.2, "phone": "01812-345678"},
        {"id": 3, "name": "Nusrat Jahan", "blood": "O+", "location": "Mirpur", "distance": 2.5, "phone": "01711-987654"}
    ],
    "A+": [
        {"id": 4, "name": "Saiful Islam", "blood": "A+", "location": "Uttara", "distance": 3.1, "phone": "01911-223344"}
    ],
    "B+": [
        {"id": 5, "name": "Tanvir Ahmed", "blood": "B+", "location": "Gulshan", "distance": 4.2, "phone": "01511-556677"}
    ],
    "AB+": [],
    "O-": []
}

# =========================================================
# 4. FLASK ROUTES
# =========================================================

# Home Route: Load index.html from templates folder
@app.route('/')
def home():
    return render_template('index.html')

# Admin Route: View all registered users/donors
@app.route('/admin/users')
def admin_users():
    return render_template('view_users.html', donor_hash_table=donor_hash_table)

# API: Blood Search using Hash Table & BST Sorting
@app.route('/api/request-blood', methods=['POST'])
def request_blood():
    data = request.json
    blood_group = data.get('blood_group')
    
    # Step A: Hash Table Lookup O(1)
    donors_list = donor_hash_table.get(blood_group, [])
    
    # Step B: Build BST to sort donors by distance O(N log N)
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

# API: Register New Donor (Add to Hash Table)
# API: Register New Donor in Supabase
@app.route('/api/donor/add', methods=['POST'])
def add_donor():
    try:
        data = request.get_json(silent=True) or {}

        name = data.get('name', '').strip()
        blood = data.get('blood', '').strip()
        location = data.get('location', '').strip()
        phone = data.get('phone', '').strip()
        distance = float(data.get('distance') or 1.5)

        if not name or not blood or not location or not phone:
            return jsonify({
                "status": "error",
                "message": "Please complete all required fields."
            }), 400

        new_donor = {
            "name": name,
            "blood": blood,
            "location": location,
            "distance": distance,
            "phone": phone
        }

        response = supabase.table("donors").insert(new_donor).execute()
        saved_donor = response.data[0]

        # Keep the newly registered donor available for immediate searching
        donor_hash_table.setdefault(blood, []).append(saved_donor)

        return jsonify({
            "status": "success",
            "message": "Donor registered successfully!",
            "donor": saved_donor
        }), 201

    except Exception:
        app.logger.exception("Donor registration failed")
        return jsonify({
            "status": "error",
            "message": "Registration failed. Please try again."
        }), 500
# API: Delete Donor
@app.route('/api/donor/delete', methods=['DELETE'])
def delete_donor():
    data = request.json
    donor_id = data.get('id')
    blood = data.get('blood')
    
    if blood in donor_hash_table:
        donor_hash_table[blood] = [d for d in donor_hash_table[blood] if d['id'] != donor_id]
        return jsonify({"status": "success", "message": "Donor removed successfully!"})
    
    return jsonify({"status": "error", "message": "Donor not found!"}), 404

# API: Gemini AI Chat Assistant
@app.route('/api/chat', methods=['POST'])
def ai_chat():
    data = request.json
    user_prompt = data.get('message', '')
    
    system_instruction = f"You are LifeLink AI, an emergency medical and first-aid assistant. Provide short, precise, and practical advice. User query: {user_prompt}"
    
    try:
        response = model.generate_content(system_instruction)
        return jsonify({"status": "success", "reply": response.text})
    except Exception as e:
        return jsonify({"status": "error", "reply": f"Gemini API Error: {str(e)}"}), 500

# Run Application Server
if __name__ == '__main__':
    app.run(debug=True, port=5000)
