---
name: security-guidance
description: Security reminder hook that warns about potential security issues when editing files
event: PreToolUse
---

# Security Guidance Hook

When editing code, monitor for the following security patterns and warn the user if detected:

## Patterns to Monitor

1. **Command Injection**: Use of `exec()`, `spawn()`, `system()`, or similar functions with unsanitized user input
2. **Cross-Site Scripting (XSS)**: Direct insertion of user input into HTML without sanitization (e.g., `innerHTML`, `dangerouslySetInnerHTML`)
3. **eval() Usage**: Use of `eval()` or `Function()` constructor with dynamic strings
4. **Dangerous HTML**: Use of `document.write()` or inline event handlers with dynamic content
5. **Pickle Deserialization**: Use of `pickle.loads()` or `pickle.load()` with untrusted data
6. **os.system() Calls**: Use of `os.system()` or `subprocess.call()` with shell=True
7. **SQL Injection**: String concatenation in SQL queries instead of parameterized queries
8. **Path Traversal**: File operations with unsanitized paths that could access files outside intended directories
9. **Hardcoded Secrets**: API keys, passwords, tokens, or credentials hardcoded in source files

## What to Do

When any of these patterns are detected in code being written or modified:
1. **WARN** the user about the specific security risk
2. **EXPLAIN** why it's dangerous
3. **SUGGEST** the secure alternative
4. **DO NOT** silently proceed with insecure code

## FunPrinting-Specific Security Concerns

Given this is a Next.js e-commerce application handling payments (Razorpay):
- Always validate authentication before payment operations
- Never expose API keys or secrets in client-side code
- Sanitize all user-uploaded file names and paths
- Use parameterized queries for MongoDB operations
- Validate and sanitize all form inputs server-side
- Use CSRF tokens for state-changing operations
- Implement rate limiting on sensitive endpoints
