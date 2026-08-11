import urllib.request
import json

cookie_header = None

def api_call(url, method='GET', data=None):
    global cookie_header
    req = urllib.request.Request(url, method=method)
    if cookie_header:
        req.add_header('Cookie', cookie_header)
    if data:
        req.add_header('Content-Type', 'application/json')
        body = json.dumps(data).encode('utf-8')
    else:
        body = None
    
    try:
        with urllib.request.urlopen(req, data=body) as response:
            if 'Set-Cookie' in response.headers:
                cookie_header = response.headers['Set-Cookie']
            return response.status, json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

# 1. Login as Student 1 (Div A)
status, res = api_call('http://127.0.0.1:5000/api/auth/login', 'POST', {
    'email': 'student@campus.edu',
    'password': 'Student@123'
})
print("Student 1 Login Status:", status, res)

# 2. Get Student 1 Dashboard Data
status, dash_res = api_call('http://127.0.0.1:5000/api/student/dashboard')
print("Student 1 Dashboard API Status:", status)
print("Dashboard Data Keys:", list(dash_res.keys()) if isinstance(dash_res, dict) else dash_res)
print("Dashboard Response Payload:", json.dumps(dash_res, indent=2))

# 3. Login as Student 2 (Div B)
cookie_header = None
status, res2 = api_call('http://127.0.0.1:5000/api/auth/login', 'POST', {
    'email': 'student2@campus.edu',
    'password': 'Student@123'
})
print("\nStudent 2 Login Status:", status, res2)

status, dash_res2 = api_call('http://127.0.0.1:5000/api/student/dashboard')
print("Student 2 Dashboard API Status:", status)
print("Dashboard Response Payload:", json.dumps(dash_res2, indent=2))
