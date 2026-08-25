import os
import json
import csv
import io
from datetime import datetime
from flask import Flask, request, jsonify, render_template, send_from_directory, session
from werkzeug.utils import secure_filename
from database import get_db_connection, init_db
from auth import hash_password, verify_password, get_current_user, require_auth, require_role
from timetable_engine import calculate_activities_for_certificate, get_applicable_lectures_for_certificate

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(
    __name__,
    root_path=BASE_DIR,
    static_folder=os.path.join(BASE_DIR, 'static'),
    template_folder=os.path.join(BASE_DIR, 'templates')
)
app.secret_key = 'ece_management_secret_key_antigravity_2026'

# Configuration for uploads
if os.environ.get('VERCEL') == '1':
    UPLOAD_FOLDER = '/tmp/uploads'
else:
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')

ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Ensure Database is initialized
init_db()

# ----------------------------------------------------
# 1. AUTHENTICATION ENDPOINTS
# ----------------------------------------------------

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required.'}), 400

    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE LOWER(email) = ?', (email,)).fetchone()
    conn.close()

    if not user or not verify_password(password, user['password_hash']):
        return jsonify({'error': 'Invalid email or password.'}), 401

    session['user_id'] = user['id']
    session['role'] = user['role']

    # Default redirects: STUDENT or TEACHER
    redirect_url = '/student/dashboard' if user['role'] == 'STUDENT' else '/hod/dashboard'

    return jsonify({
        'message': 'Login successful',
        'role': user['role'],
        'redirect': redirect_url,
        'user': {
            'id': user['id'],
            'email': user['email'],
            'role': user['role']
        }
    })

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/auth/register-student', methods=['POST'])
def register_student():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    roll_no = data.get('roll_no', '').strip()
    prn_no = data.get('prn_no', '').strip()
    division_id = data.get('division_id', 1)
    batch_id = data.get('batch_id', 1)
    email = data.get('email', '').strip()
    password = data.get('password', '').strip()
    academic_year = data.get('academic_year', '2026-27').strip()

    if not name or not roll_no or not prn_no or not email or not password:
        return jsonify({'error': 'Please fill all required registration fields.'}), 400

    conn = get_db_connection()

    # 1. Email Check
    existing_email = conn.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()
    if existing_email:
        conn.close()
        return jsonify({'error': 'An account with this email address already exists. Please log in.'}), 400

    # 2. PRN Collision Check
    existing_prn = conn.execute('SELECT id FROM students WHERE prn_no = ?', (prn_no,)).fetchone()
    if existing_prn:
        conn.close()
        return jsonify({'error': f'PRN Number {prn_no} is already assigned to another registered student.'}), 400

    # 3. Roll Number Collision Check in same Division
    existing_roll = conn.execute('SELECT id FROM students WHERE division_id = ? AND roll_no = ?', (division_id, roll_no)).fetchone()
    if existing_roll:
        conn.close()
        div_row = conn.execute('SELECT name FROM divisions WHERE id = ?', (division_id,)).fetchone()
        div_name = div_row['name'] if div_row else 'this division'
        return jsonify({'error': f'Roll Number {roll_no} is already assigned to another student in {div_name}.'}), 400

    cursor = conn.cursor()
    cursor.execute('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
                   (email, hash_password(password), 'STUDENT'))
    new_user_id = cursor.lastrowid

    cursor.execute('''
        INSERT INTO students (user_id, name, photo, roll_no, prn_no, email, phone, department_id, semester_id, division_id, batch_id, academic_year)
        VALUES (?, ?, '', ?, ?, ?, '', 1, 1, ?, ?, ?)
    ''', (new_user_id, name, roll_no, prn_no, email, division_id, batch_id, academic_year))

    conn.commit()

    # Automatically set session for instant seamless login
    session['user_id'] = new_user_id
    session['email'] = email
    session['role'] = 'STUDENT'
    conn.close()

    return jsonify({
        'message': f'Welcome {name}! Your student account was created successfully.',
        'redirect': '/student/dashboard',
        'role': 'STUDENT',
        'user': {'id': new_user_id, 'email': email, 'role': 'STUDENT'}
    }), 201

import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta

