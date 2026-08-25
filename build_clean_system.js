const fs = require('fs');
const https = require('https');

const div_a_raw = [
  [1, "U251H001", "ADE ANIKET DATTATRAY"],
  [2, "U251H003", "ANBHULE SANSKAR DEVRAO"],
  [3, "U251H004", "ANUJA SANJAY PISALE"],
  [4, "U251H006", "ATHARVA PANDURANG KARANJEKAR"],
  [5, "U251H009", "BANGDE ARYAN NITIN"],
  [6, "U251H010", "BATHE ADITI AJAY"],
  [7, "U251H013", "BHAVE GUN SHALIK"],
  [8, "U251H014", "BHAWAR VAIBHAV BABAN"],
  [9, "U251H017", "BIRADAR ARJUN ARVIND"],
  [10, "U251H018", "BIRAJDAR ARPITA SAGAR"],
  [11, "U251H020", "BORKAR PRANAV PRASHANT"],
  [12, "U251H022", "CHOUDHARY SANKET RAJENDRA"],
  [13, "U251H025", "DAUNDKAR MANTHAN SANDEEP"],
  [14, "U251H026", "DAWANGE CHAITALI VIJAY"],
  [15, "U251H029", "DHAKATE AARTI SANJAY"],
  [16, "U251H030", "DHIRAJ SANJAY MINDE"],
  [17, "U251H032", "GADE PRACHI ANIL"],
  [18, "U251H035", "GAWADE ANVESHA HARIRAM"],
  [19, "U251H036", "GHADAGE ANUJ VIKAS"],
  [20, "U251H038", "GHOJAGE PRATHAMESH RAMESH"],
  [21, "U251H040", "INDRALE RANJIT BALAPPA"],
  [22, "U251H044", "JADHAV TANUSHREE HANMANT"],
  [23, "U251H046", "JAWALE POONAM MADHAV"],
  [24, "U251H048", "JUNGHARE YAMINI GANPAT"],
  [25, "U251H049", "KADAM ARJUN ANANTRAO"],
  [26, "U251H051", "KALPE PRATHMESH PRAKASH"],
  [27, "U251H054", "KHUSHAL DATTATRAY KAPADANE"],
  [28, "U251H056", "KSHITIJA NANDKISHOR HURSAD"],
  [29, "U251H057", "KUMBHAR NIRANJAN SANTOSH"],
  [30, "U251H060", "MAGAR ANJALI SATISH"],
  [31, "U251H062", "MALI NITIN DEVIDAS"],
  [32, "U251H064", "MISAL MAHESH VITTHAL"],
  [33, "U251H065", "MITALI TITAR"],
  [34, "U251H067", "MOHITE RITESH NAMDEV"],
  [35, "U251H070", "NAIK ROHIT TANAJI"],
  [36, "U251H072", "NAVGHARE GAYATRI YOGESH"],
  [37, "U251H073", "NEMADE DEEVESH KUSHAL"],
  [38, "U251H076", "NIKAM PRATIK SHARAD"],
  [39, "U251H077", "NIKHIL DHANWANT PADWAL"],
  [40, "U251H079", "NISHA NAVNATH MANDHARE"],
  [41, "U251H080", "OM SHARAD KASHID"],
  [42, "U251H083", "PADHEN ABHIJIT SANTOSH"],
  [43, "U251H085", "PATIL POORVA SANTOSH"],
  [44, "U251H088", "PRANJALI PRADIP MAHAJAN"],
  [45, "U251H089", "PRIYANSHU PRASAD"],
  [46, "U251H091", "RAJMANE VAIBHAV SHIVAJI"],
  [47, "U251H094", "RANDHIR MAITRALI KISHOR"],
  [48, "U251H096", "SAMRUDDHI VASANT PADWAL"],
  [49, "U251H097", "SANDBHOR TANMAY SUDHAKAR"],
  [50, "U251H099", "SANKET NARESH NEMADE"],
  [51, "U251H101", "SHAIKH AMAN TURAB"],
  [52, "U251H103", "SHINDE MANSI MALHARI"],
  [53, "U251H105", "SHINDE SANSKAR CHANDRAKANT"],
  [54, "U251H107", "SHRUJAL SUNIL INDE"],
  [55, "U251H109", "SONAWANE ROSHANI SATILAL"],
  [56, "U251H111", "SULAKHE OJAS PRASHANT"],
  [57, "U251H114", "TEKALE HARSHADA VIJAYRAO"],
  [58, "U251H116", "THORBOLE DIPALI PRAKASH"],
  [59, "U251H117", "TONAPE DHANANJAY SACHIN"],
  [60, "U251H120", "WAGH AMAN ABA"],
  [61, "U251H122", "YEOLE VRUSHABH PANKAJ"],
  [62, "U251H042", "JADHAV PAYAL LAXMAN"]
];

