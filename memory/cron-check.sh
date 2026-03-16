#!/usr/bin/env bash
# ============================================
# cron-check.sh — Flag decisions that hit their review date
# Usage: bash memory/cron-check.sh
# Cron:  0 9 * * * cd /path/to/quiz-respiratorio && bash memory/cron-check.sh
# ============================================

set -euo pipefail

CSV_FILE="$(dirname "$0")/decisions.csv"

if [ ! -f "$CSV_FILE" ]; then
    echo "Error: decisions.csv not found at $CSV_FILE"
    exit 1
fi

TODAY=$(date +%Y-%m-%d)
UPDATED=0
TEMP_FILE=$(mktemp)

# Copy header
head -1 "$CSV_FILE" > "$TEMP_FILE"

# Process each row (pipe-delimited)
while IFS='|' read -r date decision reasoning expected_outcome review_date status; do
    if [ "$status" = "ACTIVE" ] && [ ! "$TODAY" \< "$review_date" ]; then
        # Flag as REVIEW DUE
        echo "${date}|${decision}|${reasoning}|${expected_outcome}|${review_date}|REVIEW DUE" >> "$TEMP_FILE"
        echo "FLAGGED: $decision (review date: $review_date)"
        UPDATED=1
    else
        echo "${date}|${decision}|${reasoning}|${expected_outcome}|${review_date}|${status}" >> "$TEMP_FILE"
    fi
done < <(tail -n +2 "$CSV_FILE")

# Replace original file
mv "$TEMP_FILE" "$CSV_FILE"

if [ "$UPDATED" -eq 0 ]; then
    echo "No decisions due for review today ($TODAY)."
else
    echo ""
    echo "Run 'bash memory/review.sh' to see flagged items."
fi
