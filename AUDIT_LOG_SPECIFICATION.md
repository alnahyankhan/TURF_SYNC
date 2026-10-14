# Multi-Agent Audit Log & Version History Specification

**Document Version:** 1.0.0  
**Target:** Turf Management Platform  
**Purpose:** Ensure total accountability, fraud prevention, and historical record tracking when multiple agents/staff interact with turf bookings, slot schedules, prices, and bank details.

---

## 1. The Multi-Agent Operational Challenge

In real-world turf operations:
1. **Shift Handover:** Morning counter boy (Shift A: 06:00 - 14:00) hands over to Evening counter boy (Shift B: 14:00 - 22:00) and Night manager (Shift C: 22:00 - 06:00).
2. **Owners & External Agents:** Turf owners, remote managers, and central platform agents also have access.
3. **Common Discrepancies:**
   - An agent manually gives an unauthorized cash discount or changes prime slot price from ৳3,000 to ৳2,000.
   - An agent marks a slot as "Maintenance" to reserve it for their friends without paying.
   - An agent collects cash for the remaining due at the counter but doesn't record it, claiming the customer never paid.
   - Turf bank account numbers are changed without the primary owner's knowledge.

---

## 2. Immutable Audit Logging Architecture

To guarantee that logs **cannot be altered or deleted**, the system enforces an **Append-Only Write Pattern** with database triggers or application middleware.

```
       +-------------------------------------------------------------+
       |                  Incoming HTTP / API Request                |
       +-------------------------------------------------------------+
                                      |
                                      v
       +-------------------------------------------------------------+
       |               Authentication & Context Interceptor          |
       |  - Extract Actor ID, Session ID, Role, Client IP, User-Agent|
       +-------------------------------------------------------------+
                                      |
                                      v
       +-------------------------------------------------------------+
       |               Business Logic Execution Unit                 |
       |  (e.g., Update Slot Price / Collect Cash / Reschedule)      |
       +-------------------------------------------------------------+
                                      |
                       +--------------+---------------+
                       |                              |
                       v                              v
        +----------------------------+  +----------------------------+
        |   Target Table Mutation    |  |  Audit Log Event Dispatch  |
        |  (e.g., UPDATE daily_slots)|  |  (INSERT INTO audit_logs)  |
        +----------------------------+  +----------------------------+
```

---

## 3. Audit Log Database Structure

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turf_id UUID REFERENCES turfs(id) ON DELETE SET NULL,
    actor_id UUID NOT NULL REFERENCES users(id),
    actor_name VARCHAR(150) NOT NULL,
    actor_role VARCHAR(50) NOT NULL, -- e.g., 'TURF_OWNER', 'TURF_MANAGER', 'COUNTER_STAFF', 'PLATFORM_ADMIN'
    
    action VARCHAR(80) NOT NULL,     -- e.g., 'SLOT_PRICE_UPDATED', 'SLOT_BLOCKED', 'DUE_CASH_COLLECTED'
    category VARCHAR(50) NOT NULL,   -- 'BOOKING', 'PRICING', 'SLOT', 'PAYMENT', 'BANK_ACCOUNT', 'SYSTEM'
    
    target_table VARCHAR(80) NOT NULL, -- 'daily_slots', 'bookings', 'turf_bank_accounts'
    target_id VARCHAR(100) NOT NULL,    -- Primary Key of the affected record
    
    -- Delta payload: captures exact state before and after change
    before_state JSONB NULL,
    after_state JSONB NOT NULL,
    diff JSONB NOT NULL,                -- Computed delta for fast UI diff rendering
    
    reason TEXT NULL,                   -- Optional user-entered justification
    ip_address VARCHAR(45) NOT NULL,    -- Supports IPv4 and IPv6
    user_agent TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for lightning fast multi-agent filtering
