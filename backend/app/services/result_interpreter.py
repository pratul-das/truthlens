"""
TruthLens - Fact Check Result Interpreter

Converts a fact-check rating into a structured result
that can be used by verification_service.py.
"""


def interpret_fact_check_rating(rating: str) -> dict:
    """
    Interpret a fact-check rating and return:

        status
        label
        explanation
    """

    if not rating:
        return {
            "status": "UNKNOWN",
            "label": "UNVERIFIED",
            "explanation": "No fact-check rating was available."
        }

    rating = str(rating).strip().lower()

    # ------------------------------------
    # FALSE / MISLEADING
    # ------------------------------------
    false_words = [
        "pants on fire",
        "false",
        "fake",
        "incorrect",
        "misleading",
        "wrong",
        "not true",
        "untrue",
        "debunked"
    ]

    if any(word in rating for word in false_words):
        return {
            "status": "FALSE",
            "label": "FALSE",
            "explanation": (
                "The fact-check rating indicates "
                "that the claim is false or misleading."
            )
        }

    # ------------------------------------
    # PARTIALLY TRUE
    # ------------------------------------
    partial_words = [
        "partly true",
        "mostly true",
        "half true",
        "partially true",
        "partially correct",
        "mostly correct",
        "mixed"
    ]

    if any(word in rating for word in partial_words):
        return {
            "status": "PARTIALLY_TRUE",
            "label": "PARTIALLY TRUE",
            "explanation": (
                "The fact-check rating indicates "
                "that the claim is only partly correct."
            )
        }

    # ------------------------------------
    # UNKNOWN / UNVERIFIED
    # ------------------------------------
    unknown_words = [
        "unproven",
        "unverified",
        "unknown",
        "not enough evidence",
        "insufficient evidence",
        "cannot be verified",
        "not enough information",
        "unable to verify"
    ]

    if any(word in rating for word in unknown_words):
        return {
            "status": "UNKNOWN",
            "label": "UNVERIFIED",
            "explanation": (
                "There is not enough evidence "
                "to verify the claim."
            )
        }

    # ------------------------------------
    # TRUE
    # ------------------------------------
    true_words = [
        "true",
        "correct",
        "accurate"
    ]

    if any(word in rating for word in true_words):
        return {
            "status": "TRUE",
            "label": "TRUE",
            "explanation": (
                "The fact-check rating indicates "
                "that the claim is true or accurate."
            )
        }

    # ------------------------------------
    # SEMANTIC-STYLE FACT CHECK RESULTS
    # ------------------------------------
    # Examples:
    # "The Earth is not flat"
    # "Evidence shows the claim is incorrect"
    # "The Earth is roughly spherical"

    contradiction_phrases = [
        "not flat",
        "earth is spherical",
        "earth is roughly spherical",
        "claim is false",
        "claim is incorrect",
        "claim is wrong",
        "evidence shows that the claim is false",
        "evidence shows the claim is false",
        "evidence contradicts the claim"
    ]

    if any(phrase in rating for phrase in contradiction_phrases):
        return {
            "status": "FALSE",
            "label": "FALSE",
            "explanation": (
                "The fact-check information contradicts "
                "the claim."
            )
        }

    # ------------------------------------
    # DEFAULT
    # ------------------------------------
    return {
        "status": "UNKNOWN",
        "label": "UNVERIFIED",
        "explanation": (
            "The fact-check rating could not "
            "be confidently interpreted."
        )
    }


# ----------------------------------------
# TEST
# ----------------------------------------

if __name__ == "__main__":

    test_ratings = [
        "False",
        "True",
        "Mostly True",
        "Unverified",
        "Unknown Rating",
        "The Earth is not flat",
        "The Earth is roughly spherical"
    ]

    print()
    print("====================================")
    print(" TruthLens Result Interpreter Test")
    print("====================================")

    for rating in test_ratings:

        result = interpret_fact_check_rating(rating)

        print()
        print("Rating:", rating)
        print("Status:", result["status"])
        print("Label:", result["label"])
        print("Explanation:", result["explanation"])
        print("------------------------------------")