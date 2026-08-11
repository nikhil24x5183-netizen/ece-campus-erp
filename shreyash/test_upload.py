import urllib.request
import urllib.parse
import json

# 1. Login as Student
login_data = json.dumps({'email': 'student@campus.edu', 'password': 'Student@123'}).encode('utf-8')
req = urllib.request.Request('http://127.0.0.1:5000/api/auth/login', data=login_data, headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req) as resp:
        cookies = resp.headers.get('Set-Cookie')
        print("Login status:", resp.status)
        print("Set-Cookie:", cookies)

        # 2. Upload Certificate using multipart/form-data
        boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
        body = []

        def add_field(name, value):
            body.append(f'--{boundary}')
            body.append(f'Content-Disposition: form-data; name="{name}"')
            body.append('')
            body.append(value)

        add_field('title', 'Test Hackathon Certificate')
        add_field('event_name', 'Tech Fest 2026')
        add_field('category', 'Hackathon')
        add_field('certificate_date', '2026-08-10')
        add_field('description', 'First place winner')

        # Add file field
        body.append(f'--{boundary}')
        body.append('Content-Disposition: form-data; name="file"; filename="test_cert.pdf"')
        body.append('Content-Type: application/pdf')
        body.append('')
        body.append('%PDF-1.4 Dummy PDF Content')
        body.append(f'--{boundary}--')
        body.append('')

        payload = '\r\n'.join(body).encode('utf-8')

        upload_req = urllib.request.Request(
            'http://127.0.0.1:5000/api/student/certificates',
            data=payload,
            headers={
                'Content-Type': f'multipart/form-data; boundary={boundary}',
                'Cookie': cookies
            }
        )

        with urllib.request.urlopen(upload_req) as up_resp:
            print("Upload Response Status:", up_resp.status)
            print("Upload Response Body:", up_resp.read().decode('utf-8'))

except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print("Error content:", e.read().decode('utf-8'))
except Exception as ex:
    print("Exception:", ex)
