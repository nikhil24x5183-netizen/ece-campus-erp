import urllib.request
import json

def test_hod():
    # 1. Login as HOD
    req = urllib.request.Request('http://127.0.0.1:5000/api/auth/login', method='POST')
    req.add_header('Content-Type', 'application/json')
    body = json.dumps({'email': 'teacher@campus.edu', 'password': 'Teacher@123'}).encode()

    with urllib.request.urlopen(req, data=body) as res:
        cookie = res.headers['Set-Cookie']
        login_res = json.loads(res.read().decode())
        print("HOD Login Status:", res.status, login_res['role'], login_res['redirect'])

    headers = {'Cookie': cookie, 'Content-Type': 'application/json'}

    # 2. Add New Teacher
    t_payload = json.dumps({
        'name': 'Prof. R. K. Joshi',
        'teacher_id_code': 'T105',
        'email': 'rkjoshi@campus.edu',
        'password': 'Teacher@123',
        'designation': 'Assistant Professor'
    }).encode()
    req_t = urllib.request.Request('http://127.0.0.1:5000/api/hod/teachers', data=t_payload, headers=headers, method='POST')
    with urllib.request.urlopen(req_t) as res_t:
        print("Add Teacher Status:", res_t.status, res_t.read().decode())

    # 3. Add New Student
    s_payload = json.dumps({
        'name': 'Aniket Patil',
        'roll_no': '35',
        'prn_no': '20240135',
        'division_id': 1,
        'batch_id': 2,
        'email': 'aniket@campus.edu',
        'password': 'Student@123'
    }).encode()
    req_s = urllib.request.Request('http://127.0.0.1:5000/api/hod/students', data=s_payload, headers=headers, method='POST')
    with urllib.request.urlopen(req_s) as res_s:
        print("Add Student Status:", res_s.status, res_s.read().decode())

if __name__ == '__main__':
    test_hod()
