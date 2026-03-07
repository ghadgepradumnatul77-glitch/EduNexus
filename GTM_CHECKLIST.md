# EduNexus SaaS: GTM Beta Launch Checklist

This checklist defines the "Definition of Done" for our transition from a technical prototype to a commercial SaaS product ready for institutional clients.

## 🔒 1. Security & Compliance (Non-Negotiable)
- [ ] **Final Penetration Audit**: Verify isolation on new `/onboarding` and `/dashboard` endpoints.
- [ ] **Infrastructure Hardening**: Ensure SSH is disabled on public nodes; use Session Manager for access.
- [ ] **Terms of Service (ToS)**: Clearly state data isolation and "Right to Audit" clauses.
- [ ] **SLA Definition**: Define uptime targets (e.g., 99.9%) and maintenance windows.

## 🚀 2. Infrastructure & Operations
- [ ] **Auto-Scaling Validation**: Verify ECS scaling policy triggers under the Load Test.
- [ ] **Backup Verification**: Automated check to ensure daily EBS/RDS snapshots are valid and recoverable.
- [ ] **Monitoring & Alarms**: Setup CloudWatch/Datadog alerts for:
    - 5xx Errors > 1%
    - Redis Stream Lag > 30 seconds
    - RDS CPU > 80%

## 🤝 3. Customer Onboarding & Support
- [ ] **Public Knowledge Base**: Basic "How to Setup Your Tenant" documentation.
- [ ] **Support Channel**: Integration of Intercom/Zendesk for real-time tenant assistance.
- [ ] **Feature Gating Audit**: Verify that high-tier features (e.g., Custom Domains) correctly trigger "Upgrade" prompts for Free tenants.

## 📈 4. Growth & Sales Readiness
- [ ] **Gorgon/Demo Ready**: Ensure `seed-demo.js` is updated with the latest product features.
- [ ] **Billing Atomic Sync**: Manually verify a Stripe Checkout session result to ensure the `subscription_tier` updates matches.
- [ ] **Beta Feedback Loop**: Setup a per-tenant survey mechanism for initial users.

## 🧠 5. Market Validation Gate (Founder's Critical Path)
*Scaling before feedback kills startups.* Before onboarding the next 10 institutions, the following gates must be cleared:
- [ ] **Retention Proof**: 3 beta tenants successfully complete 30 days of active usage.
- [ ] **Monetization Proof**: At least 1 successful conversion from a Free/Trial tier to a Paid plan.
- [ ] **Product-Market Fit (PMF) Signal**: At least 1 high-impact feature request generated from actual institutional usage.
- [ ] **Churn Analysis**: At least 1 churn signal or drop-off point identified and analyzed from telemetry.

## 🏢 6. Phase 9 Execution: Controlled Institutional Beta
*The final gate before massive scaling.* Focus on validation, not just uptime.
- [ ] **Curated Onboarding**: Success in onboarding 3 institutions with < 800 students.
- [ ] **Operational Rhythm**: Establish and maintain weekly 30-min check-ins with client admins.
- [ ] **TTB Observation**: Document "Time To Baseline" (Signup -> First Attendance/Mark).
- [ ] **The "Aha!" Hunt**: Identify the exact moment/feature where the client sees unique value.
- [ ] **Friction Log**: Dedicated log for UI/UX friction points discovered during live usage.
- [ ] **Sales Objection Repository**: Document every "Why we wouldn't buy yet" signal.
- [ ] **Pricing Validation**: Confirm that the client is comfortable with the current tier pricing ($/student or $/mo).

---
**Institutional Launch Policy**: No client with > 1,000 students should be onboarded until Section 1 & 2 are 100% completed.
