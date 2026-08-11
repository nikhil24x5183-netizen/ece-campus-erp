from datetime import datetime
from database import get_db_connection

def get_day_of_week(date_str):
    """
    Parses 'YYYY-MM-DD' and returns full day name e.g., 'Monday'
    """
    date_obj = datetime.strptime(date_str, '%Y-%m-%d')
    return date_obj.strftime('%A')

def get_applicable_lectures_for_certificate(certificate_id):
    """
    Fetches student details & certificate date to return all scheduled lectures/labs for teacher review.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cert = cursor.execute('''
        SELECT c.*, s.id as student_id, s.department_id, s.semester_id, s.division_id, s.batch_id, s.academic_year, s.name as student_name
        FROM certificates c
        JOIN students s ON c.student_id = s.id
        WHERE c.id = ?
    ''', (certificate_id,)).fetchone()

    if not cert:
        conn.close()
        return {'success': False, 'message': 'Certificate not found', 'lectures': []}

    cert = dict(cert)
    cert_date = cert['certificate_date']
    day_name = get_day_of_week(cert_date)

    timetable_entries = cursor.execute('''
        SELECT t.id as entry_id, t.*, s.name as subject_name, s.code as subject_code, s.credits,
               ts.name as time_slot_name, ts.start_time, ts.end_time, ts.duration_minutes,
               b.name as batch_name
        FROM timetable t
        LEFT JOIN subjects s ON t.subject_id = s.id
        LEFT JOIN time_slots ts ON t.time_slot_id = ts.id
        LEFT JOIN batches b ON t.batch_id = b.id
        WHERE t.department_id = ?
          AND t.semester_id = ?
          AND t.division_id = ?
          AND t.academic_year = ?
          AND t.day_of_week = ?
          AND (t.batch_id IS NULL OR t.batch_id = ?)
          AND t.activity_type NOT IN ('BREAK', 'FREE_PERIOD')
        ORDER BY ts.display_order ASC, ts.start_time ASC
    ''', (
        cert['department_id'],
        cert['semester_id'],
        cert['division_id'],
        cert['academic_year'],
        day_name,
        cert['batch_id']
    )).fetchall()

    conn.close()

    lectures = [dict(e) for e in timetable_entries if e['subject_id']]

    return {
        'success': True,
        'certificate': cert,
        'day_of_week': day_name,
        'lectures': lectures
    }

def calculate_activities_for_certificate(certificate_id, teacher_id=None, selected_entry_ids=None):
    """
    Executes the timetable matching & activity calculation workflow based on teacher's selected lectures/labs:
    1. Set certificate status = 'APPROVED'
    2. Retrieve student details
    3. Filter timetable entries by selected_entry_ids if provided
    4. Store Activity Record and Activity Subject breakdown for selected lectures
    5. Emit Notification to Student
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cert = cursor.execute('''
        SELECT c.*, s.id as student_id, s.department_id, s.semester_id, s.division_id, s.batch_id, s.academic_year, s.user_id, s.name as student_name
        FROM certificates c
        JOIN students s ON c.student_id = s.id
        WHERE c.id = ?
    ''', (certificate_id,)).fetchone()

    if not cert:
        conn.close()
        return {'success': False, 'message': 'Certificate not found'}

    cert = dict(cert)
    cert_date = cert['certificate_date']
    day_name = get_day_of_week(cert_date)

    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    cursor.execute('''
        UPDATE certificates
        SET status = 'APPROVED', reviewed_by = ?, reviewed_at = ?
        WHERE id = ?
    ''', (teacher_id, now, certificate_id))

    rules_rows = cursor.execute('SELECT * FROM activity_rules').fetchall()
    rules = {row['activity_type']: row['units_per_session'] for row in rules_rows} if rules_rows else {
        'THEORY': 1.0,
        'LAB': 1.0,
        'TUTORIAL': 1.0,
        'LIBRARY': 0.0
    }

    timetable_entries = cursor.execute('''
        SELECT t.id as entry_id, t.*, s.name as subject_name, s.code as subject_code, ts.duration_minutes
        FROM timetable t
        LEFT JOIN subjects s ON t.subject_id = s.id
        LEFT JOIN time_slots ts ON t.time_slot_id = ts.id
        WHERE t.department_id = ?
          AND t.semester_id = ?
          AND t.division_id = ?
          AND t.academic_year = ?
          AND t.day_of_week = ?
          AND (t.batch_id IS NULL OR t.batch_id = ?)
          AND t.activity_type NOT IN ('BREAK', 'FREE_PERIOD')
        ORDER BY ts.display_order ASC, ts.start_time ASC
    ''', (
        cert['department_id'],
        cert['semester_id'],
        cert['division_id'],
        cert['academic_year'],
        day_name,
        cert['batch_id']
    )).fetchall()

    cursor.execute('''
        INSERT INTO activity_records (student_id, certificate_id, activity_date, calculation_status)
        VALUES (?, ?, ?, 'COMPLETED')
    ''', (cert['student_id'], certificate_id, cert_date))
    
    activity_record_id = cursor.lastrowid

    total_activities_added = 0
    calculated_subjects = []

    for entry in timetable_entries:
        entry = dict(entry)
        
        # If teacher specified selected_entry_ids, only process selected ones!
        if selected_entry_ids is not None:
            if str(entry['entry_id']) not in [str(x) for x in selected_entry_ids]:
                continue

        act_type = entry['activity_type']
        count = rules.get(act_type, 1.0)
        
        if count > 0 and entry['subject_id']:
            duration = entry['duration_minutes'] or 60
            cursor.execute('''
                INSERT INTO activity_subjects (activity_record_id, subject_id, batch_id, activity_type, lecture_count, duration_minutes)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                activity_record_id,
                entry['subject_id'],
                entry['batch_id'],
                act_type,
                count,
                duration
            ))
            total_activities_added += count
            calculated_subjects.append({
                'subject_name': entry['subject_name'],
                'subject_code': entry['subject_code'],
                'activity_type': act_type,
                'count': count
            })

    notif_msg = f"Your certificate '{cert['title']}' for '{cert['event_name']}' was APPROVED. {total_activities_added} activities recorded for {day_name} ({cert_date})."
    cursor.execute('''
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (?, ?, ?, 'SUCCESS')
    ''', (cert['user_id'], "Certificate Approved", notif_msg))

    conn.commit()
    conn.close()

    return {
        'success': True,
        'certificate_id': certificate_id,
        'day_of_week': day_name,
        'total_activities_added': total_activities_added,
        'subjects': calculated_subjects,
        'message': f"Certificate approved successfully! {total_activities_added} activity units calculated for {day_name}."
    }
