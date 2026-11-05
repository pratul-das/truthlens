import requests
from urllib.parse import quote, urlparse, parse_qs


def search_web_evidence(query: str, max_results: int = 5):
    """
    Search the web for evidence related to a claim.

    Uses DuckDuckGo's public HTML search page.
    This is only an evidence-discovery layer.
    It does NOT decide whether a claim is true or false.
    """

    if not query or not query.strip():
        return {
            "success": False,
            "error": "Search query is empty.",
            "results": []
        }

    search_query = query.strip()

    url = (
        "https://html.duckduckgo.com/html/?q="
        + quote(search_query)
    )

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/154.0.0.0 "
            "Safari/537.36"
        )
    }

    try:
        response = requests.get(
            url,
            headers=headers,
            timeout=10
        )

        response.raise_for_status()

        from bs4 import BeautifulSoup

        soup = BeautifulSoup(
            response.text,
            "html.parser"
        )

        results = []

        for result in soup.select(".result")[:max_results]:

            title_element = result.select_one(
                ".result__title"
            )

            link_element = result.select_one(
                ".result__a"
            )

            snippet_element = result.select_one(
                ".result__snippet"
            )

            if not link_element:
                continue

            title = (
                title_element.get_text(" ", strip=True)
                if title_element
                else link_element.get_text(" ", strip=True)
            )

            link = link_element.get("href", "")
            # Convert DuckDuckGo redirect URL to the actual source URL
            if "uddg=" in link:
                parsed_url = urlparse(link)
                params = parse_qs(parsed_url.query)

                if "uddg" in params:
                    link = params["uddg"][0]


            snippet = (
                snippet_element.get_text(
                    " ",
                    strip=True
                )
                if snippet_element
                else ""
            )

            results.append({
                "title": title,
                "url": link,
                "snippet": snippet
            })

        return {
            "success": True,
            "error": None,
            "query": search_query,
            "results": results
        }

    except requests.exceptions.RequestException as error:

        return {
            "success": False,
            "error": f"Web search failed: {error}",
            "results": []
        }

    except Exception as error:

        return {
            "success": False,
            "error": f"Evidence extraction failed: {error}",
            "results": []
        }


if __name__ == "__main__":

    test_query = "Virat Kohli married"

    result = search_web_evidence(test_query)

    print("\nEvidence Search Test")
    print("--------------------")

    if result["success"]:

        print(
            f"Found {len(result['results'])} result(s).\n"
        )

        for item in result["results"]:

            print("Title:", item["title"])
            print("URL:", item["url"])
            print("Snippet:", item["snippet"])
            print("-" * 60)

    else:

        print("Error:", result["error"])