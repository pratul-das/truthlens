from pathlib import Path

import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)


# --------------------------------------------------
# 1. Define project paths
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[1]

DATA_FOLDER = PROJECT_ROOT / "ml" / "data"
MODEL_FILE = PROJECT_ROOT / "ml" / "saved_model" / "fake_news_model.pkl"

FAKE_FILE = DATA_FOLDER / "Fake.csv"
REAL_FILE = DATA_FOLDER / "True.csv"


# --------------------------------------------------
# 2. Load trained model
# --------------------------------------------------

print("Loading trained model...")

model = joblib.load(MODEL_FILE)

print("Model loaded successfully!")


# --------------------------------------------------
# 3. Load datasets
# --------------------------------------------------

print("\nLoading datasets...")

fake_data = pd.read_csv(FAKE_FILE)
real_data = pd.read_csv(REAL_FILE)

fake_data["label"] = 0
real_data["label"] = 1

data = pd.concat(
    [fake_data, real_data],
    ignore_index=True
)


# --------------------------------------------------
# 4. Prepare news text
# --------------------------------------------------

text_columns = []

for column in ["title", "text"]:
    if column in data.columns:
        text_columns.append(column)

if not text_columns:
    raise ValueError(
        "No 'title' or 'text' column found."
    )

for column in text_columns:
    data[column] = data[column].fillna("").astype(str)

data["news"] = data[text_columns].agg(" ".join, axis=1)

data = data[data["news"].str.strip() != ""]

data = data.drop_duplicates(
    subset=["news"]
)

X = data["news"]
y = data["label"]


# --------------------------------------------------
# 5. Create the same test split
# --------------------------------------------------

_, X_test, _, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print("\nTesting on unseen test data...")
print("Test articles:", len(X_test))


# --------------------------------------------------
# 6. Make predictions
# --------------------------------------------------

predictions = model.predict(X_test)


# --------------------------------------------------
# 7. Calculate accuracy
# --------------------------------------------------

accuracy = accuracy_score(
    y_test,
    predictions
)

print("\n================================")
print("MODEL EVALUATION")
print("================================")

print(f"\nTest Accuracy: {accuracy * 100:.2f}%")


# --------------------------------------------------
# 8. Classification report
# --------------------------------------------------

print("\nClassification Report:")

print(
    classification_report(
        y_test,
        predictions,
        target_names=["Fake", "Real"]
    )
)


# --------------------------------------------------
# 9. Confusion matrix
# --------------------------------------------------

print("\nConfusion Matrix:")

print(
    confusion_matrix(
        y_test,
        predictions
    )
)