CREATE INDEX idx_audit_logs_turf_created ON audit_logs(turf_id, created_at DESC);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id, created_at DESC);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_table, target_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
```

---

## 4. Key Actions & Event Taxonomy

| Event Code | Category | When Triggered | Logged Payload Example |
| :--- | :--- | :--- | :--- |
| `SLOT_PRICE_UPDATED` | `PRICING` | Staff modifies slot price for a particular day/hour | `{"field": "base_price", "old": 2500, "new": 3200}` |
| `SLOT_STATUS_OVERRIDE` | `SLOT` | Staff blocks slot for repair or offline reservation | `{"field": "status", "old": "AVAILABLE", "new": "MAINTENANCE"}` |
| `COUNTER_CASH_COLLECTED` | `PAYMENT` | Staff collects due balance cash at physical desk | `{"due_collected": 2000, "invoice_id": "INV-109", "customer": "017XXXXXXXX"}` |
| `BOOKING_CANCELLED` | `BOOKING` | Booking cancelled by manager or platform agent | `{"cancellation_reason": "Rain/Waterlogging", "refund_status": "CREDIT"}` |
| `BANK_DETAILS_MODIFIED` | `BANK_ACCOUNT` | Changes made to bKash merchant number or Bank A/C | `{"account_type": "bKash", "old_no": "017...", "new_no": "018..."}` |
| `PLATFORM_FEE_MODIFIED` | `PLATFORM` | Super admin modifies the platform convenience fee rate | `{"base_fee": 200.00, "extra_slot_fee": 50.00, "rule": "200 + (N-1)*50"}` |
| `FORCED_DISCOUNT_APPLIED` | `DISCOUNT` | Turf manager applies a counter or promo discount | `{"booking_id": "TRF-202610-842", "discount": 300.00, "reason": "Rain delay compensation"}` |
| `GROUND_REGISTERED` | `FACILITY` | Turf admin registers a new ground with capacity & duration rates | `{"ground": "Ground C", "capacity": "10p", "rates": "1h: ৳2200"}` |
| `SLOT_TIMING_PRICE_UPDATED` | `PRICING` | Turf manager updates specific slot start/end timing & price | `{"slot": "08:00 PM", "new_time": "08:30 PM", "new_price": 2500}` |
| `CAPACITY_PRICING_UPDATED` | `CAPACITY` | Turf admin updates court capacity or duration pricing | `{"ground": "Ground A", "old_cap": "10p", "new_cap": "12p", "p1h": 2200}` |
| `TURF_PHOTOS_UPLOADED` | `FACILITY` | Staff uploads photos within 8-photo PNG/JPEG quota | `{"photos_added": 2, "total": "5/8", "format": "PNG/JPEG"}` |
| `TURF_VIDEO_UPLOADED` | `FACILITY` | Staff uploads video clip within 2-video 30s quota | `{"duration": "22s", "limit": "30s", "format": "MP4"}` |
| `SETTLEMENT_PROCESSED` | `FINANCE` | Platform finances reconciles & disburses payout to turf owner | `{"turf_id": "trf_001", "period": "2026-10-01_15", "amount_paid": 45000}` |
| `SOCIAL_REFERRAL_MOBILE_OTP_VERIFIED` | `AUTH` | Social visitor verifies real mobile number via 4-digit SMS OTP | `{"verification_method": "SMS_OTP_4_DIGIT", "phone": "01712345678", "channel": "Social Referral"}` |
| `TURF_DELETED_WITH_TRASH_LOG` | `DELETION` | Super Admin permanently deletes turf facility with mandatory reason | `{"target": "Old DOHS Mini Turf", "reason": "Lease expiry", "logged_in_trash_log": "YES"}` |
| `CUSTOMER_DELETED_WITH_TRASH_LOG` | `DELETION` | Super Admin permanently deletes customer account with mandatory reason | `{"target": "Shakil Hossain", "reason": "Duplicate phone merged", "logged_in_trash_log": "YES"}` |
| `PROMO_CODE_CREATED` | `PROMOTIONS` | Platform admin creates % discount promo code with maximum cap | `{"code": "PLAY50", "percent": "50%", "max_cap": "৳100", "type": "PLATFORM_FEE"}` |
| `COUNTER_DUE_COLLECTED_AND_REVENUE_RECOGNIZED` | `REVENUE` | Front desk collects player balance due, clears kickoff & recognizes ledger revenue | `{"booking_ref": "TRF-202610-101", "cash_collected": "৳1680", "status": "PAID IN FULL"}` |
| `SLOT_MAINTENANCE_TOGGLED` | `MAINTENANCE` | Manager modifies slot status to MAINTENANCE or CLOSED | `{"slot": "Slot 3 : 9:00 Am - 10:30 AM", "status": "AVAILABLE -> MAINTENANCE", "reason": "Floodlight repair"}` |
| `SLOT_MAINTENANCE_DISABLED` | `MAINTENANCE` | Fast disable of single slot from schedule desk | `{"slot": "Slot 5", "status": "MAINTENANCE", "reason": "Pitch leveling & inspection"}` |
| `SLOT_REOPENED` | `MAINTENANCE` | Fast restoration of disabled slot back to public booking | `{"slot": "Slot 5", "status": "AVAILABLE"}` |
| `GROUND_EMERGENCY_CLOSURE_APPLIED` | `MAINTENANCE` | Ground closed for day due to weather or maintenance | `{"ground": "Ground A", "affected_slots": "14 slots set to MAINTENANCE", "reason": "Severe rain waterlogging"}` |
| `FACILITY_EMERGENCY_CLOSURE_APPLIED` | `MAINTENANCE` | Complete facility shutdown across all grounds | `{"facility": "Apex Arena", "affected_slots": "64 slots set to MAINTENANCE", "reason": "Public holiday / strike"}` |
| `GROUND_REOPENED` | `MAINTENANCE` | Ground re-opened after maintenance completion | `{"ground": "Ground A", "restored_slots": "14 slots restored to AVAILABLE"}` |
| `FACILITY_REOPENED` | `MAINTENANCE` | Entire facility re-opened after incident resolution | `{"facility": "Apex Arena", "restored_slots": "64 slots restored to AVAILABLE"}` |

---

## 5. UI Representation: The "Activity & Change Log" Screen

The Turf Owner and Platform Admin dashboards provide a dedicated **Audit & Activity Log** interface:

1. **Filter Bar**:
   - Filter by Date Range (Today, Yesterday, Last 7 Days, Custom Date)
   - Filter by Shift / Staff Member (`All Agents`, `Robiul (Morning Shift)`, `Tanvir (Night Shift)`)
   - Filter by Action (`All Actions`, `Price Changes`, `Cash Collections`, `Cancellations`)
2. **Timeline View**:
   - Each card shows:
     - Avatar + Agent Name & Role badge (`Counter Staff - Shift A`)
     - Human-readable summary: *"Changed price of Court 1 (8:00 PM - 9:00 PM) from ৳2,500 to ৳3,000"*
     - Timestamp (`14 Oct, 2026 at 03:15 PM`)
     - IP Address & Device signature
     - Expandable **"View Changes"** button displaying a visual Green/Red Git-style diff.
3. **Exporting Capabilities**:
   - Export shift audit logs as CSV or PDF report for daily accounting reconciliation.
