from database import get_db_connection
from timetable_engine import calculate_activities_for_certificate

def test_workflow():
    print("==================================================")
    print("STARTING CAMPUS ERP END-TO-END VERIFICATION TEST")
    print("==================================================")

    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Fetch Student 1 (Rahul Sharma - Batch A2)
    student = cursor.execute('''
        SELECT s.*, div.name as division_name, b.name as batch_name
        FROM students s
        JOIN divisions div ON s.division_id = div.id
        JOIN batches b ON s.batch_id = b.id
        WHERE s.roll_no = '23'
    ''').fetchone()

    print(f"Student: {student['name']}, Roll: {student['roll_no']}, PRN: {student['prn_no']}, Division: {student['division_name']}, Batch: {student['batch_name']}")

    # 2. Fetch pending certificate (Date: Monday 2026-08-10)
    cert = cursor.execute('SELECT * FROM certificates WHERE student_id = ? AND status = "PENDING"', (student['id'],)).fetchone()
    print(f"Testing Pending Certificate ID {cert['id']}: '{cert['title']}' on {cert['certificate_date']}")

    # 3. Fetch Teacher (Prof. Deepa Sharma)
    teacher = cursor.execute('SELECT * FROM teachers WHERE teacher_id_code = "T101"').fetchone()

    # 4. Trigger Certificate Approval & Automatic Timetable Engine
    res = calculate_activities_for_certificate(cert['id'], teacher_id=teacher['id'])
    print("\n--- Automatic Calculation Result ---")
    print(f"Success: {res['success']}")
    print(f"Day of Week: {res['day_of_week']}")
    print(f"Total Activity Units Calculated: {res['total_activities_added']}")
    print("Subjects Breakdown:")
    for sub in res['subjects']:
        print(f"  - {sub['subject_name']} ({sub['subject_code']}) [{sub['activity_type']}]: +{sub['count']} unit")

    # 5. Verification checks
    subject_codes = [s['subject_code'] for s in res['subjects']]
    
    assert 'FDS' in subject_codes, "FDS Theory must be included!"
    assert 'SS' in subject_codes, "SS Theory must be included!"
    assert 'OEC' in subject_codes, "OEC Theory must be included!"
    assert 'PME' in subject_codes, "PME Theory must be included!"
    assert 'SDC-PP-SES' in subject_codes, "SDC-PP Lab for Batch A2 MUST be included!"
    assert 'SDC-MS-SES' not in subject_codes, "SDC-MS Lab for Batch A1 must NOT be included for Batch A2 student!"
    assert 'DSA-AC-AD' not in subject_codes, "DSA-AC Lab for Batch A3 must NOT be included for Batch A2 student!"
    
    print("\n==================================================")
    print("ALL VERIFICATION CHECKS PASSED PERFECTLY! 100% SUCCESS")
    print("==================================================")

if __name__ == '__main__':
    test_workflow()
