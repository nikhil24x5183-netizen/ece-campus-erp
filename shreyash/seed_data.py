from database import init_db, get_db_connection
from auth import hash_password

def seed():
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    print("Seeding exact official timetable with split and continuous 2-hour slot distinction...")

    cursor.execute("DELETE FROM notifications;")
    cursor.execute("DELETE FROM activity_subjects;")
    cursor.execute("DELETE FROM activity_records;")
    cursor.execute("DELETE FROM certificates;")
    cursor.execute("DELETE FROM timetable;")
    cursor.execute("DELETE FROM time_slots;")
    cursor.execute("DELETE FROM subjects;")
    cursor.execute("DELETE FROM teachers;")
    cursor.execute("DELETE FROM students;")
    cursor.execute("DELETE FROM batches;")
    cursor.execute("DELETE FROM divisions;")
    cursor.execute("DELETE FROM semesters;")
    cursor.execute("DELETE FROM departments;")
    cursor.execute("DELETE FROM users;")
    cursor.execute("DELETE FROM activity_rules;")

    # Activity Rules
    activity_rules = [
        ('THEORY', 1.0, 60),
        ('LAB', 1.0, 120),
        ('TUTORIAL', 1.0, 60),
        ('LIBRARY', 0.0, 120),
        ('BREAK', 0.0, 0),
        ('FREE_PERIOD', 0.0, 0)
    ]
    cursor.executemany('''
        INSERT INTO activity_rules (activity_type, units_per_session, minutes_per_unit)
        VALUES (?, ?, ?)
    ''', activity_rules)

    # Department
    cursor.execute("INSERT INTO departments (name, code) VALUES (?, ?)", 
                   ("Electronics and Computer Engineering", "ECE"))
    dept_id = cursor.lastrowid

    # Semester
    cursor.execute("INSERT INTO semesters (semester_number) VALUES (?)", (3,))
    sem_id = cursor.lastrowid

    # Divisions A and B
    cursor.execute("INSERT INTO divisions (department_id, semester_id, name) VALUES (?, ?, ?)", 
                   (dept_id, sem_id, "SE(ECE)-A"))
    div_a_id = cursor.lastrowid

    cursor.execute("INSERT INTO divisions (department_id, semester_id, name) VALUES (?, ?, ?)", 
                   (dept_id, sem_id, "SE(ECE)-B"))
    div_b_id = cursor.lastrowid

    # Batches for SE(ECE)-A
    batches_a = {}
    for bname in ['A1', 'A2', 'A3']:
        cursor.execute("INSERT INTO batches (division_id, name) VALUES (?, ?)", (div_a_id, bname))
        batches_a[bname] = cursor.lastrowid

    # Batches for SE(ECE)-B
    batches_b = {}
    for bname in ['B1', 'B2', 'B3']:
        cursor.execute("INSERT INTO batches (division_id, name) VALUES (?, ?)", (div_b_id, bname))
        batches_b[bname] = cursor.lastrowid

    # HOD User & Profile
    cursor.execute("INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)",
                   ('teacher@campus.edu', hash_password('Teacher@123'), 'HOD'))
    hod_user_id = cursor.lastrowid

    cursor.execute('''
        INSERT INTO teachers (user_id, teacher_id_code, name, email, department_id, designation)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (hod_user_id, 'HOD101', 'Dr. S. K. Kulkarni (HOD)', 'teacher@campus.edu', dept_id, 'Head of Department'))
    teacher_id = cursor.lastrowid

    # Faculty Teacher Account
    cursor.execute("INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)",
                   ('faculty@campus.edu', hash_password('Faculty@123'), 'TEACHER'))
    faculty_user_id = cursor.lastrowid

    cursor.execute('''
        INSERT INTO teachers (user_id, teacher_id_code, name, email, department_id, designation)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (faculty_user_id, 'T102', 'Prof. Deepa Sharma', 'faculty@campus.edu', dept_id, 'Associate Professor'))

    # Student Accounts
    cursor.execute("INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)",
                   ('student@campus.edu', hash_password('Student@123'), 'STUDENT'))
    student1_user_id = cursor.lastrowid

    cursor.execute("INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)",
                   ('student2@campus.edu', hash_password('Student@123'), 'STUDENT'))
    student2_user_id = cursor.lastrowid

    cursor.execute('''
        INSERT INTO students (user_id, name, photo, roll_no, prn_no, email, phone, department_id, semester_id, division_id, batch_id, academic_year)
        VALUES (?, ?, '', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (student1_user_id, 'Rahul Sharma', '23', '20240123', 'student@campus.edu', '9876543210', dept_id, sem_id, div_a_id, batches_a['A2'], '2026-27'))
    student1_id = cursor.lastrowid

    cursor.execute('''
        INSERT INTO students (user_id, name, photo, roll_no, prn_no, email, phone, department_id, semester_id, division_id, batch_id, academic_year)
        VALUES (?, ?, '', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (student2_user_id, 'Priya Verma', '14', '20240114', 'student2@campus.edu', '9876543211', dept_id, sem_id, div_b_id, batches_b['B1'], '2026-27'))
    student2_id = cursor.lastrowid

    # Subjects matching official timetable image
    subjects_data = [
        ('Fundamentals of Data Structures', 'FDS-DL-TH-105', 'THEORY', 4),
        ('Fundamentals of Data Structures AC', 'FDS-AC-TH-105', 'THEORY', 4),
        ('Signals and Systems', 'SS-SS-TH-105', 'THEORY', 4),
        ('Open Elective Course VG 107', 'OEC-VG-TH-107', 'THEORY', 3),
        ('Open Elective Course VG 105', 'OEC-VG-TH-105', 'THEORY', 3),
        ('Open Elective Course VG TUT', 'OEC-VG-TUT-105', 'TUTORIAL', 3),
        ('Principles of Management', 'PME-MS-TH-107', 'THEORY', 3),
        ('Data Structures DK', 'DS-DK-TH-105', 'THEORY', 4),
        ('Skill Development Course PP', 'SDC-PP-TH-105', 'THEORY', 3),
        ('Skill Development Course MS Lab', 'SDC-MS-SES', 'LAB', 2),
        ('Skill Development Course PP Lab', 'SDC-PP-SES', 'LAB', 2),
        ('DSA Lab AC', 'DSA-AC-AD', 'LAB', 2),
        ('DSA Lab DK AC', 'DSA-DK-AC', 'LAB', 2),
        ('DSA Lab DL AC', 'DSA-DL-AC', 'LAB', 2),
        ('DSA Lab AC ID', 'DSA-AC-ID', 'LAB', 2),
        ('VSEC Lab SG ID AC', 'VSEC-SG-ID/AC', 'LAB', 2),
        ('VEC Tutorial DL', 'VEC-DL-TUT-105', 'TUTORIAL', 1),
        ('VEC Theory DL', 'VEC-DL-TH-107', 'THEORY', 2),
        ('Library Session', 'Library', 'THEORY', 0)
    ]

    subject_ids = {}
    for sname, scode, stype, scredits in subjects_data:
        cursor.execute('''
            INSERT INTO subjects (name, code, department_id, semester_id, credits, type)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (sname, scode, dept_id, sem_id, scredits, stype))
        subject_ids[scode] = cursor.lastrowid

    # Time Slots matching uploaded college timetable
    time_slots_data = [
        ('08.30 TO 09.30', '08:30', '09:30', 60, 0, 1),
        ('09.30 TO 10.30', '09:30', '10:30', 60, 0, 2),
        ('SHORT BREAK 10.30-10.40', '10:30', '10:40', 10, 1, 3),
        ('10.40 TO 11.40', '10:40', '11:40', 60, 0, 4),
        ('11.40 TO 12.40', '11:40', '12:40', 60, 0, 5),
        ('LUNCH BREAK 12.40-01.30', '12:40', '13:30', 50, 1, 6),
        ('01.30 TO 03.30', '13:30', '15:30', 120, 0, 7)
    ]

    slot_ids = []
    for sname, stime, etime, dur, is_brk, order in time_slots_data:
        cursor.execute('''
            INSERT INTO time_slots (name, start_time, end_time, duration_minutes, is_break, display_order)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (sname, stime, etime, dur, is_brk, order))
        slot_ids.append(cursor.lastrowid)

    def add_tt(div_id, batch_id, day, slot_idx, sub_code, room='105', act_type='THEORY', sub_slot=0):
        sub_id = subject_ids.get(sub_code)
        cursor.execute('''
            INSERT INTO timetable (department_id, semester_id, division_id, batch_id, academic_year, day_of_week, time_slot_id, sub_slot, subject_id, teacher_id, room, activity_type)
            VALUES (?, ?, ?, ?, '2026-27', ?, ?, ?, ?, ?, ?, ?)
        ''', (dept_id, sem_id, div_id, batch_id, day, slot_ids[slot_idx], sub_slot, sub_id, teacher_id, room, act_type))

    # MONDAY
    add_tt(div_a_id, None, 'Monday', 0, 'FDS-DL-TH-105', 'Room 105')
    add_tt(div_a_id, None, 'Monday', 1, 'SS-SS-TH-105', 'Room 105')
    add_tt(div_a_id, None, 'Monday', 3, 'OEC-VG-TH-107', 'Room 107')
    add_tt(div_a_id, None, 'Monday', 4, 'PME-MS-TH-107', 'Room 107')
    # Mon Div A 01:30-03:30: Continuous 2-Hour Parallel Lab (sub_slot = 0)
    add_tt(div_a_id, batches_a['A1'], 'Monday', 6, 'SDC-MS-SES', 'Lab 201', 'LAB', 0)
    add_tt(div_a_id, batches_a['A2'], 'Monday', 6, 'SDC-PP-SES', 'Lab 202', 'LAB', 0)
    add_tt(div_a_id, batches_a['A3'], 'Monday', 6, 'DSA-AC-AD', 'Lab 203', 'LAB', 0)

    # Mon Div B 08:30-10:30 Parallel Lab
    add_tt(div_b_id, batches_b['B1'], 'Monday', 0, 'SDC-MS-SES', 'Lab 201', 'LAB')
    add_tt(div_b_id, batches_b['B2'], 'Monday', 0, 'VSEC-SG-ID/AC', 'Lab 202', 'LAB')
    add_tt(div_b_id, batches_b['B3'], 'Monday', 0, 'VSEC-SG-ID/AC', 'Lab 203', 'LAB')
    add_tt(div_b_id, None, 'Monday', 3, 'FDS-AC-TH-105', 'Room 105')
    add_tt(div_b_id, None, 'Monday', 4, 'SS-SS-TH-105', 'Room 105')
    # Mon Div B 01:30-03:30: Split into 2 separate 1-hr lectures with vertical dividing line
    add_tt(div_b_id, None, 'Monday', 6, 'OEC-VG-TH-105', 'Room 105', 'THEORY', 1)
    add_tt(div_b_id, None, 'Monday', 6, 'VEC-DL-TH-107', 'Room 105', 'THEORY', 2)

    # TUESDAY
    # Tue Div A 08:30-10:30 Parallel Lab
    add_tt(div_a_id, batches_a['A1'], 'Tuesday', 0, 'VSEC-SG-ID/AC', 'Lab 201', 'LAB')
    add_tt(div_a_id, batches_a['A2'], 'Tuesday', 0, 'DSA-DL-AC', 'Lab 202', 'LAB')
    add_tt(div_a_id, batches_a['A3'], 'Tuesday', 0, 'VSEC-SG-ID/AC', 'Lab 203', 'LAB')
    add_tt(div_a_id, None, 'Tuesday', 3, 'FDS-DL-TH-105', 'Room 105')
    add_tt(div_a_id, None, 'Tuesday', 4, 'DS-DK-TH-105', 'Room 105')
    # Tue Div A 01:30-03:30: Split into 2 separate 1-hr lectures with vertical line
    add_tt(div_a_id, None, 'Tuesday', 6, 'VEC-DL-TUT-105', 'Room 105', 'TUTORIAL', 1)
    add_tt(div_a_id, None, 'Tuesday', 6, 'OEC-VG-TUT-105', 'Room 105', 'TUTORIAL', 2)

    add_tt(div_b_id, None, 'Tuesday', 0, 'OEC-VG-TH-105', 'Room 105')
    add_tt(div_b_id, None, 'Tuesday', 1, 'DS-DK-TH-105', 'Room 105')
    add_tt(div_b_id, None, 'Tuesday', 3, 'PME-MS-TH-107', 'Room 107')
    add_tt(div_b_id, None, 'Tuesday', 4, 'SDC-PP-TH-105', 'Room 105')
    # Tue Div B 01:30-03:30: Continuous 2-Hour Parallel Lab (sub_slot = 0)
    add_tt(div_b_id, batches_b['B1'], 'Tuesday', 6, 'DSA-DK-AC', 'Lab 201', 'LAB', 0)
    add_tt(div_b_id, batches_b['B2'], 'Tuesday', 6, 'DSA-DK-AC', 'Lab 202', 'LAB', 0)
    add_tt(div_b_id, batches_b['B3'], 'Tuesday', 6, 'VSEC-SG-ID/AC', 'Lab 203', 'LAB', 0)

    # WEDNESDAY
    add_tt(div_a_id, None, 'Wednesday', 0, 'OEC-VG-TH-105', 'Room 105')
    add_tt(div_a_id, None, 'Wednesday', 1, 'DS-DK-TH-105', 'Room 105')
    add_tt(div_a_id, batches_a['A1'], 'Wednesday', 3, 'VSEC-SG-ID/AC', 'Lab 201', 'LAB')
    add_tt(div_a_id, batches_a['A2'], 'Wednesday', 3, 'VSEC-SG-ID/AC', 'Lab 202', 'LAB')
    add_tt(div_a_id, batches_a['A3'], 'Wednesday', 3, 'SDC-MS-SES', 'Lab 203', 'LAB')
    # Wed Div A 01:30-03:30: Continuous 2-Hour Parallel Lab (sub_slot = 0)
    add_tt(div_a_id, batches_a['A1'], 'Wednesday', 6, 'DSA-DL-AC', 'Lab 201', 'LAB', 0)
    add_tt(div_a_id, batches_a['A2'], 'Wednesday', 6, 'DSA-DL-AC', 'Lab 202', 'LAB', 0)
    add_tt(div_a_id, batches_a['A3'], 'Wednesday', 6, 'SDC-MS-SES', 'Lab 203', 'LAB', 0)

    add_tt(div_b_id, batches_b['B1'], 'Wednesday', 0, 'VSEC-SG-ID/AC', 'Lab 201', 'LAB')
    add_tt(div_b_id, batches_b['B2'], 'Wednesday', 0, 'VSEC-SG-ID/AC', 'Lab 202', 'LAB')
    add_tt(div_b_id, batches_b['B3'], 'Wednesday', 0, 'SDC-MS-SES', 'Lab 203', 'LAB')
    add_tt(div_b_id, None, 'Wednesday', 3, 'OEC-VG-TUT-105', 'Room 107', 'TUTORIAL')
    add_tt(div_b_id, None, 'Wednesday', 4, 'FDS-AC-TH-105', 'Room 105')
    # Wed Div B 01:30-03:30: Continuous 2-Hour Library Session (sub_slot = 0)
    add_tt(div_b_id, None, 'Wednesday', 6, 'Library', 'Reading Hall', 'LIBRARY', 0)

    # THURSDAY
    add_tt(div_a_id, None, 'Thursday', 0, 'SDC-PP-TH-105', 'Room 105')
    add_tt(div_a_id, None, 'Thursday', 1, 'SS-SS-TH-105', 'Room 105')
    add_tt(div_a_id, batches_a['A1'], 'Thursday', 3, 'SDC-PP-SES', 'Lab 201', 'LAB')
    add_tt(div_a_id, batches_a['A2'], 'Thursday', 3, 'SDC-MS-SES', 'Lab 202', 'LAB')
    add_tt(div_a_id, batches_a['A3'], 'Thursday', 3, 'DSA-DK-AC', 'Lab 203', 'LAB')
    # Thu Div A 01:30-03:30: Split into 2 separate 1-hr lectures with vertical line
    add_tt(div_a_id, None, 'Thursday', 6, 'VEC-DL-TH-107', 'Room 107', 'THEORY', 1)
    add_tt(div_a_id, None, 'Thursday', 6, 'PME-MS-TH-107', 'Room 107', 'THEORY', 2)

    add_tt(div_b_id, batches_b['B1'], 'Thursday', 0, 'VSEC-SG-ID/AC', 'Lab 201', 'LAB')
    add_tt(div_b_id, batches_b['B2'], 'Thursday', 0, 'SDC-MS-SES', 'Lab 202', 'LAB')
    add_tt(div_b_id, batches_b['B3'], 'Thursday', 0, 'DSA-AC-ID', 'Lab 203', 'LAB')
    add_tt(div_b_id, None, 'Thursday', 3, 'DS-DK-TH-105', 'Room 105')
    add_tt(div_b_id, None, 'Thursday', 4, 'SDC-PP-TH-105', 'Room 105')
    # Thu Div B 01:30-03:30: Continuous 2-Hour Parallel Lab (sub_slot = 0)
    add_tt(div_b_id, batches_b['B1'], 'Thursday', 6, 'SDC-PP-SES', 'Lab 201', 'LAB', 0)
    add_tt(div_b_id, batches_b['B2'], 'Thursday', 6, 'DSA-DK-AC', 'Lab 202', 'LAB', 0)
    add_tt(div_b_id, batches_b['B3'], 'Thursday', 6, 'SDC-PP-SES', 'Lab 203', 'LAB', 0)

    # FRIDAY
    add_tt(div_a_id, batches_a['A1'], 'Friday', 0, 'DSA-DL-AC', 'Lab 201', 'LAB')
    add_tt(div_a_id, batches_a['A2'], 'Friday', 0, 'VSEC-SG-ID/AC', 'Lab 202', 'LAB')
    add_tt(div_a_id, batches_a['A3'], 'Friday', 0, 'VSEC-SG-ID/AC', 'Lab 203', 'LAB')
    add_tt(div_a_id, None, 'Friday', 3, 'OEC-VG-TH-105', 'Room 105')
    add_tt(div_a_id, None, 'Friday', 4, 'SDC-PP-TH-105', 'Room 105')
    # Fri Div A 01:30-03:30: Continuous 2-Hour Library Session (sub_slot = 0)
    add_tt(div_a_id, None, 'Friday', 6, 'Library', 'Reading Hall', 'LIBRARY', 0)

    add_tt(div_b_id, None, 'Friday', 0, 'OEC-VG-TH-105', 'Room 105')
    add_tt(div_b_id, None, 'Friday', 1, 'SS-SS-TH-105', 'Room 105')
    add_tt(div_b_id, None, 'Friday', 3, 'VEC-DL-TH-107', 'Room 107')
    add_tt(div_b_id, None, 'Friday', 4, 'PME-MS-TH-107', 'Room 107')
    # Fri Div B 01:30-03:30: Continuous 2-Hour Parallel Lab (sub_slot = 0)
    add_tt(div_b_id, batches_b['B1'], 'Friday', 6, 'DSA-DK-AC', 'Lab 201', 'LAB', 0)
    add_tt(div_b_id, batches_b['B2'], 'Friday', 6, 'SDC-PP-SES', 'Lab 202', 'LAB', 0)
    add_tt(div_b_id, batches_b['B3'], 'Friday', 6, 'DSA-AC-AD', 'Lab 203', 'LAB', 0)

    # Insert Breaks
    for day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']:
        for divid in [div_a_id, div_b_id]:
            cursor.execute('''INSERT INTO timetable (department_id, semester_id, division_id, batch_id, academic_year, day_of_week, time_slot_id, sub_slot, subject_id, teacher_id, room, activity_type, is_break) VALUES (?, ?, ?, NULL, '2026-27', ?, ?, 0, NULL, NULL, '', 'BREAK', 1)''', (dept_id, sem_id, divid, day, slot_ids[2]))
            cursor.execute('''INSERT INTO timetable (department_id, semester_id, division_id, batch_id, academic_year, day_of_week, time_slot_id, sub_slot, subject_id, teacher_id, room, activity_type, is_break) VALUES (?, ?, ?, NULL, '2026-27', ?, ?, 0, NULL, NULL, '', 'BREAK', 1)''', (dept_id, sem_id, divid, day, slot_ids[5]))

    conn.commit()
    conn.close()
    print("Database re-seeded successfully with exact 1-hr vs 2-hr continuous slots.")

if __name__ == '__main__':
    seed()
