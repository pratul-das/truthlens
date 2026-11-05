"""
TruthLens - Claim Evaluator

Evaluates a user claim against web evidence.

This module does NOT directly search the web.
It uses already evaluated evidence from evidence_evaluator.py.
"""


def normalize_text(text: str) -> str:
    """
    Normalize text for simple comparison.
    """

    if not text:
        return ""

    import re

    text = text.lower()

    text = re.sub(
        r"[^a-z0-9\s]",
        " ",
        text
    )

    text = re.sub(
        r"\s+",
        " ",
        text
    )

    return text.strip()


def calculate_text_similarity(
    claim: str,
    evidence_text: str
) -> float:
    """
    Calculate simple word-overlap similarity.

    Returns a value between 0 and 1.
    """

    claim_normalized = normalize_text(
        claim
    )

    evidence_normalized = normalize_text(
        evidence_text
    )

    if not claim_normalized or not evidence_normalized:
        return 0.0

    claim_words = set(
        claim_normalized.split()
    )

    evidence_words = set(
        evidence_normalized.split()
    )

    if not claim_words or not evidence_words:
        return 0.0

    common_words = (
        claim_words.intersection(
            evidence_words
        )
    )

    # Percentage of claim words found
    # in the evidence.
    similarity = (
        len(common_words)
        / len(claim_words)
    )

    return round(
        similarity,
        3
    )


def get_evidence_text(item: dict) -> str:
    """
    Extract useful text from an evidence item.
    """

    if not isinstance(item, dict):
        return ""

    title = (
        item.get("title")
        or ""
    )

    snippet = (
        item.get("snippet")
        or item.get("text")
        or item.get("description")
        or ""
    )

    return (
        str(title)
        + " "
        + str(snippet)
    ).strip()


def evaluate_single_result(
    claim: str,
    evidence: dict
) -> dict:
    """
    Evaluate one evidence result.
    """

    if not isinstance(evidence, dict):
        evidence = {}

    evidence_text = get_evidence_text(
        evidence
    )

    similarity = calculate_text_similarity(
        claim,
        evidence_text
    )

    credibility = (
        evidence.get("credibility")
        or "low"
    )

    credibility_score = (
        evidence.get(
            "credibility_score",
            0.40
        )
    )

    result = dict(evidence)

    result["claim_similarity"] = (
        similarity
    )

    result["credibility"] = credibility

    result["credibility_score"] = (
        credibility_score
    )

    return result


