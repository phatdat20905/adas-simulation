import datetime

def current_timestamp():
    return datetime.datetime.utcnow().isoformat() + "Z"
