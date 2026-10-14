# TurfSync — Multi-Sport Turf Management & Booking Platform

**Version:** 3.0.0 Enterprise  
**Target:** Local Sports Turf Ecosystem (Football, Cricket, Badminton & Others)

---

## Key Business Logic & Enterprise Architecture (v3.0 Updates)

1. **Social Media Referral Registration & 4-Digit Mobile OTP Verification (Requirement 1)**:
   - Visitors arriving from social media marketing campaigns (e.g. `?ref=social`, Facebook, Instagram) or clicking the top referral banner are prompted to register with Name, Email, Mobile, and Location.
   - Submitting the mobile number triggers a simulated **4-digit SMS OTP verification** (`4829`) with an interactive countdown timer (60s) to authenticate real players and managers before granting booking privileges.
   - Supports registration and verification for both **Player/Customer** and **Turf Management** personas.

2. **Segregated User-Specific Login Portals (Requirement 2)**:
   - **2.1 Customer (Player)**: Mobile/email login with match schedules, bKash partial deposit checkout, invoice QR access, and expenditure analytics.
   - **2.2 Turf Management**: Manager shift desk login with multi-ground capacity pricing, front desk check-in, counter cash due collection, and photo/video gallery manager.
   - **2.3 Web Portal Management**: Super Admin headquarters login with system-wide facility directory, user management, promo code engine, trash audit log, and platform fee reconciliations.
   - Header displays active user badge with one-click persona switching and logout.

3. **Streamlined UI & Redundant Data Elimination (Requirement 3)**:
   - Clutter and duplicate guide bars, repeated cards, and duplicate explainer blocks removed for an ultra-fast, professional sports-tech UX.

4. **Web Portal User Administration & Audit Trash Log (Requirement 4)**:
   - Platform Super Admin has full authority to **Add and Delete Turf Facilities** and **Add and Delete Customer Accounts**.
   - Deleting any venue or customer mandates entering a **clear justification reason**.
   - All deletions are permanently recorded in an immutable **Deleted Records & Trash Log** capturing target ID, record name, category, reason, admin email, IP address, and exact timestamp.

5. **Platform Promotional Engine with Percentage Discount & Cap (Requirement 5)**:
   - Platform Admin can create and distribute promotional codes specifying:
     - **Discount Target**: Website Platform Fee waiver or Total Match Booking.
     - **Percentage Discount**: e.g., 50% or 25%.
     - **Maximum Cap Amount (৳)**: e.g., capped at ৳100 or ৳500 in BDT.
   - Formula: $\text{Discount} = \min\left(\text{Applicable Amount} \times \frac{\text{Percent}}{100},\; \text{Max Cap}\right)$.
   - Active promos: `PLAY50` (50% off platform fee, cap ৳100), `SUPER25` (25% off booking, cap ৳500), `FREEFEE` (100% platform waiver, cap ৳300).

6. **Mandatory Player & Turf Location Proximity Engine (Requirement 6)**:
   - Interactive Dhaka neighborhood selector (Dhanmondi, Gulshan, Banani, Uttara, Mirpur, Bashundhara, Mohammadpur, Motijheel).
   - Dynamically recalculates spherical Haversine driving distances (`km`) and estimated travel times (`mins`) to all venues across Dhaka, re-sorting grounds by closest distance.

7. **Multi-Ground / Sports Field Independent Slot Schedules (Requirement 7)**:
   - Each ground/court maintains its **own independent 16-slot schedule** (`groundSchedules[groundId]`).
   - Booking Slot 2 on Ground A (5v5) does **not** block Slot 2 on Ground B (7v7 Championship Pitch) or Court C (Badminton).
   - Fully supports multi-sport facilities with independent capacities, surfaces, and schedules.

8. **Redesigned Counter Desk Check-In & Revenue Recognition (Requirement 8)**:
   - Match arrival counter desk allows staff to look up arriving players via SMS message or Invoice Reference (`TRF-202610-101`, `TRF-202610-102`).
   - Displays real-time settlement dossier: gross price, online advance paid via bKash, and remaining cash due.
   - Front desk collects remaining counter dues, marks the booking as **COMPLETED / PAID IN FULL**, and stamps the booking.
   - Instantly recognizes revenue across Turf financial ledgers and Platform GMV accounting ledgers with complete multi-agent audit logging.

9. **Standardized 1.5-Hour Match Slots (Fixed 90 Mins)**:
   - All slots across all turfs are formatted as: `Slot 1 : 6 Am - 7:30 AM` up to `Slot 16 : 4:30 Am - 6:00 AM`.

10. **Tiered Platform Fee Formula**:
    - 1 Slot = ৳200 flat
    - 2 Slots = ৳250
    - 3 Slots = ৳300
    - $N$ Slots = $৳200 + (N - 1) \times ৳50$

11. **Dark & Light Mode Support**:
    - Dark mode by default with fully WCAG-compliant high-contrast Light mode.

12. **Emergency Maintenance, Slot Disabling & Calendar Date Closure Management (Requirement 10)**:
    - **Interactive Calendar & Specific Date Selection**: Pick any specific future date from the calendar or 14-day interactive date carousel (`Today`, `Tomorrow`, upcoming days). Slots and closures are stored independently per calendar date (`dailyGroundSchedules[groundId__dateIso]`).
    - **Slot-by-Slot Fast Control Rack**: Visual 16-card slot matrix with instant 1-click Open/Close toggle buttons, live status badges (`OPEN`, `MAINTENANCE`, `CLOSED`, `BOOKED`), and slot checkboxes.
    - **Bulk Slot Operations**: Batch actions to "Disable Selected" and "Open Selected" with real-time selection counter badges.
    - **Customer Match Date Picker**: Customers select their match date from an interactive calendar; slots disabled by management for that date automatically show as unavailable.
    - **Full Facility / Ground Closure**: Modal to close a single ground or shut down the entire facility for a specific calendar date with custom incident categories.
    - **Full Audit Logging**: All slot toggles, bulk actions, and emergency closures are immutably logged under category `MAINTENANCE` in the audit log.

