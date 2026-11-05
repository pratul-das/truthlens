import sys
from pathlib import Path
import pandas as pd

# Add backend to Python path
PROJECT_ROOT = Path(__file__).resolve().parent
BACKEND_FOLDER = PROJECT_ROOT / "backend"
sys.path.insert(0, str(BACKEND_FOLDER))

from backend.app.services.predictor import predict_news


# Dataset files
FAKE_FILE = PROJECT_ROOT / "ml" / "data" / "Fake.csv"
REAL_FILE = PROJECT_ROOT / "ml" / "data" / "True.csv"


# Load datasets
fake_data = pd.read_csv(FAKE_FILE)
real_data = pd.read_csv(REAL_FILE)


def get_article(data):
    """Create one complete article from title + text."""

    title = str(data.get("title", ""))
    text = str(data.get("text", ""))

    return (title + " " + text).strip()


# Take one article from each dataset
fake_article = get_article(fake_data.iloc[0])
real_article = get_article(real_data.iloc[0])


print("=" * 70)
print("TRUTHLENS FULL ARTICLE MODEL TEST")
print("=" * 70)


# Test Fake article
print("\n--- FAKE DATASET ARTICLE ---")

fake_result = predict_news(fake_article)

print("Actual dataset label: Fake")
print("Model prediction:", fake_result["prediction"])
print("Confidence:", fake_result["confidence"], "%")


# Test Real article
print("\n--- REAL DATASET ARTICLE ---")

real_result = predict_news(real_article)

print("Actual dataset label: Real")
print("Model prediction:", real_result["prediction"])
print("Confidence:", real_result["confidence"], "%")


print("\n" + "=" * 70)
print("TEST COMPLETED")
print("=" * 70)