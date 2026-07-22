import sqlite3

conn = sqlite3.connect('audit_sessions.db')
cursor = conn.cursor()
try:
    cursor.execute("ALTER TABLE audit_sessions ADD COLUMN video_title TEXT DEFAULT 'YouTube Asset'")
    conn.commit()
    print("Database column video_title added successfully!")
except sqlite3.OperationalError:
    print("Column video_title already exists!")
finally:
    conn.close()