import os
import requests
from dotenv import load_dotenv


# Load environment variables from .env
load_dotenv()

FACT_CHECK_API_KEY = os.getenv("FACT_CHECK_API_KEY")

FACT_CHECK_URL = (
    "https://factchecktools.googleapis.com/v1alpha1/claims:search"
)


def search_fact_checks(query: str, language_code: str = "en"):
    """
    Search Google Fact Check Tools API for existing fact checks.

    Returns:
        A list of fact-check results.
    """

    if not FACT_CHECK_API_KEY:
        return {
            "success": False,
            "error": "Fact Check API key is not configured.",
            "results": []
        }

    if not query or not query.strip():
        return {
            "success": False,
            "error": "Search query is empty.",
            "results": []
        }

    params = {
        "key": FACT_CHECK_API_KEY,
        "query": query.strip(),
        "languageCode": language_code
    }

    try:
        response = requests.get(
            FACT_CHECK_URL,
            params=params,
            timeout=10
        )

        response.raise_for_status()

        data = response.json()

        results = []

        for claim in data.get("claims", []):

            claim_text = claim.get("text", "")

            for review in claim.get("claimReview", []):

                publisher = review.get("publisher", {})

                results.append({
                    "claim": claim_text,

                    "publisher": publisher.get(
                        "name",
                        "Unknown"
                    ),

                    "publisher_site": publisher.get(
                        "site",
                        ""
                    ),

                    "title": review.get(
                        "title",
                        ""
                    ),

                    "rating": review.get(
                        "textualRating",
                        "Not available"
                    ),

                    "review_date": review.get(
                        "reviewDate",
                        ""
                    ),

                    "url": review.get(
                        "url",
                        ""
                    ),

                    "language": review.get(
                        "languageCode",
                        language_code
                    )
                })

        return {
            "success": True,
            "error": None,
            "results": results
        }

    except requests.exceptions.RequestException as error:

        return {
            "success": False,
            "error": f"Fact Check API request failed: {error}",
            "results": []
        }

    except ValueError:

        return {
            "success": False,
            "error": "Fact Check API returned invalid JSON.",
            "results": []
        }


if __name__ == "__main__":

    test_query = "COVID vaccine"

    result = search_fact_checks(test_query)

    print("\nFact Check Test")
    print("----------------")

    if result["success"]:

        print(
            f"Found {len(result['results'])} fact-check result(s).\n"
        )

        for item in result["results"][:5]:

            print("Claim:", item["claim"])
            print("Publisher:", item["publisher"])
            print("Rating:", item["rating"])
            print("Title:", item["title"])
            print("URL:", item["url"])
            print("-" * 60)

    else:

        print("Error:", result["error"])