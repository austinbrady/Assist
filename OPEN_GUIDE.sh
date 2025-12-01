#!/bin/bash
# Open the guide in browser for easy PDF export

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
GUIDE_FILE="$SCRIPT_DIR/HOW_TO_USE.html"

if [ -f "$GUIDE_FILE" ]; then
    echo "Opening guide in browser..."
    echo "To create PDF: Press Command+P, then click 'Save as PDF'"
    open "$GUIDE_FILE"
else
    echo "Guide file not found: $GUIDE_FILE"
    exit 1
fi
