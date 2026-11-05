"""
TruthLens Services Package
"""

from .fact_checker import search_fact_checks
from .evidence_search import search_web_evidence

from .result_interpreter import (
    interpret_fact_check_rating
)

from .evidence_evaluator import (
    evaluate_evidence
)

from .claim_evaluator import (
    evaluate_claim_against_evidence
)

from .final_verifier import (
    combine_verification_results
)