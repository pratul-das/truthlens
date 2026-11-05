from .fact_checker import search_fact_checks
from .evidence_search import search_web_evidence
from .result_interpreter import interpret_fact_check_rating
from .evidence_evaluator import evaluate_evidence
from .claim_evaluator import evaluate_claim_against_evidence
from .final_verifier import combine_verification_results


def normalize_claim(text: str):
    """
    Normalize a claim for simple comparison.
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


def calculate_claim_match(
    user_claim: str,
    fact_check_claim: str
):
    """
    Calculate how closely a Google Fact Check claim
    matches the user's claim.

    This is used only to decide whether a returned
    fact check is about the same claim.

    It does NOT determine truth or falsehood.
    """

    user_normalized = normalize_claim(
        user_claim
    )

    fact_normalized = normalize_claim(
        fact_check_claim
    )

    if not user_normalized or not fact_normalized:
        return 0

    # --------------------------------------------------
    # Exact match
    # --------------------------------------------------

    if user_normalized == fact_normalized:
        return 1.0

    user_words = set(
        user_normalized.split()
    )

    fact_words = set(
        fact_normalized.split()
    )

    if not user_words or not fact_words:
        return 0

    intersection = (
        user_words.intersection(
            fact_words
        )
    )

    user_coverage = (
        len(intersection)
        / len(user_words)
    )

    fact_coverage = (
        len(intersection)
        / len(fact_words)
    )

    similarity = min(
        user_coverage,
        fact_coverage
    )

    return similarity


def find_matching_fact_check(
    user_claim: str,
    fact_checks: list
):
    """
    Find the most relevant fact check for the user's claim.

    Returns:
        A matching fact check or None.
    """

    if not fact_checks:
        return None

    best_match = None
    best_score = 0

    for fact_check in fact_checks:

        fact_check_claim = fact_check.get(
            "claim",
            ""
        )

        score = calculate_claim_match(
            user_claim,
            fact_check_claim
        )

        if score > best_score:

            best_score = score
            best_match = fact_check

    if best_score >= 0.75:

        return best_match

    return None


def verify_claim(
    claim: str,
    language_code: str = "en"
):
    """
    Verify a claim using multiple verification layers:

    1. Google Fact Check Tools
    2. Web evidence search
    3. Evidence evaluation
    4. Claim evaluation
    5. Final verification

    IMPORTANT:
    If Google Fact Check is unavailable or times out,
    the system continues with web evidence instead of
    immediately returning an error.
    """

    if not claim or not claim.strip():

        return {
            "success": False,
            "status": "INVALID",
            "message": "Claim is empty.",
            "fact_checks": [],
            "evidence": []
        }

    claim = claim.strip()

    # ==================================================
    # LAYER 1: GOOGLE FACT CHECK
    # ==================================================

    fact_check_result = search_fact_checks(
        claim,
        language_code
    )

    fact_checks = []

    # --------------------------------------------------
    # Google Fact Check succeeded
    # --------------------------------------------------

    if fact_check_result.get("success"):

        fact_checks = fact_check_result.get(
            "results",
            []
        )

        matching_fact_check = find_matching_fact_check(
            claim,
            fact_checks
        )

        # --------------------------------------------------
        # Use direct fact check only when it actually
        # matches the user's claim.
        # --------------------------------------------------

        if matching_fact_check:

            interpreted = interpret_fact_check_rating(
                matching_fact_check.get(
                    "rating",
                    ""
                )
            )

            interpreted_result = {
                **matching_fact_check,
                "verification_status": interpreted[
                    "status"
                ],
                "verification_label": interpreted[
                    "label"
                ],
                "verification_explanation": interpreted[
                    "explanation"
                ],
                "claim_match_score": calculate_claim_match(
                    claim,
                    matching_fact_check.get(
                        "claim",
                        ""
                    )
                )
            }

            final_result = combine_verification_results(
                fact_check_status=interpreted[
                    "status"
                ]
            )

            return {
                "success": True,
                "status": final_result["status"],
                "message": final_result["message"],
                "label": final_result["label"],
                "confidence": final_result["confidence"],
                "basis": final_result["basis"],
                "fact_checks": [
                    interpreted_result
                ],
                "evidence": []
            }

    # ==================================================
    # IMPORTANT:
    #
    # If Google Fact Check failed/timed out OR returned
    # unrelated fact checks, continue to web evidence.
    # ==================================================

    fact_check_error = None

    if not fact_check_result.get("success"):

        fact_check_error = fact_check_result.get(
            "error",
            "Google Fact Check was unavailable."
        )

    # ==================================================
    # LAYER 2: WEB EVIDENCE SEARCH
    # ==================================================

    evidence_result = search_web_evidence(
        claim
    )

    # --------------------------------------------------
    # Web evidence search failed
    # --------------------------------------------------

    if not evidence_result.get("success"):

        return {
            "success": False,
            "status": "SEARCH_ERROR",
            "message": (
                "Google Fact Check was unavailable and "
                "web evidence search also failed."
            ),
            "fact_checks": [],
            "evidence": [],
            "errors": {
                "fact_check": fact_check_error,
                "web_search": evidence_result.get(
                    "error"
                )
            }
        }

    evidence = evidence_result.get(
        "results",
        []
    )

    # ==================================================
    # LAYER 3: EVALUATE SOURCES
    # ==================================================

    evaluated_evidence = evaluate_evidence(
        evidence
    )

    # ==================================================
    # LAYER 4: EVALUATE CLAIM AGAINST EVIDENCE
    # ==================================================

    claim_evaluation = evaluate_claim_against_evidence(
        claim,
        evaluated_evidence.get(
            "results",
            []
        )
    )

    # ==================================================
    # LAYER 5: FINAL VERIFICATION
    # ==================================================

    final_result = combine_verification_results(
        evidence_status=claim_evaluation[
            "status"
        ],
        evidence_confidence=claim_evaluation[
            "confidence"
        ]
    )

    # ==================================================
    # RETURN WEB EVIDENCE RESULT
    # ==================================================

    if evidence:

        response = {
            "success": True,
            "status": final_result["status"],
            "message": final_result["message"],
            "label": final_result["label"],
            "confidence": final_result["confidence"],
            "basis": final_result["basis"],
            "fact_checks": [],
            "evidence": evaluated_evidence[
                "results"
            ],
            "evidence_summary": {
                "high_credibility_sources": (
                    evaluated_evidence[
                        "high_credibility_sources"
                    ]
                ),
                "medium_credibility_sources": (
                    evaluated_evidence[
                        "medium_credibility_sources"
                    ]
                )
            },
            "claim_evaluation": {
                "status": claim_evaluation[
                    "status"
                ],
                "confidence": claim_evaluation[
                    "confidence"
                ],
                "message": claim_evaluation[
                    "message"
                ],
                "supporting_results": (
                    claim_evaluation[
                        "supporting_results"
                    ]
                ),
                "contradicting_results": (
                    claim_evaluation[
                        "contradicting_results"
                    ]
                )
            }
        }

        # --------------------------------------------------
        # Tell the frontend that Google Fact Check was
        # unavailable, without treating that as the
        # verification result itself.
        # --------------------------------------------------

        if fact_check_error:

            response["fact_check_status"] = (
                "UNAVAILABLE"
            )

            response["fact_check_error"] = (
                fact_check_error
            )

            response["message"] = (
                response["message"]
                + " Google Fact Check was temporarily "
                  "unavailable, so the result is based "
                  "on web evidence."
            )

        else:

            response["fact_check_status"] = (
                "NO_MATCHING_FACT_CHECK"
            )

        return response

    # ==================================================
    # NOTHING FOUND
    # ==================================================

    final_result = combine_verification_results()

    response = {
        "success": True,
        "status": final_result["status"],
        "message": final_result["message"],
        "label": final_result["label"],
        "confidence": final_result["confidence"],
        "basis": final_result["basis"],
        "fact_checks": [],
        "evidence": [],
        "fact_check_status": (
            "UNAVAILABLE"
            if fact_check_error
            else "NO_MATCHING_FACT_CHECK"
        )
    }

    if fact_check_error:

        response["fact_check_error"] = (
            fact_check_error
        )

    return response


if __name__ == "__main__":

    test_claim = "The Earth is flat"

    result = verify_claim(
        test_claim
    )

    print(
        "\nTruthLens Verification Test"
    )

    print(
        "---------------------------"
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
        "Label:",
        result.get("label")
    )

    print(
        "Confidence:",
        result.get("confidence")
    )

    print(
        "Basis:",
        result.get("basis")
    )

    print(
        "Message:",
        result["message"]
    )

    print(
        "\nFact checks found:",
        len(result.get("fact_checks", []))
    )

    print(
        "Evidence results:",
        len(result.get("evidence", []))
    )

    if result.get("fact_check_error"):

        print(
            "\nFact Check API:",
            result["fact_check_error"]
        )

    if result.get("fact_checks"):

        print(
            "\nFACT CHECK"
        )

        for item in result["fact_checks"]:

            print(
                "Claim:",
                item.get("claim")
            )

            print(
                "Publisher:",
                item.get("publisher")
            )

            print(
                "Rating:",
                item.get("rating")
            )

            print(
                "Match score:",
                item.get(
                    "claim_match_score"
                )
            )

            print(
                "Title:",
                item.get("title")
            )

            print(
                "URL:",
                item.get("url")
            )

            print(
                "-" * 60
            )

    if result.get("evidence"):

        print(
            "\nWEB EVIDENCE"
        )

        for item in result["evidence"]:

            print(
                "Title:",
                item.get("title")
            )

            print(
                "URL:",
                item.get("url")
            )

            print(
                "Snippet:",
                item.get("snippet")
            )

            print(
                "Classification:",
                item.get(
                    "evidence_classification"
                )
            )

            print(
                "-" * 60
            )