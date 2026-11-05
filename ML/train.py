from pathlib import Path

import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report


# --------------------------------------------------
# 1. Define project paths
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[1]

DATA_FOLDER = PROJECT_ROOT / "ml" / "data"
MODEL_FOLDER = PROJECT_ROOT / "ml" / "saved_model"

FAKE_FILE = DATA_FOLDER / "Fake.csv"
REAL_FILE = DATA_FOLDER / "True.csv"

MODEL_FILE = MODEL_FOLDER / "fake_news_model.pkl"


# --------------------------------------------------
# 2. Load the datasets
# --------------------------------------------------

print("Loading fake news dataset...")

fake_data = pd.read_csv(FAKE_FILE)
real_data = pd.read_csv(REAL_FILE)

# Assign labels
fake_data["label"] = 0
real_data["label"] = 1

# Combine both datasets
data = pd.concat(
    [fake_data, real_data],
    ignore_index=True
)

print("Datasets loaded successfully!")
print("Total articles:", len(data))


# --------------------------------------------------
# 3. Prepare the news text
# --------------------------------------------------

# Use title and text when both columns exist
text_columns = []

for column in ["title", "text"]:
    if column in data.columns:
        text_columns.append(column)

if not text_columns:
    raise ValueError(
        "No 'title' or 'text' column found in the CSV files."
    )

# Replace missing values
for column in text_columns:
    data[column] = data[column].fillna("").astype(str)

# Combine available text columns
data["news"] = data[text_columns].agg(" ".join, axis=1)

# Remove empty articles
data = data[data["news"].str.strip() != ""]

# Remove exact duplicate articles
data = data.drop_duplicates(subset=["news"])

X = data["news"]
y = data["label"]

print("Articles prepared:", len(data))
print("Fake articles:", int((y == 0).sum()))
print("Real articles:", int((y == 1).sum()))


# --------------------------------------------------
# 4. Split the dataset
# --------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print("Training articles:", len(X_train))
print("Testing articles:", len(X_test))


# --------------------------------------------------
# 5. Create the machine-learning pipeline
# --------------------------------------------------

model = Pipeline([
    (
        "tfidf",
        TfidfVectorizer(
            stop_words="english",
            max_features=50000,
            ngram_range=(1, 2),
            sublinear_tf=True
        )
    ),
    (
        "classifier",
        LogisticRegression(
            max_iter=1000,
            random_state=42
        )
    )
])


# --------------------------------------------------
# 6. Train the model
# --------------------------------------------------

print("Training model...")

model.fit(X_train, y_train)

print("Training completed!")


# --------------------------------------------------
# 7. Evaluate the model
# --------------------------------------------------

predictions = model.predict(X_test)

accuracy = accuracy_score(
    y_test,
    predictions
)

print("\nModel Accuracy:")
print(f"{accuracy * 100:.2f}%")

print("\nClassification Report:")
print(
    classification_report(
        y_test,
        predictions,
        target_names=["Fake", "Real"]
    )
)


# --------------------------------------------------
# 8. Save the trained model
# --------------------------------------------------

MODEL_FOLDER.mkdir(
    parents=True,
    exist_ok=True
)

joblib.dump(model, MODEL_FILE)

print("\nModel saved successfully!")
print("Saved location:", MODEL_FILE)