const div_b_raw = [
  [1, "U251H002", "ANAND SHINDALKAR MARUTI"],
  [2, "U251H005", "ARAS MANGESH MAHESH"],
  [3, "U251H007", "AWADHWAL NIKHIL MUKESH"],
  [4, "U251H008", "BACCHEWAR SANCHITA SANTOSH"],
  [5, "U251H011", "BHAMBERE TANISH CHANDU"],
  [6, "U251H012", "BHARANE NIKITA SURESH"],
  [7, "U251H015", "BHISE SANSKRUTI VISHWAS"],
  [8, "U251H016", "BHOSLE PRATHMESH RAMESH"],
  [9, "U251H019", "BONDAR SHIVAM NANASAHEB"],
  [10, "U251H021", "CHAUDHARI PRAJWAL MANOJ"],
  [11, "U251H023", "DAMKONDWAR RITIKA LAXMAN"],
  [12, "U251H024", "DARSHAN SANTOSH GHUNAWAT"],
  [13, "U251H027", "DESHPANDE MADHURA SANJAY"],
  [14, "U251H028", "DEVANG RITESH JITENDRA"],
  [15, "U251H031", "DURANDE GITANJALI AMOL"],
  [16, "U251H033", "GATE VAISHNAVI KAILAS"],
  [17, "U251H034", "GAURAV RAMDAS BHUJBAL"],
  [18, "U251H037", "GHARE SUSHANT PANDURANG"],
  [19, "U251H039", "GIRASE JAYESH DAGESING"],
  [20, "U251H041", "ISHAAN MILIND PARULEKAR"],
  [22, "U251H043", "JADHAV PRANAV LAXMAN"],
  [23, "U251H045", "JANGALE KANISHKA KUNDAN"],
  [24, "U251H047", "JEER SUNSHRIYA HEMANT"],
  [25, "U251H050", "KALGUNDE ATHARVA SANTOSH"],
  [26, "U251H052", "KEDAR SUHANI RAMHARI"],
  [27, "U251H053", "KEYUR SHAMDEV RAGHORTE"],
  [28, "U251H055", "KOLE SANJAY BALAJI"],
  [29, "U251H058", "KUMBHAR SARTHAK SACHIN"],
  [30, "U251H059", "LINGADE ANUSHKA VISHAL"],
  [31, "U251H061", "MALI MOKSHADA RAMESH"],
  [32, "U251H063", "MANOJ DNYANOBA HALLE"],
  [33, "U251H066", "MOHIT MODARAM CHOUDHARY"],
  [34, "U251H068", "MORE DIVESH SUNIL"],
  [35, "U251H069", "MUJMULE SAMIKSHA PRADIP"],
  [36, "U251H071", "NAIR ARAVIND PRASANTH"],
  [37, "U251H074", "NEWARE SHREYASH PRAMOD"],
  [38, "U251H075", "NIKAM PAYAL SURESH"],
  [39, "U251H078", "NIMJE YASH ASHOKRAO"],
  [40, "U251H081", "OM VILAS RAUT"],
  [41, "U251H082", "OVHAL PRANALI GANESH"],
  [42, "U251H084", "PATIL MANISH MANOHAR"],
  [43, "U251H086", "PAWAR SIDDHI LAXMAN"],
  [44, "U251H087", "PRANAV AMIT SAHASRABUDDHE"],
  [45, "U251H090", "PUJARI MITESH RAKESH"],
  [46, "U251H092", "RAJPUT SURYADEVSING BHARATSING"],
  [47, "U251H093", "RAKSHE VAISHNAVI KUNDLIK"],
  [48, "U251H095", "RANE SHRUTI NANDKISHOR"],
  [49, "U251H098", "SANER SAKSHI NILESH"],
  [50, "U251H100", "SATHE BHARGAV YOGESH"],
  [51, "U251H102", "SHINDE AMEY NAVNATH"],
  [52, "U251H104", "SHINDE RITU DATTATRAY"],
  [53, "U251H106", "SHREYASH NITIN KHAJEKAR"],
  [54, "U251H108", "SHUBHAM SHRISHAIL BOLAKOTAGI"],
  [55, "U251H110", "SONONE KOMAL SURESH"],
  [56, "U251H112", "SUNDARAM SANJAY PATHAK"],
  [57, "U251H113", "TAKALE SARTHAK SACHIN"],
  [58, "U251H115", "THIGALE SIDDHI KAILAS"],
  [59, "U251H118", "TONDARE SAKSHI BASAWRAJ"],
  [60, "U251H119", "TONGALE KETAN MURLIDHAR"],
  [61, "U251H121", "WAYAL PIYUSH SHASHIKANT"]
];

