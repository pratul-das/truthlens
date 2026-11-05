"""
TruthLens - Evidence Evaluator Test

This file tests the evidence_evaluator.py module.
"""

from .evidence_evaluator import evaluate_evidence


def main():
    """
    Run a simple test for evidence evaluation.
    """

    test_evidence = [
        {
            "title": "Reuters Example Article",
            "url": "https://www.reuters.com/example",
            "snippet": (
                "This is an example evidence "
                "from Reuters."
            )
        },
        {
            "title": "BBC Example Article",
            "url": "https://www.bbc.com/example",
            "snippet": (
                "This is an example evidence "
                "from BBC."
            )
        },
        {
            "title": "Example Website",
            "url": "https://example.com/article",
            "snippet": (
                "This is an example "
                "low credibility source."
            )
        }
    ]

    # Evaluate the test evidence.
    result = evaluate_evidence(
        test_evidence
    )

    print()
    print(
        "===================================="
    )
    print(
        "   TruthLens Evidence Test"
    )
    print(
        "===================================="
    )

    print(
        "Total evidence:",
        len(result["results"])
    )

    print(
        "High credibility sources:",
        result[
            "high_credibility_sources"
        ]
    )

    print(
        "Medium credibility sources:",
        result[
            "medium_credibility_sources"
        ]
    )

    print()

    print(
        "Evidence Details:"
    )

    print(
        "------------------------------------"
    )

    for index, item in enumerate(
        result["results"],
        start=1
    ):

        print(
            f"\nEvidence {index}"
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
            "Domain:",
            item.get("domain")
        )

        print(
            "Credibility:",
            item.get("credibility")
        )

        print(
            "Credibility Score:",
            item.get(
                "credibility_score"
            )
        )

        print(
            "------------------------------------"
        )


if __name__ == "__main__":

    main()