import subprocess
import os

with open('restore_blog_posts_clean.sql', 'r') as f:
    sql = f.read()

# Split by semicolon if needed or just send the whole thing
# But query might not like multiple statements.
# Actually it's one big INSERT statement.

try:
    my_env = os.environ.copy()
    my_env["PATH"] = "/usr/local/bin:" + my_env.get("PATH", "")
    process = subprocess.Popen(
        ['/usr/local/bin/npx', '-y', '@insforge/cli', 'db', 'query', sql],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        env=my_env
    )
    stdout, stderr = process.communicate()
    print("STDOUT:", stdout)
    print("STDERR:", stderr)
    if process.returncode == 0:
        print("Success")
    else:
        print("Failed")
except Exception as e:
    print("Error:", e)