const users = [
  {
    id: 1,
    email: "teacher@campus.edu",
    password_hash: "1234",
    role: "HOD",
    name: "Dr. Dhanashree Kulkarni",
    status: "APPROVED",
    is_activated: true,
    must_change_credentials: false
  },
  {
    id: 2,
    email: "faculty@campus.edu",
    password_hash: "1234",
    role: "TEACHER",
    name: "Prof. A. R. Sharma",
    status: "APPROVED",
    is_activated: true,
    must_change_credentials: false
  }
];

const students = [];
let curr_id = 3;

for (const [roll, prn, name] of div_a_raw) {
  const roll_str = String(roll).padStart(2, '0');
  const batch_name = roll <= 21 ? "A1" : (roll <= 42 ? "A2" : "A3");
  const batch_id = roll <= 21 ? 1 : (roll <= 42 ? 2 : 3);

  users.push({
    id: curr_id,
    email: "",
    username: prn,
    prn_no: prn,
    roll_no: roll_str,
    division_id: 1,
    batch_id: batch_id,
    division_name: "SE(ECE)-A",
    batch_name: batch_name,
    password_hash: "Student@123",
    role: "STUDENT",
    name: name,
    status: "APPROVED",
    is_activated: false,
    must_change_credentials: true,
    is_logged_in: false
  });

  students.push({
    id: curr_id - 2,
    user_id: curr_id,
    name: name,
    roll_no: roll_str,
    prn_no: prn,
    username: prn,
    department_id: 1,
    semester_id: 1,
    division_id: 1,
    batch_id: batch_id,
    division_name: "SE(ECE)-A",
    batch_name: batch_name,
    email: "",
    password_hash: "Student@123",
    status: "APPROVED",
    is_activated: false,
    must_change_credentials: true,
    is_logged_in: false
  });
  curr_id++;
}

for (const [roll, prn, name] of div_b_raw) {
  const roll_str = String(roll).padStart(2, '0');
  const batch_name = roll <= 21 ? "B1" : (roll <= 42 ? "B2" : "B3");
  const batch_id = roll <= 21 ? 4 : (roll <= 42 ? 5 : 6);

  users.push({
    id: curr_id,
    email: "",
    username: prn,
    prn_no: prn,
    roll_no: roll_str,
    division_id: 2,
    batch_id: batch_id,
    division_name: "SE(ECE)-B",
    batch_name: batch_name,
    password_hash: "Student@123",
    role: "STUDENT",
    name: name,
    status: "APPROVED",
    is_activated: false,
    must_change_credentials: true,
    is_logged_in: false
  });

  students.push({
    id: curr_id - 2,
    user_id: curr_id,
    name: name,
    roll_no: roll_str,
    prn_no: prn,
    username: prn,
    department_id: 1,
    semester_id: 1,
    division_id: 2,
    batch_id: batch_id,
    division_name: "SE(ECE)-B",
    batch_name: batch_name,
    email: "",
    password_hash: "Student@123",
    status: "APPROVED",
    is_activated: false,
    must_change_credentials: true,
    is_logged_in: false
  });
  curr_id++;
}

