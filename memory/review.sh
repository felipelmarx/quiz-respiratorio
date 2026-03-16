#!/usr/bin/env bash
# ============================================
# review.sh — Surface decisions flagged for review
# Usage: bash memory/review.sh
# ============================================

set -euo pipefail

CSV_FILE="$(dirname "$0")/decisions.csv"

if [ ! -f "$CSV_FILE" ]; then
    echo "Error: decisions.csv not found at $CSV_FILE"
    exit 1
fi

TODAY=$(date +%Y-%m-%d)
FLAGGED=0

echo ""
echo "========================================"
echo "  DECISION REVIEW — $TODAY"
echo "========================================"
echo ""

# Read pipe-delimited file, skip header
while IFS='|' read -r date decision reasoning expected_outcome review_date status; do
    if [ "$status" = "REVIEW DUE" ]; then
        FLAGGED=1
        echo "  [REVIEW DUE]"
        echo "  Date:     $date"
        echo "  Decision: $decision"
        echo "  Reasoning: $reasoning"
        echo "  Expected:  $expected_outcome"
        echo "  Review by: $review_date"
        echo "  ----------------------------------------"
        echo ""
    fi
done < <(tail -n +2 "$CSV_FILE")

if [ "$FLAGGED" -eq 0 ]; then
    echo "  No decisions flagged for review."
    echo ""
    echo "  Upcoming reviews:"
    while IFS='|' read -r date decision reasoning expected_outcome review_date status; do
        if [ "$status" = "ACTIVE" ]; then
            echo "    - [$review_date] $decision"
        fi
    done < <(tail -n +2 "$CSV_FILE")
    echo ""
fi

echo "========================================"
