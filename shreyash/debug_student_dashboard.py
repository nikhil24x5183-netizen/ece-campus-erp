import urllib.request
import json

req = urllib.request.Request('http://127.0.0.1:5000/api/auth/login', method='POST')
req.add_header('Content-Type', 'application/json')
body = json.dumps({'email': 'student@campus.edu', 'password': 'Student@123'}).encode()

with urllib.request.urlopen(req, data=body) as res:
    cookie = res.headers['Set-Cookie']

req2 = urllib.request.Request('http://127.0.0.1:5000/api/student/dashboard', method='GET')
req2.add_header('Cookie', cookie)

try:
    with urllib.request.urlopen(req2) as res2:
        print("Success:", res2.read().decode())
except urllib.error.HTTPError as e:
    print("HTTP ERROR CODE:", e.code)
    print("HTTP ERROR BODY:", e.read().decode())
