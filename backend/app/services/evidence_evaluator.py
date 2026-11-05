"""
TruthLens - Evidence Evaluator

Evaluates the credibility of web evidence returned by
the evidence search service.

This module does NOT decide whether a claim is true or false.
It only evaluates the quality/credibility of the sources.
"""


HIGH_CREDIBILITY_DOMAINS = {
    "reuters.com",
    "apnews.com",
    "bbc.com",
    "bbc.co.uk",
    "npr.org",
    "pbs.org",
    "who.int",
    "un.org",
    "gov",
    "gov.uk",
    "cdc.gov",
    "nih.gov",
    "fda.gov",
    "nasa.gov",
    "edu",
}


MEDIUM_CREDIBILITY_DOMAINS = {
    "nytimes.com",
    "washingtonpost.com",
    "theguardian.com",
    "cnn.com",
    "nbcnews.com",
    "abcnews.go.com",
    "cbsnews.com",
    "foxnews.com",
    "usatoday.com",
    "forbes.com",
    "bloomberg.com",
}


def get_domain(url: str) -> str:
    """
    Extract a simple domain name from a URL.
    """

    if not url:
        return ""

    try:
        from urllib.parse import urlparse

        parsed = urlparse(url)

        domain = parsed.netloc.lower()

        if domain.startswith("www."):
            domain = domain[4:]

        return domain

    except Exception:
        return ""


def classify_source(domain: str) -> str:
    """
    Classify a source as high, medium, or low credibility.
    """

    if not domain:
        return "low"

    domain = domain.lower()

    # Exact or subdomain match for high credibility sources.
    for trusted_domain in HIGH_CREDIBILITY_DOMAINS:

        if (
            domain == trusted_domain
            or domain.endswith("." + trusted_domain)
        ):
            return "high"

    # Exact or subdomain match for medium credibility sources.
    for medium_domain in MEDIUM_CREDIBILITY_DOMAINS:

        if (
            domain == medium_domain
            or domain.endswith("." + medium_domain)
        ):
            return "medium"

    return "low"


def evaluate_single_evidence(item: dict) -> dict:
    """
    Evaluate one evidence item.
    """

    if not isinstance(item, dict):
        item = {}

    url = (
        item.get("url")
        or item.get("link")
        or item.get("source_url")
        or ""
    )

    title = (
        item.get("title")
        or item.get("name")
        or ""
    )

    snippet = (
        item.get("snippet")
        or item.get("text")
        or item.get("description")
        or ""
    )

    domain = get_domain(url)

    credibility = classify_source(domain)

    if credibility == "high":

        credibility_score = 0.90

    elif credibility == "medium":

        credibility_score = 0.70

    else:

        credibility_score = 0.40

    evaluated_item = dict(item)

    evaluated_item["domain"] = domain

    evaluated_item["credibility"] = credibility

    evaluated_item["credibility_score"] = credibility_score

    evaluated_item["title"] = title

    evaluated_item["snippet"] = snippet

    return evaluated_item


def evaluate_evidence(evidence: list) -> dict:
    """
    Evaluate a list of evidence results.

    Returns the structure expected by verification_service.py:

        {
            "results": [...],
            "high_credibility_sources": int,
            "medium_credibility_sources": int
        }
    """

    if not evidence:

        return {
            "results": [],
            "high_credibility_sources": 0,
            "medium_credibility_sources": 0
        }

    evaluated_results = []

    high_credibility_sources = 0

    medium_credibility_sources = 0

    for item in evidence:

        evaluated_item = evaluate_single_evidence(
            item
        )

        evaluated_results.append(
            evaluated_item
        )

        if (
            evaluated_item["credibility"]
            == "high"
        ):

            high_credibility_sources += 1

        elif (
            evaluated_item["credibility"]
            == "medium"
        ):

            medium_credibility_sources += 1

    return {
        "results": evaluated_results,
        "high_credibility_sources":
            high_credibility_sources,
        "medium_credibility_sources":
            medium_credibility_sources
    }


if __name__ == "__main__":

    test_evidence = [
        {
            "title": "Example Reuters article",
            "url": "https://www.reuters.com/example",
            "snippet": "Example evidence."
        },
        {
            "title": "Example website",
            "url": "https://example.com/article",
            "snippet": "Example evidence."
        }
    ]

    result = evaluate_evidence(
        test_evidence
    )

    print(
        "TruthLens Evidence Evaluation Test"
    )

    print(
        "-----------------------------------"
    )

    print(
        "Total results:",
        len(result["results"])
    )

    print(
        "High credibility:",
        result["high_credibility_sources"]
    )

    print(
        "Medium credibility:",
        result["medium_credibility_sources"]
    )