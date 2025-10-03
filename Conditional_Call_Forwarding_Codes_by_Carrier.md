# Conditional Call Forwarding Codes by Carrier

Conditional call forwarding lets a subscriber forward incoming calls under certain conditions (unanswered, busy, unreachable) to another number. In US mobile networks, each carrier uses specific “star” codes to activate these features. Below we detail the forwarding types supported by each major carrier and the dial strings to set them up. (The placeholder `[number]` below represents the 10-digit forwarding destination.)

---

## Verizon Wireless

- **Unconditional Forwarding (All Calls):**  
  Dial `*72` + [number] to activate.  
  Dial `*73` to deactivate.
- **Busy/No-Answer (Conditional):**  
  Dial `*71` + [number] to activate.  
  Dial `*73` to deactivate.
- **Unreachable:** Not supported separately (calls go to voicemail).
- **Notes:**
  - Verizon’s codes do not use trailing `#`.
  - Forwarded calls still incur airtime charges.
  - Forwarding to international numbers is not allowed.

---

## AT&T Mobility

- **Unconditional Forwarding (All Calls):**  
  `*21*[number]#` → activate  
  `##21#` → deactivate
- **Busy:**  
  `*67*[number]#` → activate  
  `##67#` → deactivate
- **No Answer:**  
  `*61*[number]#` → activate  
  `##61#` → deactivate
- **Unreachable:**  
  `*62*[number]#` → activate  
  `##62#` → deactivate
- **Notes:**
  - AT&T uses GSM-standard single-star codes.
  - All codes end with `#`.

---

## T-Mobile USA

- **Unconditional Forwarding (All Calls):**  
  `**21*1[number]#` → activate  
  `##21#` → deactivate
- **No Answer:**  
  `**61*1[number]#` → activate  
  `##61#` → deactivate
- **Unreachable:**  
  `**62*1[number]#` → activate  
  `##62#` → deactivate
- **Busy:**  
  `**67*1[number]#` → activate  
  `##67#` → deactivate
- **Notes:**
  - Requires dialing full 11-digit number (with leading `1`).
  - Double asterisk format (`**`).
  - `##004#` resets all forwarding settings to default.

---

## US Cellular

- **Unconditional Forwarding (All Calls):**  
  `*72[number]` → activate  
  `*73` → deactivate
- **Busy:**  
  `*90[number]` → activate  
  `*91` → deactivate
- **No Answer:**  
  `*71[number]` → activate  
  `*73` → deactivate
- **Unreachable:**  
  `*92[number]` → activate  
  `*93` → deactivate
- **Notes:**
  - Uses simple star codes, no `#`.
  - Forwarded calls count against plan minutes.

---

## Comparison Table

| Carrier         | Unconditional (All Calls)             | Busy                                  | No Answer                             | Unreachable                           |
| --------------- | ------------------------------------- | ------------------------------------- | ------------------------------------- | ------------------------------------- |
| **Verizon**     | `*72[number]` (on), `*73` (off)       | `*71[number]` (on), `*73` (off)       | `*71[number]` (on), `*73` (off)       | Not supported (defaults to voicemail) |
| **AT&T**        | `*21*[number]#` (on), `##21#` (off)   | `*67*[number]#` (on), `##67#` (off)   | `*61*[number]#` (on), `##61#` (off)   | `*62*[number]#` (on), `##62#` (off)   |
| **T-Mobile**    | `**21*1[number]#` (on), `##21#` (off) | `**67*1[number]#` (on), `##67#` (off) | `**61*1[number]#` (on), `##61#` (off) | `**62*1[number]#` (on), `##62#` (off) |
| **US Cellular** | `*72[number]` (on), `*73` (off)       | `*90[number]` (on), `*91` (off)       | `*71[number]` (on), `*73` (off)       | `*92[number]` (on), `*93` (off)       |

---

## Notes on Carriers in the US

- There are **3 nationwide networks**: **AT&T, T-Mobile, and Verizon**.
- **US Cellular** is the only significant regional carrier with its own network.
- Most other “carriers” (Mint, Cricket, Metro, Visible, etc.) are **MVNOs** that resell service on one of the big three.

👉 For apps, you usually only need to handle **AT&T, T-Mobile, Verizon, and US Cellular**.  
👉 MVNO subscribers can be mapped to their host network for call forwarding codes.

---
