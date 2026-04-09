import subprocess
import os
import re

with open('restore_blog_posts_clean.sql', 'r') as f:
    sql_content = f.read()

# Extract the values parts
# INSERT INTO blog_posts (...) VALUES (...), (...);
# We want to extract each (...), and run it as a separate INSERT.

# Simplest way: split by "), ("
# But let's be more precise. We want each row.

# This regex finds all (row_data_here) blocks after VALUES
match = re.search(r'VALUES\s*\((.*)\)\s*ON CONFLICT', sql_content, re.DOTALL)
if not match:
    print("Could not find VALUES block")
    exit(1)

rows_str = match.group(1)
# Note: rows are separated by "),\n("
rows = re.split(r'\),\s*\(', rows_str)

my_env = os.environ.copy()
my_env["PATH"] = "/usr/local/bin:" + my_env.get("PATH", "")

columns = "title, slug, excerpt, content, category, author, image, published, created_at"

for i, rowdata in enumerate(rows):
    if not rowdata.strip(): continue
    
    # Ensure it ends and starts correctly
    # If it's the first one it doesn't have the starting ( from split if we split by "), ("
    # But re.split(r'\),\s*\(') means it removes the boundaries.
    
    full_query = f"INSERT INTO blog_posts ({columns}) VALUES ({rowdata}) ON CONFLICT (slug) DO NOTHING;"
    
    print(f"Inserting row {i+1}...")
    process = subprocess.Popen(
        ['/usr/local/bin/npx', '-y', '@insforge/cli', 'db', 'query', full_query],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        env=my_env
    )
    stdout, stderr = process.communicate()
    if process.returncode == 0:
        print(f"Row {i+1} success")
    else:
        print(f"Row {i+1} failed: {stderr}")

print("Done")
