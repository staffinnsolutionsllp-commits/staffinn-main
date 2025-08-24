Software Requirements Specification 
(SRS) 
Project Title: Restaurant POS & Web Presence Platform (RPWP) 
Version: 1.0 (Draft) 
Date: 22 Aug 2025 
Prepared by: Rachit Avasthi (Product Owner) & Team 
1. Introduction 
1.1 Purpose 
This SRS defines the requirements for building a multi-tenant SaaS that provides restaurants 
with a branded website/app, direct online ordering, and an integrated POS stack (billing, KOT, 
inventory, CRM, analytics). It targets cafés, fine-dine, QSRs, cloud kitchens, and multi-outlet 
franchises in India. 
1.2 Scope 
● Frontend: Client-facing website/app for each restaurant (ordering, menu, table booking) 
and internal dashboards (POS, KDS, Admin). 
● Backend: Multi-tenant API, business logic, reporting, and integrations with payments, 
delivery aggregators, messaging, and printers. 
● Platforms: Web (desktop/tablet/mobile PWA) + optional Android/iOS wrappers. 
● Hardware: Works with commodity Android tablets/PCs, USB/Thermal/Bluetooth printers, 
barcode scanners, cash drawers. 
1.3 Product Vision & Goals 
● Give restaurants full brand control (custom domain, theme) + 0% commission direct 
orders. 
● Provide a lightweight, fast POS with offline-first capabilities. 
● Offer actionable analytics, inventory accuracy, and automated marketing to 
increase repeat sales. 
1.4 Stakeholders 
● Restaurant Owner (RO) 
● Manager (RM) 
● Staff/Waiter/Cashier (ST) 
● Kitchen Staff (KS) 
● Delivery Partner (DP) (in-house) 
● Customer/Diner (CU) 
● Platform Admin (PA) (SaaS operator) 
1.5 Definitions & Acronyms 
● POS: Point of Sale 
● KOT: Kitchen Order Ticket 
● KDS: Kitchen Display System 
● SKU: Stock Keeping Unit 
● PWA: Progressive Web App 
● OTP: One-Time Password 
● GST: Goods & Services Tax (India) 
● HSM: Hardware Security Module 
2. Overall Description 
2.1 System Context 
RPWP is a multi-tenant SaaS. Each tenant (restaurant) has: 
● A branded website/app for customers. 
● A back-office (owner/manager) and POS terminals (cashier/waiter). 
● Optional KDS screens in kitchen sections. 
● Data lives in logically isolated schemas per tenant. 
2.2 User Classes & Characteristics 
● CU: Non-technical; expects speed, clear menus, UPI, live order tracking. 
● ST: Needs minimal training; quick order entry and KOT printing. 
● RM/RO: Wants inventory, pricing, offers, and outlet control. 
● KS: Glanceable KDS, bump orders, course timing. 
● PA: Multitenancy ops, billing, support, compliance. 
2.3 Assumptions & Dependencies 
● Reliable internet is not guaranteed in-store → offline-first POS with sync. 
● Indian tax regime (GST) with HSN/SAC, e-invoicing optional for some businesses. 
● Payment gateways (Razorpay/Paytm/Stripe) and messaging (WhatsApp/SMS). 
● Third-party delivery integrations (Zomato/Swiggy) optional. 
2.4 Constraints 
● Must run on low-cost Android tablets and entry-level PCs. 
● Receipt printers (58/80mm), USB/Bluetooth/TCP supported. 
● Data residency: India-first hosting preferred. 
● Privacy & security: PCI-DSS (for payments), ISO27001 best practices. 
3. Functional Requirements 
Prioritisation: M (Must), S (Should), C (Could), W (Won’t for v1). 
Traceability IDs: FR-x.y 
3.1 Tenant Onboarding & Branding 
● FR-1.1 (M): Sign-up with email/phone + OTP. 
● FR-1.2 (M): Create restaurant profile (name, GSTIN, FSSAI, address, hours). 
● FR-1.3 (M): Theme builder (logo, colours, fonts, hero images). 
● FR-1.4 (S): Custom domain mapping with automated SSL via ACME. 
● FR-1.5 (S): Template gallery (QSR, café, fine-dine, cloud kitchen). 
3.2 Menu & Catalogue Management 
● FR-2.1 (M): Categories & items with images, variants, add-ons, combos. 
● FR-2.2 (M): Pricing by outlet; taxes (GST %), HSN/SAC mapping. 
● FR-2.3 (M): Availability (out of stock, dayparting, seasonal). 
● FR-2.4 (S): Allergen & dietary tags; nutrition facts. 
● FR-2.5 (C): AI menu optimiser (popular combos, price suggestions). 
3.3 Customer Website & Ordering (PWA) 
● FR-3.1 (M): SEO-friendly menu & landing pages. 
● FR-3.2 (M): Dine-in (QR on table), takeaway, delivery order flows. 
● FR-3.3 (M): Cart, coupon codes, tip, address book, order tracking. 
● FR-3.4 (M): Payments: UPI, cards, wallets; COD toggle. 
● FR-3.5 (S): Time-slot delivery & curbside pickup. 
● FR-3.6 (S): Google Maps delivery radius & fees tiers. 
● FR-3.7 (C): Multi-language UI (EN + regional). 
3.4 POS (Front-of-House) 
● FR-4.1 (M): Quick order entry; table layout & merge/split bills. 
● FR-4.2 (M): KOT printing by kitchen station; reprint; void with reason. 
● FR-4.3 (M): Discounts (item/bill), service charge, tips. 
● FR-4.4 (M): Multiple tenders (cash, card, UPI, vouchers). 
● FR-4.5 (S): Offline mode with local cache & conflict-free sync. 
● FR-4.6 (S): Hold/park order; recall; guest count & courses. 
● FR-4.7 (C): Bill split by seat/course. 
3.5 Kitchen Display System (KDS) 
● FR-5.1 (M): Ticket view with prep timers; bump/recall. 
● FR-5.2 (S): Course firing & expo screen; colour states. 
● FR-5.3 (C): Sound/visual alerts; printer fallback. 
3.6 Inventory & Recipe Management 
● FR-6.1 (M): Ingredients, units, suppliers, par levels. 
● FR-6.2 (M): Recipe BOM; auto stock deduction on sale. 
● FR-6.3 (S): GRN, purchase orders, returns; cost of goods (COGS). 
● FR-6.4 (S): Wastage logging; variance; stock audits. 
● FR-6.5 (C): Batch/expiry tracking; production planning. 
3.7 CRM, Loyalty & Marketing 
● FR-7.1 (M): Customer profiles, order history, consent flags. 
● FR-7.2 (M): Coupons (flat %, BOGO, min cart). 
● FR-7.3 (S): Points-based loyalty; tiers; birthday/anniversary offers. 
● FR-7.4 (S): WhatsApp/SMS/E-mail campaigns; templates & segments. 
● FR-7.5 (C): Feedback & reviews widget; NPS. 
3.8 Delivery & Integrations 
● FR-8.1 (S): Third-party delivery (Swiggy/Zomato) order ingest (read-only at v1). 
● FR-8.2 (S): In-house delivery app for drivers; OTP at handoff. 
● FR-8.3 (C): Maps-ETA; route optimisation. 
3.9 Payments, Billing & Taxation 
● FR-9.1 (M): Gateways: Razorpay/Paytm/Stripe; UPI intent & collect. 
● FR-9.2 (M): GST-compliant invoices; HSN/SAC, CGST/SGST/IGST; round-off. 
● FR-9.3 (S): E-invoicing integration (IRP) for eligible businesses. 
● FR-9.4 (S): Refunds, partial/ full; settlement reports. 
3.10 Analytics & Reporting 
● FR-10.1 (M): Sales dashboard (by day/hour/item/category/outlet). 
● FR-10.2 (M): Top items, low movers, peak hours, AOV. 
● FR-10.3 (S): Inventory valuation; COGS; GP%. 
● FR-10.4 (S): Export CSV/PDF; scheduled e-mails/WhatsApp. 
3.11 User Management & Roles 
● FR-11.1 (M): Roles: RO, RM, ST, KS, PA with granular permissions. 
● FR-11.2 (S): Audit logs (who did what, when). 
● FR-11.3 (C): SSO (Google/Microsoft) for RO/RM. 
3.12 Notifications 
● FR-12.1 (M): Order status push/WhatsApp/SMS. 
● FR-12.2 (S): Low-stock alerts; sales milestones. 
3.13 Multitenancy & Billing (SaaS Operator) 
● FR-13.1 (M): Tenant provisioning; plan limits; usage metrics. 
● FR-13.2 (M): Subscription management; invoices; GST for SaaS. 
● FR-13.3 (S): In-app upsell & add-on marketplace. 
3.14 Content & SEO 
● FR-14.1 (M): Pages (Home/Menu/About/Contact), blog, meta tags, sitemaps. 
● FR-14.2 (S): Schema.org for menu, reviews, local business. 
3.15 Accessibility & Localisation 
● FR-15.1 (M): WCAG 2.1 AA for customer site. 
● FR-15.2 (S): Multi-language content (EN/Hindi/regional) per restaurant. 
3.16 Support & Helpdesk 
● FR-16.1 (S): In-app chat; ticketing; knowledge base. 
4. Non-Functional Requirements (NFRs) 
4.1 Performance & Scalability 
● NFR-1: Customer pages TTFB < 300 ms (edge caching); P95 page load < 2.5 s on 3G. 
● NFR-2: POS actions (add item, print KOT) P95 < 300 ms local; cloud sync within 5 s. 
● NFR-3: Scale to 10k tenants, 50k DAU, 1k concurrent orders/minute. 
4.2 Availability & Reliability 
● NFR-4: 99.9% uptime for core APIs; POS offline mode up to 24h. 
● NFR-5: Zero data loss on sync conflicts (CRDT/event-sourcing strategy). 
4.3 Security & Compliance 
● NFR-6: JWT/OAuth2; MFA for admin roles; RBAC enforced server-side. 
● NFR-7: Data isolation per tenant (schema or row-level security). 
● NFR-8: At-rest encryption (AES-256); in-transit TLS 1.2+; KMS/HSM for secrets. 
● NFR-9: PCI-DSS scope minimised (tokenised payments only); GDPR/DPDP readiness; 
data retention policy. 
4.4 Maintainability & Observability 
● NFR-10: 80% unit test coverage of domain logic; CI/CD with blue-green deploys. 
● NFR-11: Centralised logs, metrics, traces; SLOs & alerts (error rate, latency, dropped 
syncs). 
4.5 Usability 
● NFR-12: POS operable with one hand on 8-inch tablet; < 30 min training. 
5. System Architecture (High-Level) 
5.1 Suggested Tech Stack 
● Frontend: Next.js/React (PWA), React Native (optional), Tailwind, shadcn/ui. 
● POS App: React (Electron or Tauri for desktop), React Native for Android; service 
worker for offline. 
● Backend: Node.js (NestJS/Express) or Django/FastAPI; GraphQL/REST. 
● DB: PostgreSQL (Row Level Security per tenant) + Redis (cache/queues). 
● Eventing: Kafka/Redpanda or RabbitMQ for order/inventory events. 
● Storage: S3-compatible (images, receipts). 
● Infra: Vercel (web) + AWS/GCP (APIs/workers); Cloudflare CDN; Terraform/IaC. 
5.2 Key Services (Microservice-friendly boundaries) 
● Identity & Tenancy 
● Menu & Catalogue 
● Orders & POS 
● Inventory & Procurement 
● Billing & Invoicing 
● Payments 
● CRM & Marketing 
● Analytics & Reporting 
● Integrations (Gateways, Delivery, WhatsApp/SMS) 
5.3 Data Model (Core Entities) 
● Tenant, Outlet, Table, User, Role, Device 
● MenuCategory, MenuItem, Variant, AddOn, Combo 
● Order, OrderItem, KOT, Payment, Invoice, Coupon 
● Customer, Address, LoyaltyPoint, Campaign, Message 
● Ingredient, Recipe, StockLedger, Supplier, PurchaseOrder, GRN 
● DeliveryAssignment, Driver 
● WebPage, BlogPost, MediaAsset 
6. API Requirements (Representative) 
Final API will be versioned (v1) and support REST + Webhooks. Sample endpoints: 
● POST /v1/auth/login 
● POST /v1/tenants (provision) 
● GET/POST /v1/outlets 
● GET/POST /v1/menu/categories|items 
● POST /v1/orders (source: dine-in/takeaway/delivery/web) 
● POST /v1/orders/{id}/pay 
● GET /v1/orders/stream (SSE/WebSocket for POS/KDS) 
● POST /v1/kot 
● POST /v1/inventory/consume 
● POST /v1/coupons/validate 
● POST /v1/campaigns/send (provider=WhatsApp/SMS/Email) 
● POST /v1/integrations/razorpay/webhook 
● POST /v1/integrations/zomato/webhook 
7. Integrations 
7.1 Payments 
● Razorpay (UPI, cards), Paytm, Stripe (fallback). Webhooks for payments, refunds, 
settlements. 
7.2 Messaging 
● WhatsApp Business API provider (e.g., Gupshup/Meta BSP), SMS (Textlocal/Kaleyra), 
E-mail (SES/SendGrid). 
7.3 Delivery 
● Aggregators (read-only ingest initially), Maps (Google/Mapbox), in-house driver app 
(phase 2). 
7.4 Printers & Peripherals 
● ESC/POS printers over USB/BT/TCP; barcode scanners; cash drawers. 
8. Data & Privacy 
● Consent Management: Marketing opt-ins per channel; purpose-specific consent. 
● PII Minimisation: Store only necessary data; tokenise payment data. 
● Data Retention: Orders 8 years (for GST); logs 90 days; revocable deletion for 
marketing data on request. 
● Backups: Automated daily snapshots; PITR; encrypted at rest. 
9. Reporting & KPIs 
● Sales by channel/outlet/waiter/hour. 
● AOV, conversion rate, repeat rate, CLV. 
● Inventory variance, wastage %, COGS %. 
● Campaign ROI; coupon redemption. 
10. Acceptance Criteria (Samples) 
● AC-1: A new tenant can sign up, publish a branded site on subdomain, accept UPI 
payments, and print KOT within 60 minutes of onboarding. 
● AC-2: POS functions (add item → KOT → payment → invoice) complete in < 2 minutes 
with no network; sync reconciles when back online. 
● AC-3: GST invoice matches configured tax rules; rounding per Indian standards. 
● AC-4: Inventory deducts as per recipe on each sale; low-stock alerts trigger at par level. 
● AC-5: Customer receives WhatsApp order confirmation within 10 seconds of successful 
payment. 
11. Test Strategy (High-Level) 
● Unit Tests: Domain logic (orders, taxes, inventory). 
● Integration Tests: Payments, webhooks, printer drivers (emulators). 
● E2E Tests: Cypress/Playwright for web; scripted POS flows. 
● Load Tests: Orders/min, POS concurrency, reporting queries. 
● UAT: Pilot with 3–5 restaurants (QSR, café, cloud kitchen). 
12. Deployment & DevOps 
● Environments: Dev, Staging, Prod; feature flags. 
● CI/CD: Linting, tests, build artefacts, infra deploy (Terraform), blue-green. 
● Observability: Centralised logs (ELK/CloudWatch), metrics (Prometheus), tracing 
(OTel). 
● Rollbacks: One-click revert; DB migrations reversible. 
13. Rollout Plan (Phases) 
1. Phase 0 – MVP (8–10 weeks): Tenant onboarding, menu, customer ordering 
(QR/delivery/takeaway), UPI payments, basic POS, KOT printing, basic reports. 
2. Phase 1 – Inventory & CRM (6–8 weeks): Recipes, stock deduction, coupons, basic 
campaigns, WhatsApp confirmations. 
3. Phase 2 – Advanced POS & KDS (6–8 weeks): Offline-first POS, KDS, table 
management, split bills. 
4. Phase 3 – Analytics & Integrations (6–8 weeks): COGS/GP, aggregator ingest, 
scheduled reports, multi-language. 
5. Phase 4 – Franchise & Marketplace (ongoing): Multi-outlet control, add-on 
marketplace, driver app. 
14. Out of Scope (for v1) 
● Aggregator order push-back (bi-directional) – read-only ingest only. 
● Deep route optimisation; rider pay management. 
● Full e-invoicing automation (pilot only). 
● Native iOS (PWA/RN wrapper sufficient initially). 
15. Risks & Mitigations 
● Printer compatibility issues: Maintain tested hardware list; provide network print 
service; fall back to PDF. 
● Offline sync conflicts: Use CRDT/event log; last-writer-wins with user prompts. 
● Regulatory changes: Configurable tax engine; rule-driven invoices. 
● High churn of small restaurants: Low-cost plans; concierge onboarding; fast support. 
16. Pricing (Indicative for GTM) 
● Starter: ₹999/mo/outlet – Website, direct orders, basic POS, UPI. 
● Growth: ₹2,499/mo – Inventory, coupons, basic CRM, scheduled reports. 
● Premium: ₹4,999/mo – Multi-outlet, advanced analytics, KDS, offline POS. 
● Setup: ₹10,000–₹25,000 one-time (branding, domain, menu upload). 
17. Appendices 
17.1 Primary Use Cases (UML-style, textual) 
● UC-01: Customer scans table QR → browses menu → places order → pays UPI → KOT 
prints → KS prepares → order served → bill closed. 
● UC-02: Owner updates prices & out-of-stock → changes reflect on site and POS in < 10 
s. 
● UC-03: New outlet added → inherits menu → overrides stock/pricing. 
● UC-04: Low stock alert triggers → RM raises Purchase Order → GRN updates stock. 
● UC-05: Campaign sent to segment (last 30 days buyers) → coupon redemptions 
tracked. 
17.2 Sample Reporting Catalogue 
● Daily Z-report; GST tax summary; item-wise sales; hourly heatmap; voids/discounts 
audit; staff performance; inventory consumption vs sales. 
17.3 Accessibility Checklist 
● Keyboard navigation; contrast ratios; alt text; focus states; error hints; form labels; ARIA 
roles. 