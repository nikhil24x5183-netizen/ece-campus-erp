import os
import json
import urllib.request
import urllib.error

VERCEL_TOKEN = "vca_BQuu9ChDu3n6Pfh6YQnCshpoYkWDSFKogLqmBtQ0tC8NAA5rXt340sjz"
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))

def get_files_to_deploy():
    files = []
    rel_paths = [
        'app.py',
        'database.py',
        'auth.py',
        'seed_data.py',
        'requirements.txt',
        'vercel.json',
        'templates/index.html',
        'static/css/main.css',
        'static/css/timetable.css',
        'static/js/api.js',
        'static/js/app.js',
        'static/js/views/auth.js',
        'static/js/views/hod.js',
        'static/js/views/teacher.js',
        'static/js/views/student.js',
        'static/js/views/reports.js',
        'static/js/views/timetable.js',
        'static/js/utils/toast.js',
        'static/js/utils/exporter.js',
        'static/manifest.json'
    ]

    for rel_path in rel_paths:
        abs_path = os.path.join(PROJECT_DIR, rel_path)
        if os.path.exists(abs_path):
            with open(abs_path, 'r', encoding='utf-8') as f:
                content = f.read()
            files.append({
                'file': rel_path,
                'data': content
            })
    return files

def deploy():
    print("Preparing Vercel deployment payload...")
    files = get_files_to_deploy()
    print(f"Bundled {len(files)} core project files.")

    payload = {
        'name': 'ece-campus-management',
        'files': files,
        'target': 'production'
    }

    req = urllib.request.Request(
        'https://api.vercel.com/v13/deployments',
        data=json.dumps(payload).encode('utf-8'),
        headers={
            'Authorization': f'Bearer {VERCEL_TOKEN}',
            'Content-Type': 'application/json'
        },
        method='POST'
    )

    try:
        print("Sending deployment request to Vercel API...")
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            print("Vercel API Response Received!")
            print("Status:", res_data.get('readyState'))
            print("Live URL:", f"https://{res_data.get('url')}")
            if 'alias' in res_data and res_data['alias']:
                print("Production Aliases:", res_data['alias'])
            return res_data
    except urllib.error.HTTPError as e:
        error_content = e.read().decode('utf-8')
        print(f"HTTP Error {e.code}: {error_content}")
        return None
    except Exception as e:
        print(f"Deployment error: {e}")
        return None

if __name__ == '__main__':
    deploy()