const NEW_RESET_KEY = "ece_campus_db_v50000_pure_official_prn_zero_dummy";
const NEW_TOKEN = "v50000_pure_official_prn_zero_dummy";

// 1. Update static/js/api.js
let api_js = fs.readFileSync('static/js/api.js', 'utf8');
api_js = api_js.replace(/users:\s*\[[\s\S]*?\],\s*students:/, `users: ${JSON.stringify(users, null, 2)},\n  students:`);
api_js = api_js.replace(/students:\s*\[[\s\S]*?\],\s*password_requests:/, `students: ${JSON.stringify(students, null, 2)},\n  password_requests:`);
api_js = api_js.replace(/ece_campus_db_v\w+/g, NEW_RESET_KEY);
api_js = api_js.replace(/v\w+_pure_official_prn_zero_dummy|v\w+_official_prn_onboarding_system|v\w+_wipe_nikhil_test_account/g, NEW_TOKEN);
fs.writeFileSync('static/js/api.js', api_js, 'utf8');
console.log('Updated static/js/api.js with official PRNs!');

// 2. Build Python api/sync.py
const sync_code = `from http.server import BaseHTTPRequestHandler
import json
import os

TMP_DB_PATH = "/tmp/campus_db_v50000.json"
APP_KEY = "ece_campus_db_v50000_pure_official_prn_zero_dummy"

INITIAL_DB_STATE = {
    "users": ${JSON.stringify(users, null, 4)},
    "students": ${JSON.stringify(students, null, 4)},
    "certificates": [],
    "activity_records": [],
    "activity_subjects": [],
    "password_requests": [],
    "audit_logs": []
}

def get_db():
    if os.path.exists(TMP_DB_PATH):
        try:
            with open(TMP_DB_PATH, "r") as f:
                data = json.load(f)
                if data and data.get("students") and len(data.get("students")) == 122:
                    return data
        except Exception:
            pass
    return json.loads(json.dumps(INITIAL_DB_STATE))

def save_db(db):
    try:
        with open(TMP_DB_PATH, "w") as f:
            json.dump(db, f)
    except Exception:
        pass

class handler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(200)

    def do_GET(self):
        db = get_db()
        self._set_headers(200)
        self.wfile.write(json.dumps({"status": "ok", "db": db}).encode("utf-8"))

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
        try:
            payload = json.loads(body)
        except Exception:
            payload = {}

        db = get_db()
        if "users" in payload and isinstance(payload["users"], list):
            db["users"] = payload["users"]
        if "students" in payload and isinstance(payload["students"], list):
            db["students"] = payload["students"]
        if "certificates" in payload and isinstance(payload["certificates"], list):
            db["certificates"] = payload["certificates"]
        if "activity_records" in payload and isinstance(payload["activity_records"], list):
            db["activity_records"] = payload["activity_records"]
        if "activity_subjects" in payload and isinstance(payload["activity_subjects"], list):
            db["activity_subjects"] = payload["activity_subjects"]
        if "password_requests" in payload and isinstance(payload["password_requests"], list):
            db["password_requests"] = payload["password_requests"]

        save_db(db)
        self._set_headers(200)
        self.wfile.write(json.dumps({"status": "ok", "message": "Synced successfully"}).encode("utf-8"))
`;

fs.writeFileSync('api/sync.py', sync_code, 'utf8');
console.log('Updated api/sync.py with official PRNs!');
