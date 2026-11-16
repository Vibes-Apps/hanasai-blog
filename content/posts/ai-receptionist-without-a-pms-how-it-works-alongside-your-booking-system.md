---
title: 'AI Receptionist Without a PMS: How It Works Alongside Your Booking System'
description: Does an AI receptionist need to connect to your PMS? How it works without integration, where it falls short, and what to ask vendors before you sign.
cover: /blog/images/ai-receptionist-without-pms-small-hotel-cover.jpg
coverAlt: Illustration of a smiling woman in a navy blazer beside glass app tiles showing a phone, a calendar and a check mark on a dark violet and teal background.
date: 2026-11-17
author: Hanas.ai
tags:
  - ai-receptionist
  - hotels-and-bbs
  - integrations-and-pms
draft: false
---

Yes, a small hotel can use an AI receptionist that does not connect to its property management system (PMS). The AI answers the phone from a profile of your rooms, hours and policies, and passes booking requests to your staff, who check availability in the PMS and enter the booking themselves. It works, but it means double entry, and the AI cannot see live availability or rates. For many small properties that is an acceptable trade. For some it is not, and this article says which.

> **Disclosure.** We make Hanas, an AI receptionist for small hotels, B&Bs and inns. Hanas does not connect to a PMS today, so this topic touches our own weak point. Claims about other vendors come from their own public pages, read on 17 November 2026 and attributed below. Where a page did not say, we write "not stated". We did not test any other vendor's product.**Key Takeaways**Without integration, an AI receptionist can answer questions and take booking requests. A person still checks availability and creates the booking in your PMS.The real costs are double entry, answers that may be out of date, and no live rates. A written daily routine reduces all three but does not remove them.Integration can add live availability lookups and bookings written into the PMS. "Integrates" covers very different things, so ask whether it reads, writes, or creates bookings.Hanas has no PMS integration today. If you need bookings written into your PMS now, it is the weaker choice.

## What a PMS and a channel manager do

A PMS is the system a hotel runs on: reservations, room status, guest records, rates and the front desk. A channel manager is a separate function that pushes your availability and rates out to booking sites and pulls bookings back. Cloudbeds' own channel manager page, read on 17 November 2026, describes a channel manager as software that keeps availability and rates current across sales channels, and says most PMS products include one.

Some small properties use one product that does both. Others use a PMS with a separate channel manager, or a booking engine and a spreadsheet. This matters because the "system of record" for availability is not always in one place. When a vendor says "we connect to your PMS", the first question is whether your availability actually lives there.

An AI receptionist is a different thing again: it handles the phone call. How it is connected to the system of record decides how much of the work it can do.

![Three boxes labelled PMS, channel manager and AI receptionist, showing the PMS holding reservations and availability, the channel manager syncing with booking sites, and the AI receptionist handling phone calls](/blog/images/ai-receptionist-without-pms-small-hotel-pms-roles-diagram.png)

_What each system does in a small hotel_

## What an AI receptionist can do without integration

Without a PMS connection, the AI works from information you give it. The useful jobs fall into three groups.

**Answering questions from a profile.** Opening times, check-in and check-out, parking, pets, breakfast, directions, room types, cancellation policy and which languages you cover. These answers change rarely, so a reviewed profile serves them well. Hanas builds a draft profile from your website and your team reviews it before anything goes live.

**Taking booking requests.** The AI collects dates, party size, room preference, a name and a contact number, and sends a request to staff. In Hanas, staff approve or decline by email or in a web dashboard, and by default nothing is confirmed to the guest until they do. By default it does not take payment either, which is a current setting, not a permanent limit.