# Free Email OTP Delivery Helper Function
def send_otp_email(recipient_email, otp_code):
    smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))
    smtp_user = os.environ.get('SMTP_USER', '') # e.g. department@gmail.com
    smtp_pass = os.environ.get('SMTP_PASS', '') # e.g. 16-character Google App Password

    if not smtp_user or not smtp_pass:
        print(f"[FREE OTP SERVICE] Sent OTP {otp_code} to {recipient_email} (Console Output Mode)")
        return False, "Console mode active (Configure SMTP_USER & SMTP_PASS for live inbox delivery)"

    try:
        msg = MIMEMultipart()
        msg['From'] = f"ECE Department Portal <{smtp_user}>"
        msg['To'] = recipient_email
        msg['Subject'] = f"Your ECE Portal OTP Code: {otp_code}"

        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #1d4ed8;">ECE Department Portal</h2>
          <p>You requested a Verification OTP for your account (<strong>{recipient_email}</strong>).</p>
          <div style="background: #eff6ff; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #1d4ed8;">{otp_code}</span>
          </div>
          <p style="font-size: 13px; color: #64748b;">This OTP code is valid for 10 minutes. Do not share this code with anyone.</p>
        </div>
        """
        msg.attach(MIMEText(html_body, 'html'))

        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()
        return True, "OTP email sent successfully to your inbox!"
    except Exception as e:
        print(f"[SMTP Error] Failed to send email: {e}")
        return False, f"Email delivery error: {str(e)}"

@app.route('/api/auth/send-otp', methods=['POST'])
def send_otp():
    data = request.get_json() or {}
    email = data.get('email', '').strip()

    if not email:
        return jsonify({'error': 'Email address is required.'}), 400

    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    if not user:
        conn.close()
        return jsonify({'error': 'No registered account found with this email address.'}), 404

    otp_code = str(random.randint(100000, 999999))
    expires_at = (datetime.now() + timedelta(minutes=10)).strftime('%Y-%m-%d %H:%M:%S')

    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO otp_verifications (email, otp_code, expires_at)
        VALUES (?, ?, ?)
    ''', (email, otp_code, expires_at))
    conn.commit()
    conn.close()

    sent_success, msg = send_otp_email(email, otp_code)

    res_payload = {
        'message': f'OTP generated successfully! {msg}',
        'email': email
    }
    if not sent_success:
        res_payload['dev_otp_hint'] = otp_code # Convenient hint if SMTP app password not configured yet

    return jsonify(res_payload)

@app.route('/api/auth/verify-otp', methods=['POST'])
def verify_otp():
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    otp_code = data.get('otp', '').strip()
    new_password = data.get('new_password', '').strip()

    if not email or not otp_code or not new_password:
        return jsonify({'error': 'Email, 6-digit OTP code, and new password are required.'}), 400

    conn = get_db_connection()
    now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    otp_row = conn.execute('''
        SELECT * FROM otp_verifications
        WHERE email = ? AND otp_code = ? AND is_used = 0 AND expires_at >= ?
        ORDER BY id DESC LIMIT 1
    ''', (email, otp_code, now_str)).fetchone()

    if not otp_row:
        conn.close()
        return jsonify({'error': 'Invalid or expired OTP code. Please request a new OTP.'}), 400

    user = conn.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()
    if not user:
        conn.close()
        return jsonify({'error': 'User account not found.'}), 404

    cursor = conn.cursor()
    cursor.execute('UPDATE users SET password_hash = ? WHERE id = ?', (hash_password(new_password), user['id']))
    cursor.execute('UPDATE otp_verifications SET is_used = 1 WHERE id = ?', (otp_row['id'],))
    conn.commit()
    conn.close()

    return jsonify({'message': 'OTP Verified successfully! Your password has been updated. Please sign in.'})

@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    verification_id = data.get('verification_id', '').strip()
    new_password = data.get('new_password', '').strip()

    if not email or not verification_id or not new_password:
        return jsonify({'error': 'Email address, PRN / Teacher ID, and new password are required.'}), 400

    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    if not user:
        conn.close()
        return jsonify({'error': 'No registered account found with this email address.'}), 404

    user_id = user['id']
    role = user['role']
    verified = False

    if role == 'STUDENT':
        st = conn.execute('SELECT id FROM students WHERE user_id = ? AND prn_no = ?', (user_id, verification_id)).fetchone()
        if st:
            verified = True
    elif role in ('HOD', 'TEACHER'):
        tch = conn.execute('SELECT id FROM teachers WHERE user_id = ? AND teacher_id_code = ?', (user_id, verification_id)).fetchone()
        if tch:
            verified = True

    if not verified:
        conn.close()
        return jsonify({'error': 'Verification failed: PRN Number or Teacher ID Code does not match this account.'}), 400

    cursor = conn.cursor()
    cursor.execute('UPDATE users SET password_hash = ? WHERE id = ?', (hash_password(new_password), user_id))
    conn.commit()
    conn.close()

    return jsonify({'message': 'Password reset successfully! You can now log in with your new password.'})

# ----------------------------------------------------
# HOD PASSWORD CHANGE APPROVAL ENDPOINTS
# ----------------------------------------------------

@app.route('/api/auth/request-password-reset', methods=['POST'])
def request_password_reset():
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    prn_no = data.get('prn_no', '').strip()
    new_password = data.get('new_password', '').strip()

    if not email or not prn_no or not new_password:
        return jsonify({'error': 'Email address, PRN Number, and requested new password are required.'}), 400

    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    if not user:
        conn.close()
        return jsonify({'error': 'No registered account found with this email address.'}), 404

    student = conn.execute('SELECT id FROM students WHERE user_id = ? AND prn_no = ?', (user['id'], prn_no)).fetchone()
    if not student:
        conn.close()
        return jsonify({'error': 'Verification failed: PRN Number does not match this student account.'}), 400

    existing_req = conn.execute('SELECT id FROM password_reset_requests WHERE student_id = ? AND status = "PENDING"', (student['id'],)).fetchone()
    if existing_req:
        conn.close()
        return jsonify({'error': 'You already have a pending Password Reset Request submitted to HOD. Please wait for HOD approval.'}), 400

    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO password_reset_requests (student_id, email, requested_password_hash)
        VALUES (?, ?, ?)
    ''', (student['id'], email, hash_password(new_password)))
    conn.commit()
    conn.close()

    return jsonify({'message': 'Password reset request submitted successfully! Pending HOD Approval.'})

@app.route('/api/hod/password-requests', methods=['GET'])
@require_role(['HOD', 'TEACHER'])
def get_password_requests():
    conn = get_db_connection()
    requests = conn.execute('''
        SELECT pr.*, s.name as student_name, s.roll_no, s.prn_no, div.name as division_name, b.name as batch_name
        FROM password_reset_requests pr
        JOIN students s ON pr.student_id = s.id
        JOIN divisions div ON s.division_id = div.id
        JOIN batches b ON s.batch_id = b.id
        ORDER BY pr.id DESC
    ''').fetchall()
    conn.close()
    return jsonify({'requests': [dict(r) for r in requests]})

@app.route('/api/hod/password-requests/<int:req_id>/approve', methods=['POST'])
@require_role(['HOD', 'TEACHER'])
def approve_password_request(req_id):
    conn = get_db_connection()
    req = conn.execute('SELECT * FROM password_reset_requests WHERE id = ?', (req_id,)).fetchone()
    if not req:
        conn.close()
        return jsonify({'error': 'Request not found.'}), 404

    student = conn.execute('SELECT user_id, name FROM students WHERE id = ?', (req['student_id'],)).fetchone()
    teacher = get_current_teacher_id()

    cursor = conn.cursor()
    cursor.execute('UPDATE users SET password_hash = ? WHERE id = ?', (req['requested_password_hash'], student['user_id']))
    cursor.execute('''
        UPDATE password_reset_requests
        SET status = "APPROVED", reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (teacher, req_id))

    cursor.execute('''
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (?, ?, ?, 'SUCCESS')
    ''', (student['user_id'], 'Password Reset Approved!', 'Your password change request has been approved by HOD. You can now log in with your new password.'))

    conn.commit()
    conn.close()
    return jsonify({'message': f'Password change request for {student["name"]} APPROVED by HOD!'})

@app.route('/api/hod/password-requests/<int:req_id>/reject', methods=['POST'])
@require_role(['HOD', 'TEACHER'])
def reject_password_request(req_id):
    data = request.get_json() or {}
    reason = data.get('reason', 'Rejected by HOD').strip()

    conn = get_db_connection()
    req = conn.execute('SELECT * FROM password_reset_requests WHERE id = ?', (req_id,)).fetchone()
    if not req:
        conn.close()
        return jsonify({'error': 'Request not found.'}), 404

    student = conn.execute('SELECT user_id, name FROM students WHERE id = ?', (req['student_id'],)).fetchone()
    teacher = get_current_teacher_id()

    cursor = conn.cursor()
    cursor.execute('''
        UPDATE password_reset_requests
        SET status = "REJECTED", rejection_reason = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (reason, teacher, req_id))

    cursor.execute('''
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (?, ?, ?, 'DANGER')
    ''', (student['user_id'], 'Password Reset Request Rejected', f'Your password change request was rejected by HOD. Reason: {reason}'))

    conn.commit()
    conn.close()
    return jsonify({'message': 'Password change request rejected.'})

@app.route('/api/hod/students/<int:student_id>/reset-password', methods=['POST'])
@require_role(['HOD', 'TEACHER'])
def hod_direct_reset_password(student_id):
    data = request.get_json() or {}
    new_password = data.get('new_password', '').strip()

    if not new_password:
        return jsonify({'error': 'New password is required.'}), 400

    conn = get_db_connection()
    student = conn.execute('SELECT * FROM students WHERE id = ?', (student_id,)).fetchone()
    if not student:
        conn.close()
        return jsonify({'error': 'Student not found.'}), 404

    cursor = conn.cursor()
    cursor.execute('UPDATE users SET password_hash = ? WHERE id = ?', (hash_password(new_password), student['user_id']))
    cursor.execute('''
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (?, ?, ?, 'INFO')
    ''', (student['user_id'], 'Password Updated by HOD', f'HOD has updated your portal password to: {new_password}'))

    conn.commit()
    conn.close()
    return jsonify({'message': f'Password for student {student["name"]} updated successfully by HOD!'})

@app.route('/api/auth/me', methods=['GET'])
@require_auth
def get_me():
    user = get_current_user()
    conn = get_db_connection()
    profile = None
    
    if user['role'] == 'STUDENT':
        row = conn.execute('''
            SELECT s.*, d.name as department_name, d.code as department_code,
                   div.name as division_name, b.name as batch_name
            FROM students s
            JOIN departments d ON s.department_id = d.id
            JOIN divisions div ON s.division_id = div.id
            JOIN batches b ON s.batch_id = b.id
            WHERE s.user_id = ?
        ''', (user['id'],)).fetchone()
        if row:
            profile = dict(row)
    elif user['role'] in ('HOD', 'TEACHER'):
        row = conn.execute('''
            SELECT t.*, d.name as department_name
            FROM teachers t
            JOIN departments d ON t.department_id = d.id
            WHERE t.user_id = ?
        ''', (user['id'],)).fetchone()
        if row:
            profile = dict(row)

    conn.close()
    return jsonify({'user': user, 'profile': profile})

# ----------------------------------------------------
# 2. FILE UPLOADS
# ----------------------------------------------------

@app.route('/uploads/<filename>')
def serve_upload(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# ----------------------------------------------------
# 3. STUDENT MODULE API
# ----------------------------------------------------

@app.route('/api/student/dashboard', methods=['GET'])
@require_role('STUDENT')
def student_dashboard():
    user = get_current_user()
    conn = get_db_connection()
    
    student = conn.execute('SELECT * FROM students WHERE user_id = ?', (user['id'],)).fetchone()
    if not student:
        conn.close()
        return jsonify({'error': 'Student profile not found'}), 404

    student_id = student['id']

    stats = conn.execute('''
        SELECT 
            COUNT(*) as total_certs,
            SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_certs,
            SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved_certs,
            SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_certs
        FROM certificates
        WHERE student_id = ?
    ''', (student_id,)).fetchone()

    act_stats = conn.execute('''
        SELECT COALESCE(SUM(asub.lecture_count), 0) as total_activities
        FROM activity_records ar
        JOIN activity_subjects asub ON ar.id = asub.activity_record_id
        WHERE ar.student_id = ?
    ''', (student_id,)).fetchone()

    subject_summary = conn.execute('''
        SELECT s.name as subject_name, s.code as subject_code, 
               COALESCE(SUM(asub.lecture_count), 0) as total_count,
               asub.activity_type
        FROM activity_records ar
        JOIN activity_subjects asub ON ar.id = asub.activity_record_id
        JOIN subjects s ON asub.subject_id = s.id
        WHERE ar.student_id = ?
        GROUP BY s.id, asub.activity_type
        ORDER BY total_count DESC
    ''', (student_id,)).fetchall()

    recent_activities = conn.execute('''
        SELECT ar.activity_date, c.title as certificate_title, c.event_name,
               s.name as subject_name, asub.activity_type, asub.lecture_count
        FROM activity_records ar
        JOIN certificates c ON ar.certificate_id = c.id
        JOIN activity_subjects asub ON ar.id = asub.activity_record_id
        JOIN subjects s ON asub.subject_id = s.id
        WHERE ar.student_id = ?
        ORDER BY ar.created_at DESC
        LIMIT 5
    ''', (student_id,)).fetchall()

    # Cumulative Subject Counters for Student
    cumulative_subjects = conn.execute('''
        SELECT s.name as subject_name, s.code as subject_code, asub.activity_type, SUM(asub.lecture_count) as cumulative_count
        FROM activity_records ar
        JOIN activity_subjects asub ON ar.id = asub.activity_record_id
        JOIN subjects s ON asub.subject_id = s.id
        JOIN certificates c ON ar.certificate_id = c.id
        WHERE ar.student_id = ? AND c.status = 'APPROVED'
        GROUP BY s.id, asub.activity_type
        ORDER BY cumulative_count DESC
    ''', (student_id,)).fetchall()

    conn.close()

    return jsonify({
        'total_certificates': stats['total_certs'] or 0,
        'pending_certificates': stats['pending_certs'] or 0,
        'approved_certificates': stats['approved_certs'] or 0,
        'rejected_certificates': stats['rejected_certs'] or 0,
        'total_activities': act_stats['total_activities'] or 0,
        'subject_summary': [dict(r) for r in subject_summary],
        'cumulative_subject_counters': [dict(r) for r in cumulative_subjects],
        'recent_activities': [dict(r) for r in recent_activities]
    })

@app.route('/api/student/certificates', methods=['GET', 'POST'])
@require_role('STUDENT')
def student_certificates():
    user = get_current_user()
    conn = get_db_connection()
    student = conn.execute('SELECT id FROM students WHERE user_id = ?', (user['id'],)).fetchone()
    
    if not student:
        conn.close()
        return jsonify({'error': 'Student not found'}), 404

    student_id = student['id']

    if request.method == 'POST':
        title = request.form.get('title', '').strip()
        event_name = request.form.get('event_name', '').strip()
        category = request.form.get('category', '').strip()
        cert_date = request.form.get('certificate_date', '').strip()
        description = request.form.get('description', '').strip()

        if not title or not event_name or not category or not cert_date:
            conn.close()
            return jsonify({'error': 'Please fill all required fields.'}), 400

        if 'file' not in request.files:
            conn.close()
            return jsonify({'error': 'Certificate file is required.'}), 400

        file = request.files['file']
        if file.filename == '':
            conn.close()
            return jsonify({'error': 'No selected file.'}), 400

        if not allowed_file(file.filename):
            conn.close()
            return jsonify({'error': 'Invalid file type. Allowed: PDF, PNG, JPG, JPEG.'}), 400

        clean_name = secure_filename(file.filename) or "certificate.pdf"
        filename = f"{student_id}_{int(datetime.now().timestamp())}_{clean_name}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        file_url = f"/uploads/{filename}"

        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO certificates (student_id, title, event_name, category, certificate_date, description, file_url, file_name, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
        ''', (student_id, title, event_name, category, cert_date, description, file_url, filename))
        
        cert_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return jsonify({
            'message': 'Certificate submitted successfully and is waiting for teacher approval.',
            'id': cert_id
        }), 201

    certs = conn.execute('''
        SELECT c.*, t.name as reviewer_name
        FROM certificates c
        LEFT JOIN teachers t ON c.reviewed_by = t.id
        WHERE c.student_id = ?
        ORDER BY c.created_at DESC
    ''', (student_id,)).fetchall()
    conn.close()

    return jsonify({'certificates': [dict(c) for c in certs]})

@app.route('/api/student/timetable', methods=['GET'])
@require_role('STUDENT')
def student_timetable():
    user = get_current_user()
    conn = get_db_connection()
    student = conn.execute('SELECT * FROM students WHERE user_id = ?', (user['id'],)).fetchone()
    
    if not student:
        conn.close()
        return jsonify({'error': 'Student not found'}), 404

    entries = conn.execute('''
        SELECT t.*, s.name as subject_name, s.code as subject_code, s.credits,
               ts.name as time_slot_name, ts.start_time, ts.end_time, ts.duration_minutes, ts.display_order,
               tch.name as teacher_name, b.name as batch_name
        FROM timetable t
        JOIN time_slots ts ON t.time_slot_id = ts.id
        LEFT JOIN subjects s ON t.subject_id = s.id
        LEFT JOIN teachers tch ON t.teacher_id = tch.id
        LEFT JOIN batches b ON t.batch_id = b.id
        WHERE t.department_id = ?
          AND t.semester_id = ?
          AND t.division_id = ?
          AND t.academic_year = ?
          AND (t.batch_id IS NULL OR t.batch_id = ?)
        ORDER BY ts.display_order ASC, t.day_of_week ASC
    ''', (student['department_id'], student['semester_id'], student['division_id'], student['academic_year'], student['batch_id'])).fetchall()

    conn.close()
    return jsonify({'timetable': [dict(e) for e in entries]})

@app.route('/api/student/notifications', methods=['GET', 'POST'])
@require_auth
def notifications():
    user = get_current_user()
    conn = get_db_connection()

    if request.method == 'POST':
        conn.execute('UPDATE notifications SET is_read = 1 WHERE user_id = ?', (user['id'],))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Notifications marked as read'})

    rows = conn.execute('''
        SELECT * FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 20
    ''', (user['id'],)).fetchall()
    conn.close()
    return jsonify({'notifications': [dict(r) for r in rows]})

# ----------------------------------------------------
# 4. HOD & TEACHER ERP MODULE API
# ----------------------------------------------------

@app.route('/api/hod/teachers', methods=['GET', 'POST'])
@require_role(['HOD', 'TEACHER'])
def hod_teachers():
    user = get_current_user()
    conn = get_db_connection()
    
    hod = conn.execute('SELECT department_id FROM teachers WHERE user_id = ?', (user['id'],)).fetchone()
    dept_id = hod['department_id'] if hod else 1

    if request.method == 'POST':
        data = request.get_json() or {}
        name = data.get('name', '').strip()
        teacher_id_code = data.get('teacher_id_code', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()
        designation = data.get('designation', 'Assistant Professor').strip()

        if not name or not teacher_id_code or not email or not password:
            conn.close()
            return jsonify({'error': 'All fields are required.'}), 400

        existing = conn.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()
        if existing:
            conn.close()
            return jsonify({'error': 'Email address is already registered.'}), 400

        cursor = conn.cursor()
        cursor.execute('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
                       (email, hash_password(password), 'TEACHER'))
        new_user_id = cursor.lastrowid

        cursor.execute('''
            INSERT INTO teachers (user_id, teacher_id_code, name, email, department_id, designation)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (new_user_id, teacher_id_code, name, email, dept_id, designation))
        
        conn.commit()
        conn.close()
        return jsonify({'message': f'Faculty member {name} registered successfully.'}), 201

    teachers = conn.execute('''
        SELECT t.*, d.name as department_name
        FROM teachers t
        JOIN departments d ON t.department_id = d.id
        WHERE t.department_id = ?
        ORDER BY t.id ASC
    ''', (dept_id,)).fetchall()
    conn.close()
    return jsonify({'teachers': [dict(t) for t in teachers]})


@app.route('/api/hod/students', methods=['GET', 'POST'])
@require_role(['HOD', 'TEACHER'])
def hod_students():
    user = get_current_user()
    conn = get_db_connection()
    
    hod = conn.execute('SELECT department_id FROM teachers WHERE user_id = ?', (user['id'],)).fetchone()
    dept_id = hod['department_id'] if hod else 1

    if request.method == 'POST':
        data = request.get_json() or {}
        name = data.get('name', '').strip()
        roll_no = data.get('roll_no', '').strip()
        prn_no = data.get('prn_no', '').strip()
        division_id = data.get('division_id')
        batch_id = data.get('batch_id')
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()
        academic_year = data.get('academic_year', '2026-27').strip()

        if not name or not roll_no or not prn_no or not division_id or not batch_id or not email or not password:
            conn.close()
            return jsonify({'error': 'All fields are required.'}), 400

        existing = conn.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()
        if existing:
            conn.close()
            return jsonify({'error': 'Student email is already registered.'}), 400

        existing_prn = conn.execute('SELECT id FROM students WHERE prn_no = ?', (prn_no,)).fetchone()
        if existing_prn:
            conn.close()
            return jsonify({'error': f'PRN Number {prn_no} is already assigned to another student.'}), 400

        existing_roll = conn.execute('SELECT id FROM students WHERE division_id = ? AND roll_no = ?', (division_id, roll_no)).fetchone()
        if existing_roll:
            conn.close()
            div_row = conn.execute('SELECT name FROM divisions WHERE id = ?', (division_id,)).fetchone()
            div_name = div_row['name'] if div_row else 'this division'
            return jsonify({'error': f'Roll Number {roll_no} is already assigned to another student in {div_name}.'}), 400

        cursor = conn.cursor()
        cursor.execute('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
                       (email, hash_password(password), 'STUDENT'))
        new_user_id = cursor.lastrowid

        cursor.execute('''
            INSERT INTO students (user_id, name, photo, roll_no, prn_no, email, phone, department_id, semester_id, division_id, batch_id, academic_year)
            VALUES (?, ?, '', ?, ?, ?, '', ?, 1, ?, ?, ?)
        ''', (new_user_id, name, roll_no, prn_no, email, dept_id, division_id, batch_id, academic_year))

        conn.commit()
        conn.close()
        return jsonify({'message': f'Student {name} registered successfully into Division.'}), 201

    students = conn.execute('''
        SELECT s.*, div.name as division_name, b.name as batch_name
        FROM students s
        JOIN divisions div ON s.division_id = div.id
        JOIN batches b ON s.batch_id = b.id
        WHERE s.department_id = ?
        ORDER BY div.name ASC, s.roll_no ASC
    ''', (dept_id,)).fetchall()
    conn.close()
    return jsonify({'students': [dict(s) for s in students]})


@app.route('/api/hod/teachers/<int:teacher_id>', methods=['DELETE'])
@require_role(['HOD', 'TEACHER'])
def delete_teacher(teacher_id):
    conn = get_db_connection()
    t = conn.execute('SELECT user_id, name FROM teachers WHERE id = ?', (teacher_id,)).fetchone()
    if not t:
        conn.close()
        return jsonify({'error': 'Teacher not found'}), 404

    # Delete teacher profile and user account
    conn.execute('DELETE FROM teachers WHERE id = ?', (teacher_id,))
    conn.execute('DELETE FROM users WHERE id = ?', (t['user_id'],))
    conn.commit()
    conn.close()
    return jsonify({'message': f'Faculty member {t["name"]} deleted successfully.'})


@app.route('/api/hod/students/<int:student_id>', methods=['DELETE'])
@require_role(['HOD', 'TEACHER'])
def delete_student(student_id):
    conn = get_db_connection()
    s = conn.execute('SELECT user_id, name FROM students WHERE id = ?', (student_id,)).fetchone()
    if not s:
        conn.close()
        return jsonify({'error': 'Student not found'}), 404

    # Delete student profile and user account
    conn.execute('DELETE FROM students WHERE id = ?', (student_id,))
    conn.execute('DELETE FROM users WHERE id = ?', (s['user_id'],))
    conn.commit()
    conn.close()
    return jsonify({'message': f'Student {s["name"]} deleted successfully.'})


@app.route('/api/teacher/dashboard', methods=['GET'])
@require_role(['HOD', 'TEACHER'])
def teacher_dashboard():
    user = get_current_user()
    conn = get_db_connection()
    
    teacher = conn.execute('''
        SELECT t.*, d.name as department_name
        FROM teachers t
        JOIN departments d ON t.department_id = d.id
        WHERE t.user_id = ?
    ''', (user['id'],)).fetchone()

    if not teacher:
        conn.close()
        return jsonify({'error': 'Teacher profile not found'}), 404

    teacher_id = teacher['id']

    cert_stats = conn.execute('''
        SELECT 
            SUM(CASE WHEN c.status = 'PENDING' THEN 1 ELSE 0 END) as pending_certs,
            SUM(CASE WHEN c.status = 'APPROVED' THEN 1 ELSE 0 END) as approved_certs,
            SUM(CASE WHEN c.status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_certs
        FROM certificates c
        JOIN students s ON c.student_id = s.id
        WHERE s.department_id = ?
    ''', (teacher['department_id'],)).fetchone()

    total_students = conn.execute('''
        SELECT COUNT(*) as count FROM students WHERE department_id = ?
    ''', (teacher['department_id'],)).fetchone()['count']

    today_name = datetime.now().strftime('%A')
    today_classes = conn.execute('''
        SELECT t.*, s.name as subject_name, s.code as subject_code,
               ts.name as time_slot_name, ts.start_time, ts.end_time,
               div.name as division_name, b.name as batch_name
        FROM timetable t
        JOIN time_slots ts ON t.time_slot_id = ts.id
        LEFT JOIN subjects s ON t.subject_id = s.id
        LEFT JOIN divisions div ON t.division_id = div.id
        LEFT JOIN batches b ON t.batch_id = b.id
        WHERE t.teacher_id = ? AND t.day_of_week = ?
        ORDER BY ts.display_order ASC
    ''', (teacher_id, today_name)).fetchall()

    conn.close()

    return jsonify({
        'teacher': dict(teacher),
        'pending_certificates': cert_stats['pending_certs'] or 0,
        'approved_certificates': cert_stats['approved_certs'] or 0,
        'rejected_certificates': cert_stats['rejected_certs'] or 0,
        'total_students': total_students,
        'today_classes': [dict(c) for c in today_classes],
        'today_name': today_name
    })

@app.route('/api/teacher/certificates/pending', methods=['GET'])
@require_role(['HOD', 'TEACHER'])
def pending_certificates():
    user = get_current_user()
    conn = get_db_connection()
    teacher = conn.execute('SELECT department_id FROM teachers WHERE user_id = ?', (user['id'],)).fetchone()
    
    if not teacher:
        conn.close()
        return jsonify({'error': 'Teacher not found'}), 404

    pending_list = conn.execute('''
        SELECT c.*, s.name as student_name, s.roll_no, s.prn_no, s.academic_year,
               div.name as division_name, b.name as batch_name, d.name as department_name
        FROM certificates c
        JOIN students s ON c.student_id = s.id
        JOIN divisions div ON s.division_id = div.id
        JOIN batches b ON s.batch_id = b.id
        JOIN departments d ON s.department_id = d.id
        WHERE s.department_id = ? AND c.status = 'PENDING'
        ORDER BY c.created_at ASC
    ''', (teacher['department_id'],)).fetchall()

    conn.close()
    return jsonify({'pending_certificates': [dict(p) for p in pending_list]})

@app.route('/api/teacher/certificates/<int:cert_id>/preview-calculation', methods=['GET'])
@require_role(['HOD', 'TEACHER'])
def preview_certificate_calculation(cert_id):
    res = get_applicable_lectures_for_certificate(cert_id)
    return jsonify(res)

@app.route('/api/teacher/certificates/<int:cert_id>/approve', methods=['POST'])
@require_role(['HOD', 'TEACHER'])
def approve_certificate(cert_id):
    data = request.get_json() or {}
    selected_entry_ids = data.get('selected_entry_ids') # Optional list of entry IDs chosen by teacher

    user = get_current_user()
    conn = get_db_connection()
    teacher = conn.execute('SELECT id FROM teachers WHERE user_id = ?', (user['id'],)).fetchone()
    conn.close()

    if not teacher:
        return jsonify({'error': 'Teacher not found'}), 404

    result = calculate_activities_for_certificate(cert_id, teacher_id=teacher['id'], selected_entry_ids=selected_entry_ids)
    return jsonify(result)

@app.route('/api/teacher/certificates/<int:cert_id>/reject', methods=['POST'])
@require_role(['HOD', 'TEACHER'])
def reject_certificate(cert_id):
    data = request.get_json() or {}
    reason = data.get('reason', '').strip()

    if not reason:
        return jsonify({'error': 'Rejection reason is mandatory.'}), 400

    user = get_current_user()
    conn = get_db_connection()
    teacher = conn.execute('SELECT id FROM teachers WHERE user_id = ?', (user['id'],)).fetchone()

    if not teacher:
        conn.close()
        return jsonify({'error': 'Teacher not found'}), 404

    cert = conn.execute('SELECT c.*, s.user_id FROM certificates c JOIN students s ON c.student_id = s.id WHERE c.id = ?', (cert_id,)).fetchone()
    if not cert:
        conn.close()
        return jsonify({'error': 'Certificate not found'}), 404

    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    conn.execute('''
        UPDATE certificates
        SET status = 'REJECTED', rejection_reason = ?, reviewed_by = ?, reviewed_at = ?
        WHERE id = ?
    ''', (reason, teacher['id'], now, cert_id))

    conn.execute('''
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (?, ?, ?, 'WARNING')
    ''', (cert['user_id'], 'Certificate Rejected', f"Your certificate '{cert['title']}' was REJECTED. Reason: {reason}", 'WARNING'))

    conn.commit()
    conn.close()

    return jsonify({'message': 'Certificate rejected successfully.', 'id': cert_id})

@app.route('/api/teacher/students', methods=['GET'])
@require_role(['HOD', 'TEACHER'])
def search_students():
    query = request.args.get('q', '').strip()
    div_id = request.args.get('division_id')
    batch_id = request.args.get('batch_id')

    conn = get_db_connection()
    sql = '''
        SELECT s.*, d.name as department_name, div.name as division_name, b.name as batch_name
        FROM students s
        JOIN departments d ON s.department_id = d.id
        JOIN divisions div ON s.division_id = div.id
        JOIN batches b ON s.batch_id = b.id
        WHERE 1=1
    '''
    params = []

    if query:
        sql += ' AND (s.name LIKE ? OR s.roll_no LIKE ? OR s.prn_no LIKE ? OR s.email LIKE ?)'
        q_wildcard = f"%{query}%"
        params.extend([q_wildcard, q_wildcard, q_wildcard, q_wildcard])

    if div_id:
        sql += ' AND s.division_id = ?'
        params.append(div_id)

    if batch_id:
        sql += ' AND s.batch_id = ?'
        params.append(batch_id)

    sql += ' ORDER BY s.roll_no ASC'
    rows = conn.execute(sql, params).fetchall()
    conn.close()

    return jsonify({'students': [dict(r) for r in rows]})

@app.route('/api/teacher/students/<int:student_id>', methods=['GET'])
@require_role(['HOD', 'TEACHER'])
def student_detail_profile(student_id):
    conn = get_db_connection()
    student = conn.execute('''
        SELECT s.*, d.name as department_name, div.name as division_name, b.name as batch_name
        FROM students s
        JOIN departments d ON s.department_id = d.id
        JOIN divisions div ON s.division_id = div.id
        JOIN batches b ON s.batch_id = b.id
        WHERE s.id = ?
    ''', (student_id,)).fetchone()

    if not student:
        conn.close()
        return jsonify({'error': 'Student not found'}), 404

    certs = conn.execute('SELECT * FROM certificates WHERE student_id = ? ORDER BY created_at DESC', (student_id,)).fetchall()
    
    activities = conn.execute('''
        SELECT ar.activity_date, c.title as certificate_title, c.event_name,
               sub.name as subject_name, sub.code as subject_code, asub.activity_type, asub.lecture_count
        FROM activity_records ar
        JOIN certificates c ON ar.certificate_id = c.id
        JOIN activity_subjects asub ON ar.id = asub.activity_record_id
        JOIN subjects sub ON asub.subject_id = sub.id
        WHERE ar.student_id = ?
        ORDER BY ar.activity_date DESC
    ''', (student_id,)).fetchall()

    summary = conn.execute('''
        SELECT sub.name as subject_name, sub.code as subject_code,
               SUM(asub.lecture_count) as total_count
        FROM activity_records ar
        JOIN activity_subjects asub ON ar.id = asub.activity_record_id
        JOIN subjects sub ON asub.subject_id = sub.id
        WHERE ar.student_id = ?
        GROUP BY sub.id
        ORDER BY total_count DESC
    ''', (student_id,)).fetchall()

    conn.close()
    return jsonify({
        'student': dict(student),
        'certificates': [dict(c) for c in certs],
        'activities': [dict(a) for a in activities],
        'summary': [dict(s) for s in summary]
    })

# ----------------------------------------------------
# 5. TIMETABLE & META API FOR TEACHER & STUDENT
# ----------------------------------------------------

@app.route('/api/meta', methods=['GET'])
@require_auth
def get_meta_data():
    conn = get_db_connection()
    departments = conn.execute('SELECT * FROM departments ORDER BY name ASC').fetchall()
    semesters = conn.execute('SELECT * FROM semesters ORDER BY semester_number ASC').fetchall()
    divisions = conn.execute('''
        SELECT div.*, d.name as department_name 
        FROM divisions div 
        JOIN departments d ON div.department_id = d.id 
        ORDER BY div.name ASC
    ''').fetchall()
    batches = conn.execute('SELECT * FROM batches ORDER BY name ASC').fetchall()
    subjects = conn.execute('SELECT * FROM subjects ORDER BY code ASC').fetchall()
    time_slots = conn.execute('SELECT * FROM time_slots ORDER BY display_order ASC').fetchall()
    teachers = conn.execute('SELECT * FROM teachers ORDER BY name ASC').fetchall()
    conn.close()

    return jsonify({
        'departments': [dict(d) for d in departments],
        'semesters': [dict(s) for s in semesters],
        'divisions': [dict(d) for d in divisions],
        'batches': [dict(b) for b in batches],
        'subjects': [dict(s) for s in subjects],
        'time_slots': [dict(t) for t in time_slots],
        'teachers': [dict(t) for t in teachers]
    })

@app.route('/api/timetable', methods=['GET', 'POST'])
@require_auth
def manage_timetable():
    conn = get_db_connection()

    if request.method == 'POST':
        user = get_current_user()
        if user['role'] != 'TEACHER':
            conn.close()
            return jsonify({'error': '403 ACCESS DENIED: Only teachers can modify timetable.'}), 403

        data = request.get_json() or {}
        entry_id = data.get('id')
        dept_id = data.get('department_id')
        sem_id = data.get('semester_id')
        div_id = data.get('division_id')
        batch_id = data.get('batch_id')
        acad_year = data.get('academic_year', '2026-27')
        day_of_week = data.get('day_of_week')
        time_slot_id = data.get('time_slot_id')
        subject_id = data.get('subject_id')
        teacher_id = data.get('teacher_id')
        room = data.get('room', '')
        activity_type = data.get('activity_type', 'THEORY')
        is_break = 1 if activity_type == 'BREAK' else 0
        is_free = 1 if activity_type == 'FREE_PERIOD' else 0

        sub_slot = data.get('sub_slot', 0)

        if not dept_id or not sem_id or not div_id or not day_of_week or not time_slot_id:
            conn.close()
            return jsonify({'error': 'Department, Semester, Division, Day, and Time Slot are required.'}), 400

        if activity_type in ['THEORY', 'LAB', 'TUTORIAL'] and not subject_id:
            conn.close()
            return jsonify({'error': f'Subject is required for {activity_type} activity.'}), 400

        cursor = conn.cursor()

        if entry_id:
            cursor.execute('''
                UPDATE timetable
                SET department_id=?, semester_id=?, division_id=?, batch_id=?, academic_year=?,
                    day_of_week=?, time_slot_id=?, sub_slot=?, subject_id=?, teacher_id=?, room=?,
                    activity_type=?, is_break=?, is_free_period=?, updated_at=CURRENT_TIMESTAMP
                WHERE id=?
            ''', (dept_id, sem_id, div_id, batch_id or None, acad_year, day_of_week, time_slot_id, sub_slot,
                  subject_id or None, teacher_id or None, room, activity_type, is_break, is_free, entry_id))
            msg = 'Timetable entry updated successfully.'
        else:
            cursor.execute('''
                INSERT INTO timetable (department_id, semester_id, division_id, batch_id, academic_year,
                                       day_of_week, time_slot_id, sub_slot, subject_id, teacher_id, room,
                                       activity_type, is_break, is_free_period)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (dept_id, sem_id, div_id, batch_id or None, acad_year, day_of_week, time_slot_id, sub_slot,
                  subject_id or None, teacher_id or None, room, activity_type, is_break, is_free))
            entry_id = cursor.lastrowid
            msg = 'Timetable entry created successfully.'

        conn.commit()
        conn.close()
        return jsonify({'message': msg, 'id': entry_id})

    dept_id = request.args.get('department_id')
    sem_id = request.args.get('semester_id')
    div_id = request.args.get('division_id')
    acad_year = request.args.get('academic_year', '2026-27')

    sql = '''
        SELECT t.*, s.name as subject_name, s.code as subject_code,
               ts.name as time_slot_name, ts.start_time, ts.end_time, ts.duration_minutes, ts.display_order,
               tch.name as teacher_name, b.name as batch_name, div.name as division_name
        FROM timetable t
        JOIN time_slots ts ON t.time_slot_id = ts.id
        JOIN divisions div ON t.division_id = div.id
        LEFT JOIN subjects s ON t.subject_id = s.id
        LEFT JOIN teachers tch ON t.teacher_id = tch.id
        LEFT JOIN batches b ON t.batch_id = b.id
        WHERE 1=1
    '''
    params = []
    if dept_id:
        sql += ' AND t.department_id = ?'
        params.append(dept_id)
    if sem_id:
        sql += ' AND t.semester_id = ?'
        params.append(sem_id)
    if div_id:
        sql += ' AND t.division_id = ?'
        params.append(div_id)
    if acad_year:
        sql += ' AND t.academic_year = ?'
        params.append(acad_year)

    sql += ' ORDER BY ts.display_order ASC, t.batch_id ASC'
    rows = conn.execute(sql, params).fetchall()
    conn.close()

    return jsonify({'timetable': [dict(r) for r in rows]})

@app.route('/api/timetable/<int:entry_id>', methods=['DELETE'])
@require_role(['HOD', 'TEACHER'])
def delete_timetable_entry(entry_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM timetable WHERE id = ?', (entry_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Timetable entry deleted successfully.'})

@app.route('/api/timetable/copy', methods=['POST'])
@require_role(['HOD', 'TEACHER'])
def copy_timetable():
    data = request.get_json() or {}
    source_div_id = data.get('source_division_id')
    source_day = data.get('source_day')
    target_days = data.get('target_days', [])
    target_div_id = data.get('target_division_id')

    if not source_div_id:
        return jsonify({'error': 'Source division ID is required.'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    copied_count = 0

    if target_days and source_day:
        source_entries = cursor.execute('SELECT * FROM timetable WHERE division_id = ? AND day_of_week = ?', (source_div_id, source_day)).fetchall()
        for t_day in target_days:
            cursor.execute('DELETE FROM timetable WHERE division_id = ? AND day_of_week = ?', (source_div_id, t_day))
            for entry in source_entries:
                e = dict(entry)
                cursor.execute('''
                    INSERT INTO timetable (department_id, semester_id, division_id, batch_id, academic_year,
                                           day_of_week, time_slot_id, subject_id, teacher_id, room,
                                           activity_type, is_break, is_free_period)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (e['department_id'], e['semester_id'], e['division_id'], e['batch_id'], e['academic_year'],
                      t_day, e['time_slot_id'], e['subject_id'], e['teacher_id'], e['room'],
                      e['activity_type'], e['is_break'], e['is_free_period']))
                copied_count += 1

    conn.commit()
    conn.close()

    return jsonify({'message': f'Successfully copied {copied_count} timetable entries.'})

# ----------------------------------------------------
# 6. MASTER REPORTS API
# ----------------------------------------------------

@app.route('/api/reports', methods=['GET'])
@require_role(['HOD', 'TEACHER'])
def generate_reports():
    dept_id = request.args.get('department_id')
    sem_id = request.args.get('semester_id')
    div_id = request.args.get('division_id')
    batch_id = request.args.get('batch_id')
    status = request.args.get('status')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    conn = get_db_connection()
    
    sql = '''
        SELECT c.id as certificate_id, c.title, c.event_name, c.category, c.certificate_date, c.status,
               s.id as student_id, s.name as student_name, s.roll_no, s.prn_no,
               d.name as department_name, div.name as division_name, b.name as batch_name,
               COALESCE(SUM(asub.lecture_count), 0) as total_activities
        FROM certificates c
        JOIN students s ON c.student_id = s.id
        JOIN departments d ON s.department_id = d.id
        JOIN divisions div ON s.division_id = div.id
        JOIN batches b ON s.batch_id = b.id
        LEFT JOIN activity_records ar ON c.id = ar.certificate_id
        LEFT JOIN activity_subjects asub ON ar.id = asub.activity_record_id
        WHERE 1=1
    '''
    params = []

    if dept_id:
        sql += ' AND s.department_id = ?'
        params.append(dept_id)
    if sem_id:
        sql += ' AND s.semester_id = ?'
        params.append(sem_id)
    if div_id:
        sql += ' AND s.division_id = ?'
        params.append(div_id)
    if batch_id:
        sql += ' AND s.batch_id = ?'
        params.append(batch_id)
    if status:
        sql += ' AND c.status = ?'
        params.append(status)
    if start_date:
        sql += ' AND c.certificate_date >= ?'
        params.append(start_date)
    if end_date:
        sql += ' AND c.certificate_date <= ?'
        params.append(end_date)

    sql += ' GROUP BY c.id ORDER BY c.certificate_date DESC'
    rows = conn.execute(sql, params).fetchall()

    reports = []
    for r in rows:
        item = dict(r)
        # Fetch subject breakdown for this certificate
        sub_rows = conn.execute('''
            SELECT sub.name as subject_name, sub.code as subject_code, asub.activity_type, asub.lecture_count
            FROM activity_records ar
            JOIN activity_subjects asub ON ar.id = asub.activity_record_id
            JOIN subjects sub ON asub.subject_id = sub.id
            WHERE ar.certificate_id = ?
        ''', (item['certificate_id'],)).fetchall()
        
        item['subject_breakdown'] = [dict(s) for s in sub_rows]
        item['breakdown_summary'] = ", ".join([f"{s['subject_code']}: {int(s['lecture_count'])} ({s['activity_type']})" for s in sub_rows]) if sub_rows else "None"
        reports.append(item)

    # Fetch Cumulative Subject Counters per Student across ALL approved certificates
    cumulative_query = '''
        SELECT s.id as student_id, s.name as student_name, s.roll_no, s.prn_no, div.name as division_name, b.name as batch_name,
               sub.name as subject_name, sub.code as subject_code, SUM(asub.lecture_count) as total_accumulated_count
        FROM students s
        JOIN divisions div ON s.division_id = div.id
        JOIN batches b ON s.batch_id = b.id
        JOIN activity_records ar ON s.id = ar.student_id
        JOIN activity_subjects asub ON ar.id = asub.activity_record_id
        JOIN subjects sub ON asub.subject_id = sub.id
        JOIN certificates c ON ar.certificate_id = c.id
        WHERE c.status = 'APPROVED'
        GROUP BY s.id, sub.id
        ORDER BY s.roll_no ASC, sub.code ASC
    '''
    cumulative_rows = conn.execute(cumulative_query).fetchall()

    # Group cumulative counters by student
    student_map = {}
    for crow in cumulative_rows:
        crow_dict = dict(crow)
        sid = crow_dict['student_id']
        if sid not in student_map:
            student_map[sid] = {
                'student_name': crow_dict['student_name'],
                'roll_no': crow_dict['roll_no'],
                'prn_no': crow_dict['prn_no'],
                'division_name': crow_dict['division_name'],
                'batch_name': crow_dict['batch_name'],
                'total_accumulated_activities': 0,
                'subjects': []
            }
        cnt = int(crow_dict['total_accumulated_count'])
        student_map[sid]['total_accumulated_activities'] += cnt
        student_map[sid]['subjects'].append({
            'subject_code': crow_dict['subject_code'],
            'subject_name': crow_dict['subject_name'],
            'count': cnt
        })

    conn.close()

    return jsonify({
        'reports': reports,
        'cumulative_student_summary': list(student_map.values())
    })

# ----------------------------------------------------
# 7. ROUTING TO SPA INDEX
# ----------------------------------------------------

@app.route('/')
@app.route('/<path:path>')
def serve_spa(path=''):
    return render_template('index.html')

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
