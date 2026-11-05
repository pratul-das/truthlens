"""
TruthLens - Final Verifier

Combines Google Fact Check results and web evidence
into one final verification result.
"""


def combine_verification_results(
    fact_check_status=None,
    evidence_status=None,
    evidence_confidence=0.0
):
    """
    Combine verification information into a final result.

    Possible final statuses:

        TRUE
        FALSE
        UNCERTAIN
        UNKNOWN
    """

    # ==================================================
    # 1. Direct Google Fact Check result
    # ==================================================

    if fact_check_status:

        status = str(
            fact_check_status
        ).upper()

        if status == "TRUE":

            return {
                "status": "TRUE",
                "label": "TRUE",
                "confidence": 0.95,
                "message": (
                    "The claim is supported "
                    "by a matching fact check."
                ),
                "basis": "Google Fact Check"
            }

        if status == "FALSE":

            return {
                "status": "FALSE",
                "label": "FALSE",
                "confidence": 0.95,
                "message": (
                    "The claim is contradicted "
                    "by a matching fact check."
                ),
                "basis": "Google Fact Check"
            }

        if status in [
            "PARTIALLY_TRUE",
            "PARTIALLY TRUE",
            "MIXED"
        ]:

            return {
                "status": "UNCERTAIN",
                "label": "PARTIALLY TRUE",
                "confidence": 0.70,
                "message": (
                    "The matching fact check "
                    "provides only partial support "
                    "for the claim."
                ),
                "basis": "Google Fact Check"
            }

        if status in [
            "UNVERIFIED",
            "UNKNOWN"
        ]:

            return {
                "status": "UNKNOWN",
                "label": "UNVERIFIED",
                "confidence": 0.30,
                "message": (
                    "The matching fact check "
                    "does not provide enough "
                    "information to verify the claim."
                ),
                "basis": "Google Fact Check"
            }

    # ==================================================
    # 2. Web evidence result
    # ==================================================

    if evidence_status:

        status = str(
            evidence_status
        ).upper()

        try:
            confidence = float(
                evidence_confidence
            )
        except (
            TypeError,
            ValueError
        ):
            confidence = 0.0

        confidence = max(
            0.0,
            min(
                1.0,
                confidence
            )
        )

        if status == "TRUE":

            return {
                "status": "TRUE",
                "label": "TRUE",
                "confidence": confidence,
                "message": (
                    "The available web evidence "
                    "supports the claim."
                ),
                "basis": "Web Evidence"
            }

        if status == "FALSE":

            return {
                "status": "FALSE",
                "label": "FALSE",
                "confidence": confidence,
                "message": (
                    "The available web evidence "
                    "contradicts the claim."
                ),
                "basis": "Web Evidence"
            }

        if status in [
            "UNCERTAIN",
            "PARTIALLY_TRUE"
        ]:

            return {
                "status": "UNCERTAIN",
                "label": "UNCERTAIN",
                "confidence": confidence,
                "message": (
                    "The available evidence "
                    "contains mixed or incomplete "
                    "information."
                ),
                "basis": "Web Evidence"
            }

        if status == "UNKNOWN":

            return {
                "status": "UNKNOWN",
                "label": "UNVERIFIED",
                "confidence": confidence,
                "message": (
                    "There is not enough evidence "
                    "to verify the claim."
                ),
                "basis": "Web Evidence"
            }

    # ==================================================
    # 3. Nothing available
    # ==================================================

    return {
        "status": "UNKNOWN",
        "label": "UNVERIFIED",
        "confidence": 0.0,
        "message": (
            "There is not enough information "
            "to verify this claim."
        ),
        "basis": "Insufficient Evidence"
    }


# ======================================================
# SIMPLE TEST
# ======================================================

if __name__ == "__main__":

    print(
        "TruthLens Final Verifier Test"
    )

    print(
        "-----------------------------"
    )

    result = combine_verification_results(
        evidence_status="FALSE",
        evidence_confidence=0.85
    )

    print(
        "Status:",
        result["status"]
    )

    print(
        "Label:",
        result["label"]
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
        "Basis:",
        result["basis"]
    )