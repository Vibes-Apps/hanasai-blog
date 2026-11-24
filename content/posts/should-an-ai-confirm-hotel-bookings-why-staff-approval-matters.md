---
title: Should an AI Confirm Hotel Bookings? Why Staff Approval Matters
description: Should an AI receptionist confirm bookings on the call, or send a request for staff to approve? The trade-offs, the UK rules and which model fits which hotel.
cover: /blog/images/should-ai-confirm-hotel-bookings-staff-approval-cover.jpg
coverAlt: Glass app tiles on a dark violet and teal background showing a phone, a check mark and a shield.
date: 2026-11-17
updated: 2026-11-24
author: Hanas.ai
tags:
  - ai-receptionist
  - hotels-and-bbs
  - legal-and-compliance
draft: false
---

## Should an AI receptionist confirm bookings?

It depends on how much your hotel can trust the data the AI sees and how much a wrong booking would cost you. If your availability and rates are held in a system the AI can read and write reliably, confirming on the call is faster for the guest and loses fewer bookings. If they are not, or your rooms vary in ways a system does not capture, having a person approve each request is the safer design. It is slower, and that delay has a real cost. Which suits you is a business decision, not a technical one.

> **Disclosure.** We make Hanas, an AI phone receptionist for small hotels. Hanas lets the owner choose between staff approval and automatic confirmation, so we have an interest in this question. We say below where each choice is the weaker one. This is general information, not legal advice. We are a software company, not a law firm.**Key Takeaways**Confirm-on-call has real advantages: no wait for the guest, and fewer callers who book elsewhere while waiting for a reply. Staff approval gives up some of that speed.Staff approval protects against the AI quoting a room or rate that is wrong, and lets a person handle odd requests. It does not remove the need for staff to respond promptly.The legal rules we read apply to both models. Staff approval is not a legal requirement we found, but it makes it easier to argue that a person decides each booking. That is our interpretation, not a ruling.Taking card details by voice raises separate payment-security questions.

## The two models

**Model A: the AI confirms.** The AI checks availability, quotes a rate, and creates the reservation, usually by writing into the property management system (PMS). Some products also take payment or a card hold on the call.

**Model B: the AI takes a request.** The AI collects dates, room type, guest details and any special requests, reads them back, and sends a request. A member of staff checks it and then approves, declines or calls back. Nothing is confirmed to the guest until the person says yes. Hanas supports this model: the owner can set it so that staff approve each booking.

![Two booking flows side by side: in one the AI checks availability and confirms the booking on the call; in the other the AI takes a request, staff review it and then confirm or decline](/blog/images/should-ai-confirm-hotel-bookings-staff-approval-booking-flows.png)

_Two models: confirm on the call, or request then staff approval_

