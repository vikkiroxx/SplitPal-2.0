# 💸 SplitPal 2.0 PWA

SplitPal 2.0 is a premium, offline-ready Progressive Web Application for seamlessly managing shared expenses, mathematically reducing debts, and orchestrating trips via incredible Indian native UPI integration software. 

It is built utilizing incredibly fast **React (Vite)** capabilities, protected heavily by **Google OAuth**, and securely piped into a **Supabase PostgreSQL** backend boasting real-time web-socket synchronization!

## 🌟 Visual Theme
The interface invokes a futuristic _Dark-Mode Glassmorphism_ aesthetic accented heavily against a high-contrast Mint Green neon scheme intended to feel incredibly expensive, hyper-responsive, and satisfying.

## 🚀 Feature Tracker
Here is the finalized live status of all implemented application logic layers we mapped throughout our workflow:

### ✅ Core Architecture
- [x] PWA offline manifest & configurations.
- [x] Supabase PostgreSQL Database (Foreign-key enforced constraints).
- [x] Google OAuth Seamless Login Flow.
- [x] Glassmorphic Dark/Mint Aesthetic Interface Design.
- [x] Responsive persistent Mobile Tab Navigation (`Layout.jsx`).

### ✅ Expense Creation & Splitting
- [x] Dynamic Add Expense UI.
- [x] Interactive customized Circular Numeric Keypad functionality.
- [x] Mathematics-enforced Splitting Rules (`Equally`, `Percent`, `Exact Rupee`).
- [x] Mathematical blocks instantly lock interfaces if fractions lose parity.
- [x] Complete universal "Edit" memory retrieval & Cascading "Delete" workflows!

### ✅ Friend & Group Connections
- [x] Deep Database User Search via Postgres text-scans.
- [x] Active backend storage of bidirectional Friendships (`friendships`).
- [x] Ability to spin up multi-tenant discrete `Groups` (`groups`, `group_members`).
- [x] Loading state sub-arrays directly injecting user profiles cleanly!

### ✅ Settlement & Native Finance Tracking
- [x] Live "Who Owes Who" Dashboard Net calculation algorithms mapping your overall position mathematically against reality!
- [x] Global **Settle Up** Multi-Select Interface to orchestrate exactly traversing zero-out debts across multiple targeted friends effortlessly!
- [x] Shared Individual Ledgers detailing historical chronological micro-transactions between explicitly two parties!
- [x] **Native UPI Injection:** Direct native hardware Deep-Linking (`upi://pay...`) natively catapulting directly into mobile banking OS interfaces (PhonePe, GPay, Paytm) for fully frictionless settlement handling globally!
- [x] Secure Profile **Settings** configuration panel.

### ✅ Real-Time Ecosystem Operations
- [x] Instant Live PostgreSQL Event Socket listeners.
- [x] Screens repaint and shift numbers seamlessly synchronous without any necessity for browser reloads if another user triggers a change anywhere globally!
- [x] **In-App Toast Notifications:** Beautiful slide-down alerts natively trigger globally via a root-mounted Interceptor mapped flawlessly over your entire DOM structure.

### ✅ Version 2.2+ Architecture Enhancements
- [x] **Global Activity Ledger:** A structurally permanent chronologically mapped `/activity` log tracking table actively utilizing array-containment functions (`involved_users`) mathematically enforcing immutable auditing of every Added, Updated, Deleted, or Settled interaction instantly!
- [x] **Collaborative Editor Overrides:** Fundamentally decoupled `creator_id` rigid constraint scopes, thereby securely permitting *any mathematically involved user* full explicit localized collaborative rights to instantly physically modify or intelligently cascade-delete associated datasets natively!
- [x] **Group Administration Workflow:** Re-engineered dynamic `GroupDetails` interfaces natively mapping isolated multi-tenant expenditures globally, successfully unlocking capabilities for systematically pulling and safely evicting profiles out of internal `group_members` tables intelligently.
- [x] **Financial Isolation Debt Barriers:** Extremely complex algorithmic validation constraints successfully deployed actively blocking any local peer from successfully deliberately defecting or being abruptly forcefully kicked from a unified layout if they harbor underlying unsettled financial calculations intrinsically bridged within that precise group context natively!
