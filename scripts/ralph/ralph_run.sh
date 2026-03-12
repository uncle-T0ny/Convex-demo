#!/bin/bash
# Ralph Loop Runner - Interactive prompt selector for audit fix loop
# Adapted from Kitsi/scripts/ralph/ralph_run.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
PROMPTS_FILE="$SCRIPT_DIR/prompts.yml"

# Check if prompts file exists
if [[ ! -f "$PROMPTS_FILE" ]]; then
    echo "Error: prompts.yml not found at $PROMPTS_FILE"
    exit 1
fi

# Check if yq is installed
if ! command -v yq &> /dev/null; then
    echo "Error: yq is required but not installed."
    echo "Install with: brew install yq"
    exit 1
fi

# Change to project root
cd "$PROJECT_DIR"

# Get list of available prompts (top-level keys)
echo "Available prompts:"
echo "=================="
prompts=($(yq 'keys | .[]' "$PROMPTS_FILE"))

if [[ ${#prompts[@]} -eq 0 ]]; then
    echo "No prompts found in prompts.yml"
    exit 1
fi

# Display prompts with numbers
for i in "${!prompts[@]}"; do
    echo "  $((i+1)). ${prompts[$i]}"
done
echo ""

# Ask user to select a prompt
read -p "Enter prompt name or number: " selection

# Handle numeric selection
if [[ "$selection" =~ ^[0-9]+$ ]]; then
    index=$((selection - 1))
    if [[ $index -ge 0 && $index -lt ${#prompts[@]} ]]; then
        prompt_name="${prompts[$index]}"
    else
        echo "Error: Invalid selection number"
        exit 1
    fi
else
    prompt_name="$selection"
fi

# Validate prompt exists
if ! yq -e ".[\"$prompt_name\"]" "$PROMPTS_FILE" > /dev/null 2>&1; then
    echo "Error: Prompt '$prompt_name' not found in prompts.yml"
    exit 1
fi

echo ""
echo "Selected prompt: $prompt_name"
echo "=================="

# Extract prompt components
task=$(yq -r ".[\"$prompt_name\"].task" "$PROMPTS_FILE")
exit_condition=$(yq -r ".[\"$prompt_name\"].exit_condition" "$PROMPTS_FILE")
max_iterations=$(yq -r ".[\"$prompt_name\"].max_iterations // 10" "$PROMPTS_FILE")

# Display what we're running
echo "Task:"
echo "$task"
echo ""
echo "Exit condition:"
echo "$exit_condition"
echo ""
echo "Max iterations: $max_iterations"
echo ""

read -p "Run this prompt? (y/n): " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Aborted."
    exit 0
fi

# Run claude with ralph-loop
echo ""
echo "Starting ralph-loop..."
echo "=================="

# Convert multiline strings to single line and escape single quotes
task_single_line=$(echo "$task" | tr '\n' ' ' | sed 's/  */ /g' | sed 's/^ *//;s/ *$//' | sed "s/'/'\\\\''/g")
exit_single_line=$(echo "$exit_condition" | tr '\n' ' ' | sed 's/  */ /g' | sed 's/^ *//;s/ *$//' | sed "s/'/'\\\\''/g")

claude --permission-mode=bypassPermissions "/ralph-loop:ralph-loop '$task_single_line' --completion-promise '$exit_single_line' --max-iterations $max_iterations"
