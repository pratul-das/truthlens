from pathlib import Path
import joblib


# --------------------------------------------------
# MODEL PATH
# --------------------------------------------------

MODEL_PATH = (
    Path(__file__).resolve().parents[3]
    / "ml"
    / "saved_model"
    / "fake_news_model.pkl"
)


# --------------------------------------------------
# LOAD MODEL
# --------------------------------------------------

model = None

if MODEL_PATH.exists():
    model = joblib.load(MODEL_PATH)


# --------------------------------------------------
# PREDICT NEWS
# --------------------------------------------------

def predict_news(news_text: str) -> dict:
    """
    Predict whether news is real or fake.

    Very short inputs are returned as UNKNOWN because
    the current model was trained on full news articles.
    """

    # Check empty input
    if not news_text or not news_text.strip():
        raise ValueError("News text cannot be empty.")

    # Clean input
    news_text = news_text.strip()

    # --------------------------------------------------
    # SHORT INPUT PROTECTION
    # --------------------------------------------------
    # The current model is trained on news articles.
    # Avoid forcing very short factual statements into
    # Fake/Real predictions.
    
    word_count = len(news_text.split())

    if word_count < 10:
        return {
            "prediction": "UNKNOWN",
            "confidence": None,
            "message": (
                "This input is too short for the current news "
                "model. Please enter a full news article or "
                "a longer news passage."
            ),
        }

    # --------------------------------------------------
    # CHECK MODEL
    # --------------------------------------------------

    if model is None:
        return {
            "prediction": "Model not trained",
            "confidence": None,
            "message": (
                "No trained model found. "
                "Please train and save the model first."
            ),
        }

    # --------------------------------------------------
    # MODEL PREDICTION
    # --------------------------------------------------

    prediction = model.predict([news_text])[0]
    prediction = str(prediction).strip().lower()

    if prediction in ["1", "real", "true"]:
        label = "Real"

    elif prediction in ["0", "fake", "false"]:
        label = "Fake"

    else:
        label = prediction

    # --------------------------------------------------
    # CONFIDENCE
    # --------------------------------------------------

    confidence = None

    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba([news_text])[0]
        confidence = round(float(max(probabilities)) * 100, 2)

    # --------------------------------------------------
    # RETURN RESULT
    # --------------------------------------------------

    return {
        "prediction": label,
        "confidence": confidence,
        "message": "Prediction completed successfully.",
    }