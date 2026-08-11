import functools
from flask import jsonify, session
from database import get_db_connection
from werkzeug.security import generate_password_hash, check_password_hash

def hash_password(password):
    return generate_password_hash(password)

def verify_password(password, password_hash):
    return check_password_hash(password_hash, password)

def get_current_user():
    user_id = session.get('user_id')
    if not user_id:
        return None
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()
    if not user:
        return None
    return dict(user)

def require_auth(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({
                'error': '401 UNAUTHORIZED',
                'message': 'Session expired or not logged in. Please log in.'
            }), 401
        return f(*args, **kwargs)
    return decorated

def require_role(allowed_roles):
    if isinstance(allowed_roles, str):
        allowed_roles = [allowed_roles]
    def decorator(f):
        @functools.wraps(f)
        def decorated(*args, **kwargs):
            user = get_current_user()
            if not user:
                return jsonify({
                    'error': '401 UNAUTHORIZED',
                    'message': 'Please log in to continue.'
                }), 401
            
            user_role = user.get('role')
            if user_role not in allowed_roles:
                redirect_url = '/student/dashboard' if user_role == 'STUDENT' else '/hod/dashboard'
                return jsonify({
                    'error': '403 ACCESS DENIED',
                    'message': f'Access Denied: Role {user_role} is not authorized to access this resource.',
                    'redirect': redirect_url
                }), 403
            return f(*args, **kwargs)
        return decorated
    return decorator