Within Model A, vendors differ on what they write to the PMS and whether they take money. As of 17 November 2026, D3x's [AI receptionist page](https://www.d3x.ai/solutions/ai-hotel-receptionist) says its phone AI can check a guest's booking in your PMS and "confirms changes", and does not say whether that includes creating a reservation. It says conversations that need a person are handed off, and sensitive cases such as complaints, safety issues and VIP guests go to an on-call team under rules you define. As of the same date, [Dextr's homepage](https://dextr.ai) says that "bookings, messages, and payments flow automatically" once it is connected to your property system, and that its voice AI "hands off edge cases to your team". These are the vendors' own statements; we have not tested either product. Our [comparison of seven AI receptionists](https://gethanas.com/blog/7-best-ai-receptionists-for-uk-small-hotels-and-b-bs-2026) has more.

## What confirm-on-call does well

**Speed for the guest.** A caller who is told "you are booked" can stop looking. A caller who is told "we will come back to you" may ring the next hotel on the list. We have no measured figure for how many requests are lost this way, and we will not invent one.

**Less manual entry.** If the AI writes to the PMS, staff do not retype bookings. Hanas does not connect to a PMS yet, so staff enter bookings themselves. Mews, Cloudbeds, Little Hotelier, Guestline and eviivo are on its roadmap, with no dates stated as of 17 November 2026.

## What staff approval does well

**It catches data the AI cannot see.** An AI quotes from the rates and availability it has been given. If the hotel's real position has changed (a room out of order, a group hold not yet entered, a rate promised to a regular), a quote can be wrong. With approval, a person looks before anything is promised.

**Overbooking risk.** If the AI confirms against availability that is out of date or not connected to the live system, two guests can be promised one room. Confirm-on-call is safe when availability comes from a live, reliable source. We found no published data on how often AI-confirmed bookings go wrong, so we cannot say how common this is. With Model B a person can check first.

**Edge cases.** Dogs, late arrivals, accessibility needs, adjoining rooms, a request for a discount. A person can say yes, no or "let me ring you back". An AI can be told to hand these off, but you must set the rules in advance.

## What staff approval costs

Be honest about this part, because it is the case against our own default.

- **Delay.** The guest waits. How long depends on how quickly your team responds, and during busy periods that may be hours.
- **Staff time.** Someone has to read every request and act on it. For a hotel with no front-desk cover for part of the day, that is a real constraint.
- **Lost bookings.** A slow reply can lose the booking, as above.

If your hotel cannot approve requests quickly, you can set Hanas to confirm automatically instead. If you need bookings written into a PMS today, Hanas is the weaker choice.

## The two models side by side

|  | AI confirms on the call | AI takes a request, staff approve |
| --- | --- | --- |
| Guest gets an answer | On the call | After a person reviews it |
| Speed and lost bookings | Fastest; fewest callers lost while waiting | Slower; depends on how fast staff reply |
| Overbooking risk | Depends on how live and accurate the availability is | A person checks before confirming |
| Wrong rate or availability | Can be committed before anyone notices | Can be caught at review |
| Unusual requests | Needs rules for handing off | Person decides each one |
| Staff workload | Lower if written to the PMS | Every request needs a decision |
| Out-of-hours | Works with no one on shift | Waits for staff |
| Payment | Possible, with security obligations | Not part of the model itself |
| Integration needed | Usually yes (PMS, sometimes payment) | Not required; staff enter bookings |

## Payment on the call

Taking money by voice brings obligations that a request-and-approve model can avoid. The PCI Security Standards Council's [FAQ on audio recordings](https://www.pcisecuritystandards.org/faqs/1210/), read on 17 November 2026, says that storing card validation codes in audio recordings after authorisation violates PCI DSS Requirement 3.3.1, in any form of digital audio recording. It says that if such data is collected on a call, every effort must be made to prevent it being recorded, and if that is not possible it should be deleted right after authorisation, with compensating controls where deletion is not feasible.

A recording voice AI needs a deliberate design for payment. Whatever a vendor offers, including Hanas, ask how it handles card details on recorded calls. For Hanas, check the [Hanas website](https://gethanas.com/) for its current position on payment; the points above are the ones to ask about.

## Consumer contract rules

We read the Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013 on legislation.gov.uk on 17 November 2026. As we read them, a booking made by phone is likely to be a distance contract between a business and a consumer. Three points follow, and they are our interpretation, not advice:

- [Regulation 13](https://www.legislation.gov.uk/uksi/2013/3134/regulation/13) says the trader must give the consumer required information in a clear and comprehensible manner before the consumer is bound. Both models must be set up to do that.
- [Regulation 16](https://www.legislation.gov.uk/uksi/2013/3134/regulation/16) says the trader must give confirmation of a distance contract on a durable medium, such as an email, within a reasonable time and before any service begins. The confirmation email can be sent by the system in Model A or by staff in Model B.
- [Regulation 28](https://www.legislation.gov.uk/uksi/2013/3134/regulation/28) excludes from the cancellation rights the supply of accommodation where the contract provides for a specific date or period. That exception covers the statutory cancellation right only; your own cancellation terms still need to be clear.

These rules do not pick a model for you, but "who confirms" and "what the guest is told, and when" need designing in either case.

## Data protection and automated decisions

Our [guide to UK legal issues for hotel AI receptionists](https://gethanas.com/blog/is-it-legal-to-use-an-ai-receptionist-at-a-uk-hotel) covers this in detail, so here is the short version.

Section 80 of the Data (Use and Access) Act 2025 replaced UK GDPR Article 22 with Articles 22A to 22D. As we read [section 80](https://www.legislation.gov.uk/ukpga/2025/18/section/80) on 17 November 2026, a decision is "based solely on automated processing" where there is no meaningful human involvement, and a "significant decision" is one with a legal or similarly significant effect. For a fully automated significant decision, Article 22C requires safeguards: the person can get information about the decision, make representations, obtain human intervention and contest it.

Does a confirmed hotel booking count as a significant decision? We found no primary source on that, and we do not know. If an AI declines a guest or sets a price with no person involved, the question gets sharper. **Our interpretation, unverified:** a model in which a person genuinely decides each booking is easier to defend as not "solely automated", provided the approval is real and not a rubber stamp. We could not read the ICO's own page on automated decision-making today (the server returned an access error), and the sibling guide notes that the ICO's draft guidance on the new rules was not final when we last checked. Check the live ICO guidance before relying on any of this.

![Table of the primary sources read for this article: Consumer Contracts Regulations 2013 regulations 13, 16 and 28, Data (Use and Access) Act 2025 section 80, and PCI SSC FAQ 1210](/blog/images/should-ai-confirm-hotel-bookings-staff-approval-law-points-read.png)

_Primary sources read on 17 November 2026_

## Which model fits which hotel

Our reading, as a vendor with a stake in the answer:

**Confirm-on-call fits better when:**

- your PMS holds live availability and rates and the AI can read and write to it reliably;
- nobody is available to approve out of hours, and a morning reply would lose bookings;
- you want to cut re-keying and are prepared to set clear hand-off rules and review what the AI has booked.

**Staff approval fits better when:**

- your availability is not connected to the AI, or changes by hand (a common situation in a small hotel with a spreadsheet or a paper diary);
- you have a handful of rooms, each different, and the owner wants to see each booking;
- you want no card details taken by voice;
- someone can respond reasonably quickly, even if not instantly.

![Four icons for the main trade-offs: speed, accuracy, rules and payment security](/blog/images/should-ai-confirm-hotel-bookings-staff-approval-model-tradeoffs.png)

_Four trade-offs to weigh_

## Frequently asked questions

### Does a UK hotel have to use staff approval?

We found no UK rule that requires it. The rules we read concern information, confirmation, payment data and automated decisions, and they apply whichever model you choose. Staff approval is a design choice.

### Is confirm-on-call more likely to cause overbooking?

It can be, if the AI confirms against availability that is stale or not live. If availability comes from a reliable live system, the risk is lower. We have no published data on how often either model produces errors.

### Will staff approval lose me bookings?

It can, if replies are slow. We have no measured figure, so the best test is your own: how quickly can your team respond to a request, and how many callers would wait?

### Does Hanas confirm bookings or take payment?

That is the owner's setting. Hanas can send each booking to staff for approval, so nothing is confirmed to the guest until a person says yes, or it can confirm automatically. Payment is not part of what this article assumes. Hanas does not connect to a PMS yet, and it is in early access, so check its site for the current position.

## Sources

- legislation.gov.uk: [Consumer Contracts Regulations 2013, regulation 13](https://www.legislation.gov.uk/uksi/2013/3134/regulation/13), [regulation 16](https://www.legislation.gov.uk/uksi/2013/3134/regulation/16), [regulation 28](https://www.legislation.gov.uk/uksi/2013/3134/regulation/28); [Data (Use and Access) Act 2025, section 80](https://www.legislation.gov.uk/ukpga/2025/18/section/80).
- PCI Security Standards Council, [FAQ 1210](https://www.pcisecuritystandards.org/faqs/1210/).
- Vendor pages (their own statements, read 17 November 2026): [Hanas](https://gethanas.com/), [D3x AI hotel receptionist](https://www.d3x.ai/solutions/ai-hotel-receptionist), [Dextr](https://dextr.ai).

All pages were read on 17 November 2026, except the ICO's automated decision-making page, which returned an access error.

## Related reads

- [7 best AI receptionists for UK small hotels and B&Bs](https://gethanas.com/blog/7-best-ai-receptionists-for-uk-small-hotels-and-b-bs-2026)
- [Is it legal to use an AI receptionist at a UK hotel?](https://gethanas.com/blog/is-it-legal-to-use-an-ai-receptionist-at-a-uk-hotel)
- [How many calls does a small hotel miss?](https://gethanas.com/blog/how-many-calls-does-a-small-hotel-miss-what-it-costs)

## About this article

Written and checked by the Hanas team at Vibesapps, the company behind Hanas. Editorial standards: every legal or regulatory point links to a primary source, we label our own interpretations, vendor claims are attributed and dated, we say where Hanas is the weaker choice, and we disclose that we make Hanas. We correct errors promptly. To report an error, email [support@vibesapps.co](mailto:support@vibesapps.co). More about us: [About Hanas](https://gethanas.com/about).
