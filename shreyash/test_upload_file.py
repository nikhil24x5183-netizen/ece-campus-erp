import urllib.request
import json
import uuid

# 1. Login as Student
req = urllib.request.Request('http://127.0.0.1:5000/api/auth/login', method='POST')
req.add_header('Content-Type', 'application/json')
body = json.dumps({'email': 'student@campus.edu', 'password': 'Student@123'}).encode()

with urllib.request.urlopen(req, data=body) as res:
    cookie = res.headers['Set-Cookie']

# 2. Upload Certificate using multipart/form-data
boundary = '----WebKitFormBoundary' + uuid.uuid4().hex
headers = {
    'Cookie': cookie,
    'Content-Type': f'multipart/form-data; boundary={boundary}'
}

data_fields = [
    ('title', 'Hackathon Certificate 2026'),
    ('event_name', 'Tech Fest'),
    ('category', 'Hackathon'),
    ('certificate_date', '2026-08-10'),
    ('description', 'Test Upload File')
]

body_parts = []
for name, value in data_fields:
    body_parts.append(f'--{boundary}'.encode())
    body_parts.append(f'Content-Disposition: form-data; name="{name}"\r\n'.encode())
    body_parts.append(value.encode())

# Attach file part
body_parts.append(f'--{boundary}'.encode())
body_parts.append(b'Content-Disposition: form-data; name="file"; filename="test_cert.pdf"\r\nContent-Type: application/pdf\r\n')
body_parts.append(b'%PDF-1.4 Dummy PDF Content')
body_parts.append(f'--{boundary}--\r\n'.encode())

payload = b'\r\n'.join(body_parts)

req2 = urllib.request.Request('http://127.0.0.1:5000/api/student/certificates', data=payload, headers=headers, method='POST')

try:
    with urllib.request.urlopen(req2) as res2:
        print("Upload Response Status:", res2.status)
        print("Upload Response Body:", res2.read().decode())
except urllib.error.HTTPError as e:
    print("Upload HTTP Error Code:", e.code)
    print("Upload HTTP Error Body:", e.read().decode())