**Taking messages and covering the hours you cannot answer.** Evenings, early mornings and busy check-in times are when small teams miss calls. Our post on [how many calls a small hotel misses](https://gethanas.com/blog/how-many-calls-does-a-small-hotel-miss-what-it-costs) covers how to measure your own.

What it should not do without live data is promise availability or quote a rate you have not entered. A careful setup has the AI say that staff will confirm, and that is how Hanas behaves: it quotes only the rates the hotel enters and sends the rest to a person.

## The real limits

These are the limits we would want to know about before buying.

**Double entry.** Every accepted request is entered twice: once as an approval, once in the PMS. For a handful of requests a day this is minutes of work. For a busy property it adds up, and it is the most common reason integration matters.

**Stale availability.** The AI does not know that the last double room went on a booking site ten minutes ago. If it implied availability, a guest could be disappointed. If it stays neutral ("we will check and confirm"), the guest waits for an answer.

**No live rates.** Rates in a profile are the rates you typed. If your pricing moves with demand, the profile will be wrong unless someone updates it.

**Mishearing.** Names and numbers can be misheard, as the Hanas site says. Staff should check the phone number and dates before confirming.

## A daily routine for a hotel with no integration

The workflow below is a sensible starting point. It is our suggestion, not a tested result.

![Flow from guest phone call to AI receptionist to booking request to staff approval to entering the booking in the PMS and replying to the guest](/blog/images/ai-receptionist-without-pms-small-hotel-no-pms-workflow-diagram.png)

_Request-and-approve workflow without PMS integration_

1. **The guest calls.** The AI answers, says it is an AI, and collects the request.
2. **A request reaches staff.** By email or dashboard, with dates, party size and contact details.
3. **A named person checks the PMS.** One person owns this each day. If nobody owns it, requests wait.
4. **Staff approve or decline.** Confirmation goes to the guest only after this.
5. **Staff enter the booking in the PMS.** And update the channel manager if your PMS does not do so automatically.
6. **Staff reply to the guest.** A short email or call back with the confirmation.

### Who approves, and how fast

Decide this before going live. Write down who approves during the day, who covers evenings and days off, and a target response time you can actually meet (for example, "within two working hours" or "by 9am next morning for overnight requests"). We do not claim a typical speed; it depends on your team. A guest who is told "we will confirm shortly" and then waits a day is worse off than one who heard "we will confirm by 9am".

### Three checks that keep the profile honest

- **Morning check.** Open the overnight requests first. Anything for tonight or tomorrow is urgent because availability moves fastest there.
- **Weekly profile review.** Update rates, closures and seasonal hours in the AI's profile.
- **Monthly call review.** Read a sample of transcripts for wrong answers. Hanas deletes transcripts after 30 days by default, so review within that window.

For the legal side of recording and AI disclosure, see [Is it legal to use an AI receptionist at a UK hotel?](https://gethanas.com/blog/is-it-legal-to-use-an-ai-receptionist-at-a-uk-hotel)

## What integration adds

Integration is not one feature. Four levels are worth separating:

1. **Read availability and rates.** The AI can say whether a room is free and at what price.
2. **Look up an existing booking.** Useful for "can I change my dates?" calls.
3. **Change an existing booking.** Riskier, so the question of who approves matters.
4. **Create a new booking.** Removes double entry, and removes the staff check unless the vendor adds one.

Vendors use the word "integration" for all four. Their own pages show how much is left unsaid. On 17 November 2026:

- **D3x** says on its [AI hotel receptionist page](https://www.d3x.ai/solutions/ai-hotel-receptionist) that answers are checked against live PMS data, names Mews, Oracle Opera, Cloudbeds and Apaleo, and says the AI looks up a guest's booking and confirms changes. Whether it creates new bookings was not stated.
- **Dextr AI** shows PMS logos including Cloudbeds, Mews and Stayntouch on its [homepage](https://dextr.ai), and says its setup connects your PMS "so bookings, messages, and payments flow automatically". Whether it reads, writes or creates bookings was not stated.
- **Canary** says on its [AI voice page](https://www.canarytechnologies.com/products/ai-voice-hotels) that it syncs with your PMS and that a booking can be converted and appear in the PMS. It names no PMS and does not state read or write access.

None of this is a criticism. It shows that a logo wall is not an answer. Ask for the specific actions the AI can perform on your PMS.

Integration also brings costs of its own: setup time with your PMS provider, possible fees for API access, and a dependency. If your PMS vendor changes its interface, the connection can break.

## Where Hanas is the weaker choice

We would rather say this directly. Hanas is the weaker choice if:

- you want the AI to confirm bookings on the call, or write them into your PMS, today;
- you take a high volume of phone bookings and double entry would cost more staff time than the AI saves;
- your rates change several times a day and you need the AI to quote them live;
- you need payment taken on the call today. By default, Hanas does not take payment.

Hanas is more likely to suit you if you want staff to see and approve every request, want a set-up that starts from your website with no project, and are content with a short manual step. Mews, Cloudbeds, Little Hotelier, Guestline and eviivo are on the Hanas roadmap, with no dates yet. Hanas is in early access, so there are no customer reviews or case studies to show you. For published prices across vendors, see [what an AI receptionist costs in the UK](https://gethanas.com/blog/ai-receptionist-for-hotels-what-it-costs-in-the-uk-2026), and for a wider comparison see [the best AI receptionists for small UK hotels](https://gethanas.com/blog/7-best-ai-receptionists-for-uk-small-hotels-and-b-bs-2026). There is also a page for [boutique hotels](https://gethanas.com/for/boutique-hotels).

## What to ask any vendor about integration

![Icon tiles for four questions to ask about PMS integration: which PMS, read or write, creates bookings, cost](/blog/images/ai-receptionist-without-pms-small-hotel-integration-questions-tiles.png)

_Four questions before you sign_

| Question | Why it matters | A good answer looks like |
| --- | --- | --- |
| Which PMS and which version do you connect to? | A logo list may mean different depths of support | Names your exact PMS and says whether it is live or planned |
| Is access read-only or read-and-write? | Read-only cannot remove double entry | States each action the AI can perform |
| Does the AI create bookings or only look them up? | The biggest difference in staff workload | Says so plainly, and says who can override |
| What happens when the PMS is unavailable? | Calls should not fail because a system is down | A fallback to a request or message |
| Who approves changes to bookings? | Prevents an error becoming a confirmed booking | A staff approval option you can switch on |
| What does integration cost, one-off and monthly? | It may be a separate fee | A figure in writing, in your currency, ex or inc VAT |
| How long does it take, and who does the work? | Your PMS provider may need to be involved | A timeline and a named responsibility |
| Where is data stored when it leaves the PMS? | Guest data now passes through another supplier | A named location and list of sub-processors |

If an answer is "not stated" on the website, ask by email and keep the reply. It is useful if something later goes wrong.

## Frequently asked questions

### Can a hotel really use an AI receptionist without a PMS connection?

Yes. The AI works from a profile you review and sends requests to staff, who complete the booking in the PMS. The limits are double entry, possibly outdated answers and no live rates.

### Will the AI double-book a room if it cannot see availability?

Not if it only takes requests. It does not confirm anything, so staff check availability before they approve. The risk is a slower reply to the guest, not a double booking. An AI that confirms without live data would be a risk, so check how any vendor handles this.

### Which PMS does Hanas support?

None yet. Mews, Cloudbeds, Little Hotelier, Guestline and eviivo are on the roadmap, with no dates.

### Is my guests' data safe if the AI is not connected to my PMS?

A request-based set-up passes less data between systems, but the AI still handles call content. Hanas stores transcripts in Ireland, and its speech provider, ElevenLabs, processes calls in the US. See the [privacy notice](https://gethanas.com/privacy) and our [legal article](https://gethanas.com/blog/is-it-legal-to-use-an-ai-receptionist-at-a-uk-hotel).

## About this article

Written and checked by the Hanas team at Vibesapps, the company behind Hanas. Editorial standards: every vendor claim is attributed to the vendor's own page and dated, we say "not stated" where a page did not answer, we say where Hanas is the weaker choice, and we disclose that we make Hanas. The workflow in this article is our suggestion, not a tested result. We correct errors promptly. More about us: [About Hanas](https://gethanas.com/about).

## Sources

Pages read on 17 November 2026: [Hanas](https://gethanas.com/), [D3x AI hotel receptionist](https://www.d3x.ai/solutions/ai-hotel-receptionist), [Dextr AI](https://dextr.ai), [Canary AI voice for hotels](https://www.canarytechnologies.com/products/ai-voice-hotels), [Cloudbeds channel manager](https://www.cloudbeds.com/channel-manager/).

Product names and trademarks belong to their owners. Hanas is not affiliated with any other vendor named here.
