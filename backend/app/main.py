from fastapi import FastAPI, HTTPException, Depends
from .database import create_users_table, get_connection
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordRequestForm
from jose import jwt
from datetime import datetime, timedelta

from .auth import (
    create_user,
    get_user_by_email,
    get_user_by_id,
    verify_password
)

from fastapi.middleware.cors import CORSMiddleware
from urllib.parse import urlparse

from trafilatura import fetch_url, extract

from .services.predictor import predict_news

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials


# --------------------------------------------------
# Authentication settings
# --------------------------------------------------

SECRET_KEY = "truthlens-development-secret-key-change-later"

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60


# --------------------------------------------------
# JWT Authentication
# --------------------------------------------------

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    token = credentials.credentials

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token."
            )

        user_id = int(user_id)

        user = get_user_by_id(
            user_id
        )

        if not user:
            raise HTTPException(
                status_code=401,
                detail="User account not found."
            )

        return {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"]
        }

    except Exception:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token."
        )


app = FastAPI(title="TruthLens - Fake News Detection")


# --------------------------------------------------
# Initialize database
# --------------------------------------------------

create_users_table()


# --------------------------------------------------
# CORS configuration
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# Request models
# --------------------------------------------------

class NewsRequest(BaseModel):
    text: str


# --------------------------------------------------
# Authentication request models
# --------------------------------------------------

class RegisterRequest(BaseModel):

    name: str
    email: str
    password: str


class LoginRequest(BaseModel):

    email: str
    password: str


class UrlRequest(BaseModel):
    url: str


# --------------------------------------------------
# Profile update request
# --------------------------------------------------

class ProfileUpdateRequest(BaseModel):

    name: str
    email: str


# --------------------------------------------------
# Home endpoint
# --------------------------------------------------

@app.get("/")
def home():

    return {
        "message": "TruthLens API is running!"
    }


# --------------------------------------------------
# Health check endpoint
# --------------------------------------------------

@app.get("/health")
def health_check():

    return {
        "status": "healthy"
    }


# --------------------------------------------------
# Text prediction endpoint
# --------------------------------------------------

@app.post("/predict")
def predict(news: NewsRequest):

    try:

        result = predict_news(news.text)

        return result

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# --------------------------------------------------
# URL prediction endpoint
# --------------------------------------------------

@app.post("/predict-url")
def predict_url(request: UrlRequest):

    try:

        # Check that the URL is valid
        parsed = urlparse(request.url)

        if parsed.scheme not in ("http", "https") or not parsed.netloc:

            raise HTTPException(
                status_code=400,
                detail="Please enter a valid http/https URL."
            )


        # Download the webpage
        downloaded = fetch_url(request.url)

        if not downloaded:

            raise HTTPException(
                status_code=400,
                detail="Could not download the webpage."
            )


        # Extract the main article text
        article_text = extract(downloaded)

        if not article_text or len(article_text.strip()) < 100:

            raise HTTPException(
                status_code=422,
                detail="Could not extract enough article text from this webpage."
            )


        # Send extracted article text
        # to the existing ML model
        result = predict_news(article_text)


        # Return prediction result
        return {
            **result,
            "source_url": request.url,
            "message": "Article extracted and prediction completed successfully."
        }


    except HTTPException:

        raise


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# --------------------------------------------------
# User registration
# --------------------------------------------------

@app.post("/register")
def register_user(request: RegisterRequest):

    name = request.name.strip()
    email = request.email.strip().lower()
    password = request.password

    # Basic validation
    if not name:

        raise HTTPException(
            status_code=400,
            detail="Name is required."
        )

    if not email or "@" not in email:

        raise HTTPException(
            status_code=400,
            detail="Please enter a valid email address."
        )

    if len(password) < 6:

        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 6 characters."
        )

    # Check whether email already exists
    existing_user = get_user_by_email(email)

    if existing_user:

        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists."
        )

    # Create user
    user_id = create_user(
        name,
        email,
        password
    )

    return {
        "message": "Account created successfully.",
        "user": {
            "id": user_id,
            "name": name,
            "email": email
        }
    }


# --------------------------------------------------
# User login
# --------------------------------------------------

@app.post("/login")
def login_user(request: LoginRequest):

    email = request.email.strip().lower()
    password = request.password

    # Find user
    user = get_user_by_email(email)

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    # Verify password
    password_valid = verify_password(
        password,
        user["password"]
    )

    if not password_valid:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    # Create authentication token
    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    token_data = {
        "sub": str(user["id"]),
        "email": user["email"],
        "exp": expire
    }

    access_token = jwt.encode(
        token_data,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return {
        "message": "Login successful.",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"]
        }
    }


# --------------------------------------------------
# Get current authenticated user
# --------------------------------------------------

@app.get("/me")
def get_me(
    current_user: dict = Depends(get_current_user)
):

    return {
        "user": current_user
    }


# --------------------------------------------------
# Update user profile
# --------------------------------------------------

@app.put("/profile")
def update_profile(
    request: ProfileUpdateRequest,
    current_user: dict = Depends(get_current_user)
):

    name = request.name.strip()
    email = request.email.strip().lower()

    if not name:

        raise HTTPException(
            status_code=400,
            detail="Name is required."
        )

    if (
        not email
        or "@" not in email
        or "." not in email
    ):

        raise HTTPException(
            status_code=400,
            detail="Please enter a valid email address."
        )

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT id
        FROM users
        WHERE email = ?
        AND id != ?
        """,
        (
            email,
            current_user["id"]
        )
    )

    existing_user = cursor.fetchone()

    if existing_user:

        connection.close()

        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists."
        )

    cursor.execute(
        """
        UPDATE users
        SET name = ?, email = ?
        WHERE id = ?
        """,
        (
            name,
            email,
            current_user["id"]
        )
    )

    connection.commit()

    connection.close()

    # Create a new token with the updated email
    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    token_data = {
        "sub": str(current_user["id"]),
        "email": email,
        "exp": expire
    }

    access_token = jwt.encode(
        token_data,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return {
        "message": "Profile updated successfully.",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": current_user["id"],
            "name": name,
            "email": email
        }
    }