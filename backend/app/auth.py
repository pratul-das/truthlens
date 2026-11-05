from .database import get_connection
import bcrypt


# =========================================================
# PASSWORD FUNCTIONS
# =========================================================

def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")

    hashed = bcrypt.hashpw(
        password_bytes,
        bcrypt.gensalt()
    )

    return hashed.decode("utf-8")


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:

    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


# =========================================================
# CREATE USER
# =========================================================

def create_user(
    name: str,
    email: str,
    password: str
):

    hashed_password = hash_password(password)

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO users
        (name, email, password)
        VALUES (?, ?, ?)
        """,
        (
            name,
            email,
            hashed_password
        )
    )

    connection.commit()

    user_id = cursor.lastrowid

    connection.close()

    return user_id


# =========================================================
# GET USER BY EMAIL
# =========================================================

def get_user_by_email(email: str):

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
            id,
            name,
            email,
            password,
            created_at
        FROM users
        WHERE email = ?
        """,
        (email,)
    )

    user = cursor.fetchone()

    connection.close()

    return user


# =========================================================
# GET USER BY ID
# =========================================================

def get_user_by_id(user_id: int):

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
            id,
            name,
            email,
            password,
            created_at
        FROM users
        WHERE id = ?
        """,
        (user_id,)
    )

    user = cursor.fetchone()

    connection.close()

    return user