13. **4×4 Segment Matrix Layout for Single-View Slot Booking**:
    - **Single-View Visibility**: All 16 standardized 1.5-hour match slots are displayed in a compact $4 \times 4$ segmented matrix ($4\text{ columns} \times 4\text{ rows} = 16\text{ slots}$) that fits on screen in a single view with zero vertical scrolling.
    - **4 Diurnal Segments**:
      - 🌅 **Row 1 • Morning Segment (6:00 AM – 12:00 PM)**: Slots 1, 2, 3, 4
      - ☀️ **Row 2 • Afternoon Segment (12:00 PM – 6:00 PM)**: Slots 5, 6, 7, 8
      - 🌇 **Row 3 • Evening Segment (6:00 PM – 12:00 AM)**: Slots 9, 10, 11, 12
      - 🌙 **Row 4 • Night / Dawn Segment (12:00 AM – 6:00 AM)**: Slots 13, 14, 15, 16
    - **Segment Switcher Navigation**: Quick filter pills (`All 16 Slots (4×4 Matrix)`, `Morning (1-4)`, `Afternoon (5-8)`, `Evening (9-12)`, `Night (13-16)`).
    - **Theme Adaptive**: Full Dark Mode and high-contrast Light Mode support.

14. **Lucrative 14-Day Date Carousel & Non-Scrolling Multi-Slot Selection**:
    - **Non-Scrolling Multi-Slot Selection**: Clicking slots in the 4×4 matrix updates amounts silently without automatically scrolling the viewport to the quote breakdown.
    - **Sticky Quick Selection Action Bar**: Floats cleanly at the bottom of the booking modal when slots are selected, displaying slot counts, total duration, advance amount, total price, and a smooth "Review Quote & Pay" trigger.
    - **Lucrative 14-Day Interactive Date Carousel**: Dual-portal (Customer and Turf Management) horizontal carousel with rich Day Cards featuring day numbers, weekday badges (with Friday/Saturday weekend highlights), chevron navigation, full calendar integration, and red maintenance notification dots in the Turf Management portal.
    - **Streamlined Fast Control Rack Toolbar**: Integrated Select All toggle with reactive count badges on "Disable Selected" and "Open Selected" buttons.

15. **Calendar-Driven Slot Availability & Dynamic Bookings**:
    - Interactive date picker and calendar button (`openTurfDatePicker()`) allows choosing any calendar date.
    - Slots dynamically reflect distinct availability and bookings (`BOOKED` vs `OPEN` vs `MAINTENANCE`) per selected calendar date across both the visual fast control rack and schedule table.

16. **Fast Control Rack Diurnal Segment Colors & Time-Only Layout**:
    - Visual segment differentiation across 4 diurnal periods:
      - 🌅 **Morning (Slots 1–4)**: Warm Amber theme with segment badge
      - ☀️ **Afternoon (Slots 5–8)**: Sky Blue theme with segment badge
      - 🌇 **Evening (Slots 9–12)**: Twilight Purple theme with segment badge
      - 🌙 **Night (Slots 13–16)**: Midnight Indigo theme with segment badge
    - Start & End times clearly formatted (`Start Time: 6:00 AM`, `End Time: 7:30 AM`).
    - Slot prices are completely omitted from the fast control rack cards for clear focus on court operations.

17. **User-Friendly Turf Payouts & Settlement Hub**:
    - KPI metric cards tracking Gross Online Escrow, Retained Platform Fees, Pending Disbursement, and Settled Funds.
    - Real-time search and status filters (`ALL`, `PENDING`, `PROCESSING`, `DISBURSED`).
    - One-click Payout Release Modal supporting bKash Merchant B2B Disburse API and Bank BEFTN/NPSB with transaction reference ID.
    - Printable itemized Settlement Voucher / Receipt Modal, Batch Payout execution, and CSV export.

18. **User-Friendly Audit Trails & Customizable Slot Pricing**:
    - **Enhanced Audit Trails**: Real-time multi-field search, category & role filters, Before $\rightarrow$ After comparison chips, JSON payload modal, and JSON export.
    - **Customizable Slot Pricing Engine**: Platform Admin can configure ground-specific rates, apply 1-click market capturing presets (Aggressive Capture -25%, Off-Peak Drive, Prime Evening Surge, Baseline Reset), adjust diurnal tier prices, or fine-tune individual slot prices with live quotes update and audit logging.

---

## File Structure

- **`index.html`**: Single-page web app with 3 segregated portals, match arrival desk, user management directory, trash log, promo engine, and 8 enterprise modal dialogs.
- **`app.js`**: Core state, multi-ground schedule repository (`groundSchedules`), mobile OTP simulation, location engine, promo calculator with caps, user administration, counter settlement desk, and audit logs.
- **`styles.css`**: Tailwind CSS theme styling, OTP boxes, counter desk stamps ("PAID IN FULL — CHECKED IN"), and full Dark/Light mode overrides.
- **`REQUIREMENTS_ANALYSIS.md`**: Software Requirement Specification (SRS) detailing the 8 enterprise modules and business rules.
- **`AUDIT_LOG_SPECIFICATION.md`**: Immutable audit logging specifications for user deletions, OTP verifications, and counter revenue recognition.

---

## How to Run

Simply open **`index.html`** in any modern web browser! Use the top navigation bar to switch between:
1. 🏃 **Player / Customer Portal**
2. 🏟️ **Turf Management Desk**
3. 👑 **Platform Super Admin Headquarters**

