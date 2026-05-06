# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: objectives-workflow.spec.ts >> Complete Objectives Workflow >> Part 3: MANAGER Views Department Objectives >> should not see objectives from other departments
- Location: tests/e2e/objectives-workflow.spec.ts:162:9

# Error details

```
Test timeout of 30000ms exceeded while setting up "managerPage".
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - img "Strategize Logo" [ref=e4]
    - generic [ref=e5]:
      - generic [ref=e7]:
        - generic [ref=e8]:
          - heading "Welcome Back" [level=1] [ref=e9]
          - paragraph [ref=e10]: Please enter your email and password to continue
        - generic [ref=e12]:
          - img [ref=e14]
          - textbox "Email" [ref=e17]
        - generic [ref=e19]:
          - img [ref=e21]
          - textbox "Password" [active] [ref=e24]
          - button [ref=e25]:
            - img [ref=e26]
        - generic [ref=e29]:
          - generic [ref=e30]:
            - checkbox "Remember me" [ref=e31]
            - checkbox
            - generic [ref=e32]: Remember me
          - link "Forgot Password?" [ref=e33] [cursor=pointer]:
            - /url: /auth/forgot-password
        - button "Login" [disabled]
      - generic [ref=e34]: © 2024 Stratify. Align. Act. Achieve. All Rights Reserved.
    - generic [ref=e36]:
      - heading "Align. Act. Achieve." [level=2] [ref=e37]
      - paragraph [ref=e38]: Your strategic workspace for long-term planning.
      - generic [ref=e39]:
        - img "Dashboard Preview" [ref=e40]
        - img "Chart Sample Overlay" [ref=e41]
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e47] [cursor=pointer]:
    - img [ref=e48]
  - alert [ref=e51]
  - button "Open Debug Panel" [ref=e52]:
    - img
```