#!/usr/bin/env python3
"""
Fix camelCase / snake_case mismatch in sama-economie-full.sql
Converts ALL camelCase column identifiers to snake_case in:
  - CREATE TABLE column definitions (DDL)
  - INSERT INTO column lists
  - CREATE INDEX column references
  - UNIQUE constraint column references
  - Trigger function INSERT statements
"""

import re
import sys

INPUT_FILE = "/home/z/my-project/download/sama-economie-full.sql"
OUTPUT_FILE = "/home/z/my-project/download/sama-economie-full.sql"

def camel_to_snake(name):
    """Convert camelCase to snake_case."""
    s1 = re.sub(r'([A-Z]+)([A-Z][a-z])', r'\1_\2', name)
    s2 = re.sub(r'([a-z\d])([A-Z])', r'\1_\2', s1)
    return s2.lower()

# ============================================================
# All camelCase column identifiers found in the SQL file
# (from DDL definitions, INSERT statements, indexes, constraints)
# ============================================================

# Compound identifiers (longer) - must be listed for completeness
COMPOUND_CAMEL = [
    "fromUserId",
    "toUserId",
    "winnerId",
    "lenderId",
    "borrowerId",
    "viewerId",
    "viewedId",
    "demandId",
    "buyerId",
    "sellerId",
    "productId",
    "serviceId",
    "loanId",
    "projectId",
    "createdAt",
    "updatedAt",
]

# Simple identifiers
SIMPLE_CAMEL = [
    "userId",
    "shopId",
    "ownerId",
    "postId",
]

ALL_CAMEL = COMPOUND_CAMEL + SIMPLE_CAMEL

# Build mapping
mapping = {}
for c in ALL_CAMEL:
    mapping[c] = camel_to_snake(c)

print("Mapping:")
for camel, snake in sorted(mapping.items(), key=lambda x: -len(x[0])):
    print(f"  {camel:20s} → {snake}")

# ============================================================
# Read file
# ============================================================
with open(INPUT_FILE, "r", encoding="utf-8") as f:
    content = f.read()

original_size = len(content)

# ============================================================
# Strategy: Use regex with negative lookbehind/lookahead to
# only match column identifiers, not table names or string literals.
#
# Key insight: column identifiers appear in these contexts:
#   1. DDL:       colname TYPE ...          (unquoted, start of line-ish)
#   2. INSERT:    "colName" or colName      (in column list between parens)
#   3. INDEX:     TableName(colName)        (in parens after table)
#   4. UNIQUE:    UNIQUE(colName, ...)      (in parens)
#   5. REFERENCE: REFERENCES "Table"(colName) (in parens)
#
# We need to AVOID matching:
#   - Table names: "User", "Shop", "Product", etc. (PascalCase with quotes)
#   - String values in VALUES (...): 'some text'
#   - JSONB key references: ->>'key'
#
# Approach: Two passes
#   Pass 1: Replace "camelCase" (double-quoted) with snake_case
#   Pass 2: Replace unquoted \bcamelCase\b with snake_case
#
# Since "read" is a PostgreSQL reserved word, we keep it quoted.
# ============================================================

# Sort by length descending to avoid partial matching issues
# (though \b should prevent this, being extra safe)
all_camel_sorted = sorted(ALL_CAMEL, key=len, reverse=True)

# ---- Pass 1: Replace double-quoted camelCase ----
# Pattern: "(camelCase)" where camelCase is one of our identifiers
# This handles INSERT column lists, INDEX refs, UNIQUE constraints, etc.
for camel in all_camel_sorted:
    snake = mapping[camel]
    # Replace "camelCase" with snake_case (remove quotes)
    content = content.replace(f'"{camel}"', snake)

# Count how many quoted replacements were made
# (We can't easily count after the fact, but we can verify)

# ---- Pass 2: Replace unquoted camelCase identifiers ----
# Build a single regex pattern matching any camelCase identifier as a whole word
pattern = r'\b(' + '|'.join(re.escape(c) for c in all_camel_sorted) + r')\b'

def replace_fn(match):
    name = match.group(1)
    if name in mapping:
        return mapping[name]
    return name

content = re.sub(pattern, replace_fn, content)

# ---- Verification ----
final_size = len(content)
print(f"\nOriginal size: {original_size:,} bytes")
print(f"Final size:    {final_size:,} bytes")

# Check that no double-quoted camelCase remains (except "read" and table names)
remaining_quoted_camel = []
for camel in ALL_CAMEL:
    if f'"{camel}"' in content:
        remaining_quoted_camel.append(camel)

if remaining_quoted_camel:
    print(f"\nWARNING: Still found quoted camelCase: {remaining_quoted_camel}")
    sys.exit(1)
else:
    print("\n✓ No quoted camelCase identifiers remain (except \"read\" which is a reserved word)")

# Check that no unquoted camelCase identifiers remain
for camel in ALL_CAMEL:
    # Use word boundary regex to check
    if re.search(r'\b' + re.escape(camel) + r'\b', content):
        print(f"WARNING: Unquoted camelCase '{camel}' still found!")
        # Find context
        for i, line in enumerate(content.split('\n'), 1):
            if re.search(r'\b' + re.escape(camel) + r'\b', line):
                print(f"  Line {i}: {line.strip()[:100]}")
        sys.exit(1)

print("✓ No unquoted camelCase identifiers remain")
print("\nAll column identifiers converted to snake_case!")

# ============================================================
# Write output
# ============================================================
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    f.write(content)

print(f"\nFixed file written to: {OUTPUT_FILE}")
