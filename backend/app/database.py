import sqlite3
from pathlib import Path


# --------------------------------------------------
# Database location
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent

DATABASE_FILE = BASE_DIR / "truthlens.db"


# --------------------------------------------------
# Get database connection
# --------------------------------------------------

def get_connection():

    connection = sqlite3.connect(
        DATABASE_FILE
    )

    connection.row_factory = sqlite3.Row

    return connection


# --------------------------------------------------
# Create users table
# --------------------------------------------------

def create_users_table():

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            name TEXT NOT NULL,

            email TEXT UNIQUE NOT NULL,

            password TEXT NOT NULL,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

        )
    """)

    connection.commit()

    connection.close()