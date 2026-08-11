import urllib.request
import json

def test_features():
    # 1. Test Student Self-Registration (Public Sign Up)
    reg_payload = json.dumps({
        'name': 'Sonal Deshmukh',
        'roll_no': '42',
        'prn_no': '20240142',
        'division_id': 1,
        'batch_id': 3,
        'email': 'sonal@campus.edu',
        'password': 'Student@123'
    }).encode()

    req_reg = urllib.request.Request('http://127.0.0.1:5000/api/auth/register-student', data=reg_payload, headers={'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(req_reg) as res:
        print("Self-Registration Status:", res.status, res.read().decode())

    # 2. HOD Login
    req = urllib.request.Request('http://127.0.0.1:5000/api/auth/login', method='POST')
    req.add_header('Content-Type', 'application/json')
    body = json.dumps({'email': 'teacher@campus.edu', 'password': 'Teacher@123'}).encode()

    with urllib.request.urlopen(req, data=body) as res:
        cookie = res.headers['Set-Cookie']

    headers = {'Cookie': cookie, 'Content-Type': 'application/json'}

    # 3. Fetch teachers and delete one
    req_t = urllib.request.Request('http://127.0.0.1:5000/api/hod/teachers', headers=headers, method='GET')
    with urllib.request.urlopen(req_t) as res_t:
        t_data = json.loads(res_t.read().decode())
        teachers = t_data.get('teachers', [])
        print("Current Teachers Count:", len(teachers))
        
        # Delete faculty if found
        faculty = [t for t in teachers if t['teacher_id_code'] != 'HOD101']
        if faculty:
            del_id = faculty[0]['id']
            req_del = urllib.request.Request(f'http://127.0.0.1:5000/api/hod/teachers/{del_id}', headers=headers, method='DELETE')
            with urllib.request.urlopen(req_del) as res_del:
                print("Delete Teacher Response:", res_del.status, res_del.read().decode())

if __name__ == '__main__':
    test_features()