def evaluate_claim_against_evidence(
    claim: str,
    evidence: list
) -> dict:
    """
    Evaluate a claim against web evidence.

    Returns:

        {
            "status": ...,
            "confidence": ...,
            "message": ...,
            "supporting_results": [...],
            "contradicting_results": [...]
        }

    IMPORTANT:
    This is a simple evidence-based evaluator.
    It does not replace a professional fact-checker.
    """

    if not claim or not claim.strip():

        return {
            "status": "UNKNOWN",
            "confidence": 0.0,
            "message": "Claim is empty.",
            "supporting_results": [],
            "contradicting_results": []
        }

    if not evidence:

        return {
            "status": "UNKNOWN",
            "confidence": 0.0,
            "message": (
                "No evidence was found "
                "to evaluate the claim."
            ),
            "supporting_results": [],
            "contradicting_results": []
        }

    evaluated_results = []

    supporting_results = []

    contradicting_results = []

    for item in evidence:

        evaluated = evaluate_single_result(
            claim,
            item
        )

        evaluated_results.append(
            evaluated
        )

        classification = str(
            item.get(
                "evidence_classification",
                ""
            )
        ).lower()

        title = str(
            item.get(
                "title",
                ""
            )
        ).lower()

        snippet = str(
            item.get(
                "snippet",
                ""
            )
        ).lower()

        combined_text = (
            classification
            + " "
            + title
            + " "
            + snippet
        )

        similarity = evaluated[
            "claim_similarity"
        ]

        # --------------------------------------------------
        # Supporting evidence
        # --------------------------------------------------

        support_words = [
            "support",
            "supports",
            "true",
            "correct",
            "confirmed",
            "confirm",
            "accurate",
            "consistent"
        ]

        # --------------------------------------------------
        # Contradicting evidence
        # --------------------------------------------------

        contradiction_words = [
            "contradict",
            "contradicts",
            "false",
            "fake",
            "incorrect",
            "debunk",
            "disprove",
            "misleading",
            "not true"
        ]

        is_supporting = any(
            word in combined_text
            for word in support_words
        )

        is_contradicting = any(
            word in combined_text
            for word in contradiction_words
        )

        # Only classify evidence when
        # there is meaningful similarity.
        if similarity >= 0.30:

            if is_contradicting:

                contradicting_results.append(
                    evaluated
                )

            elif is_supporting:

                supporting_results.append(
                    evaluated
                )

    # ==================================================
    # Calculate overall result
    # ==================================================

    supporting_count = len(
        supporting_results
    )

    contradicting_count = len(
        contradicting_results
    )

    total_relevant = (
        supporting_count
        + contradicting_count
    )

    # --------------------------------------------------
    # No clear direction
    # --------------------------------------------------

    if total_relevant == 0:

        return {
            "status": "UNKNOWN",
            "confidence": 0.20,
            "message": (
                "The available evidence "
                "does not clearly support "
                "or contradict the claim."
            ),
            "supporting_results": [],
            "contradicting_results": []
        }

    # --------------------------------------------------
    # Claim appears contradicted
    # --------------------------------------------------

    if contradicting_count > supporting_count:

        confidence = (
            contradicting_count
            / total_relevant
        )

        confidence = min(
            0.95,
            round(
                confidence,
                2
            )
        )

        return {
            "status": "FALSE",
            "confidence": confidence,
            "message": (
                "The available evidence "
                "contradicts the claim."
            ),
            "supporting_results":
                supporting_results,
            "contradicting_results":
                contradicting_results
        }

    # --------------------------------------------------
    # Claim appears supported
    # --------------------------------------------------

    if supporting_count > contradicting_count:

        confidence = (
            supporting_count
            / total_relevant
        )

        confidence = min(
            0.95,
            round(
                confidence,
                2
            )
        )

        return {
            "status": "TRUE",
            "confidence": confidence,
            "message": (
                "The available evidence "
                "supports the claim."
            ),
            "supporting_results":
                supporting_results,
            "contradicting_results":
                contradicting_results
        }

    # --------------------------------------------------
    # Mixed evidence
    # --------------------------------------------------

    return {
        "status": "UNCERTAIN",
        "confidence": 0.50,
        "message": (
            "The available evidence "
            "contains both supporting "
            "and contradicting information."
        ),
        "supporting_results":
            supporting_results,
        "contradicting_results":
            contradicting_results
    }


# ======================================================
# SIMPLE TEST
# ======================================================

if __name__ == "__main__":

    test_claim = (
        "The Earth is flat"
    )

    test_evidence = [
        {
            "title": "Example evidence",
            "url": "https://example.com",
            "snippet": (
                "This evidence says "
                "the claim is false."
            ),
            "credibility": "medium",
            "credibility_score": 0.70,
            "evidence_classification": "false"
        }
    ]

    result = evaluate_claim_against_evidence(
        test_claim,
        test_evidence
    )

    print(
        "TruthLens Claim Evaluation Test"
    )

    print(
        "--------------------------------"
    )

    print(
        "Claim:",
        test_claim
    )

    print(
        "Status:",
        result["status"]
    )

    print(
        "Confidence:",
        result["confidence"]
    )

    print(
        "Message:",
        result["message"]
    )

    print(
        "Supporting results:",
        len(
            result[
                "supporting_results"
            ]
        )
    )

    print(
        "Contradicting results:",
        len(
            result[
                "contradicting_results"
            ]
        )
    )