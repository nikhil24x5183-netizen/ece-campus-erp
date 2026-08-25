import sqlite3
import os
import shutil
from datetime import datetime

# Determine project root directory safely
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if os.path.basename(CURRENT_DIR) == 'api':
    PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
else:
    PROJECT_ROOT = CURRENT_DIR

# Vercel Serverless Writable Filesystem Support
if os.environ.get('VERCEL') == '1':
    TMP_DIR = '/tmp'
    os.makedirs(TMP_DIR, exist_ok=True)
    TMP_DB = os.path.join(TMP_DIR, 'campus_erp.db')
    ORIG_DB = os.path.join(PROJECT_ROOT, 'campus_erp.db')
    if not os.path.exists(TMP_DB) and os.path.exists(ORIG_DB):
        try:
            shutil.copy2(ORIG_DB, TMP_DB)
        except Exception as e:
            print("DB copy notice:", e)
    DB_PATH = TMP_DB
else:
    DB_PATH = os.path.join(PROJECT_ROOT, 'campus_erp.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("PRAGMA foreign_keys = ON;")

    # 1. Users Table (Roles: STUDENT, TEACHER, HOD)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('STUDENT', 'TEACHER', 'HOD')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # 2. Departments
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        code TEXT UNIQUE NOT NULL
    )
    ''')

    # 3. Semesters
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS semesters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        semester_number INTEGER UNIQUE NOT NULL
    )
    ''')

    # 4. Divisions
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS divisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        department_id INTEGER NOT NULL,
        semester_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
        FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE,
        UNIQUE(department_id, semester_id, name)
    )
    ''')

    # 5. Batches
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS batches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        division_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE CASCADE,
        UNIQUE(division_id, name)
    )
    ''')

    # 6. Students
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        name TEXT NOT NULL,
        photo TEXT DEFAULT '',
        roll_no TEXT NOT NULL,
        prn_no TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT DEFAULT '',
        department_id INTEGER NOT NULL,
        semester_id INTEGER NOT NULL,
        division_id INTEGER NOT NULL,
        batch_id INTEGER NOT NULL,
        academic_year TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (department_id) REFERENCES departments(id),
        FOREIGN KEY (semester_id) REFERENCES semesters(id),
        FOREIGN KEY (division_id) REFERENCES divisions(id),
        FOREIGN KEY (batch_id) REFERENCES batches(id),
        UNIQUE(division_id, roll_no)
    )
    ''')

    # 7. Teachers
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS teachers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        teacher_id_code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        department_id INTEGER NOT NULL,
        designation TEXT DEFAULT 'Professor',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (department_id) REFERENCES departments(id)
    )
    ''')

    # 8. Subjects
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        department_id INTEGER NOT NULL,
        semester_id INTEGER NOT NULL,
        credits INTEGER DEFAULT 3,
        type TEXT NOT NULL CHECK(type IN ('THEORY', 'LAB', 'TUTORIAL')),
        FOREIGN KEY (department_id) REFERENCES departments(id),
        FOREIGN KEY (semester_id) REFERENCES semesters(id),
        UNIQUE(code, department_id, semester_id)
    )
    ''')

    # 9. Time Slots
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS time_slots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        is_break INTEGER DEFAULT 0,
        display_order INTEGER DEFAULT 0
    )
    ''')

    # 10. Timetable (Includes sub_slot for 1-hr split vs 2-hr continuous lectures)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS timetable (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        department_id INTEGER NOT NULL,
        semester_id INTEGER NOT NULL,
        division_id INTEGER NOT NULL,
        batch_id INTEGER,
        academic_year TEXT NOT NULL,
        day_of_week TEXT NOT NULL CHECK(day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
        time_slot_id INTEGER NOT NULL,
        sub_slot INTEGER DEFAULT 0,
        subject_id INTEGER,
        teacher_id INTEGER,
        room TEXT DEFAULT '',
        activity_type TEXT NOT NULL CHECK(activity_type IN ('THEORY', 'LAB', 'TUTORIAL', 'LIBRARY', 'BREAK', 'FREE_PERIOD')),
        is_break INTEGER DEFAULT 0,
        is_free_period INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id),
        FOREIGN KEY (semester_id) REFERENCES semesters(id),
        FOREIGN KEY (division_id) REFERENCES divisions(id),
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL,
        FOREIGN KEY (time_slot_id) REFERENCES time_slots(id),
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
    )
    ''')

    # 11. Certificates
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS certificates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        event_name TEXT NOT NULL,
        category TEXT NOT NULL,
        certificate_date DATE NOT NULL,
        description TEXT DEFAULT '',
        file_url TEXT NOT NULL,
        file_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED', 'TIMETABLE_PENDING')),
        rejection_reason TEXT DEFAULT '',
        reviewed_by INTEGER,
        reviewed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewed_by) REFERENCES teachers(id)
    )
    ''')

    # 12. Activity Records
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS activity_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        certificate_id INTEGER NOT NULL,
        activity_date DATE NOT NULL,
        calculation_status TEXT DEFAULT 'COMPLETED',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (certificate_id) REFERENCES certificates(id) ON DELETE CASCADE
    )
    ''')

    # 13. Activity Subjects
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS activity_subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        activity_record_id INTEGER NOT NULL,
        subject_id INTEGER NOT NULL,
        batch_id INTEGER,
        activity_type TEXT NOT NULL,
        lecture_count REAL NOT NULL DEFAULT 1.0,
        duration_minutes INTEGER NOT NULL DEFAULT 60,
        FOREIGN KEY (activity_record_id) REFERENCES activity_records(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id),
        FOREIGN KEY (batch_id) REFERENCES batches(id)
    )
    ''')

    # 14. Activity Rules
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS activity_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        activity_type TEXT UNIQUE NOT NULL,
        units_per_session REAL NOT NULL DEFAULT 1.0,
        minutes_per_unit INTEGER NOT NULL DEFAULT 60
    )
    ''')

    # 15. Notifications
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'INFO',
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    ''')

    # 16. OTP Verifications Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS otp_verifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        otp_code TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        is_used INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # 17. Password Reset Requests Table (HOD Approval Flow)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS password_reset_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        email TEXT NOT NULL,
        requested_password_hash TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')),
        rejection_reason TEXT DEFAULT '',
        reviewed_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        reviewed_at DATETIME,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewed_by) REFERENCES teachers(id)
    )
    ''')

    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    print("Database schema updated with sub_slot support.")
