---
title: Is It Legal to Use an AI Receptionist at a UK Hotel?
description: A plain-English guide to UK call recording, UK GDPR, automated decisions and AI disclosure for hotels using an AI phone receptionist. Not legal advice.
cover: /blog/images/blog4-ai-receptionist-uk-hotel-legal.jpg
coverAlt: Glass app tiles on a dark violet and teal background showing a shield with a checkmark, a padlock, a document and a phone.
date: 2026-11-16
updated: 2026-11-24
author: The hanas.ai team
tags:
  - ai-receptionist
  - hotels-and-bbs
  - legal-and-compliance
draft: false
---

> **This is general information, not legal advice.** We are a software company, not a law firm. We make Hanas, an AI phone receptionist for small hotels, so we have an interest in this topic. We link to primary sources throughout. Most ICO pages we read carry a notice that the guidance is under review because of the Data (Use and Access) Act 2025, so check the live page before you rely on it. Where we found no primary source, we say so.

## Can a UK hotel legally use an AI phone receptionist?

We did not find any UK rule that bans a hotel from using an AI to answer its phone. But several rules shape how you do it. The main ones are about recording calls, handling personal data under UK GDPR, how much a human is involved in decisions, and telling callers what they are speaking to. If you also serve EU guests, EU rules on AI transparency may matter too.

> **Key Takeaways**

- Recording calls needs more than switching it on: UK regulations on business call monitoring expect reasonable efforts to inform the people who may use the phone system, and the ICO says a recorded message is good practice.
- If a vendor processes calls for you, your hotel is usually the data controller, though that depends on the facts, and the ICO expects a written contract with specific terms.
- We found no UK primary source that requires a business to tell callers they are speaking to an AI. Saying so early is still the safer course, and the ICO treats AI transparency as a data protection risk.
- Since 5 February 2026 UK GDPR's automated decision rules have been replaced by new Articles 22A to 22D. Whether a booking-request tool falls within them is untested, and we flag our reading as unverified.

## At a glance: what the sources say and where they stop

| Topic | What the primary source says | Gap or label |
| --- | --- | --- |
| Call recording | Business monitoring regulations expect reasonable efforts to inform; ICO says tell people and a recorded message is good practice | ICO page is about staff monitoring; no customer-call page found |
| Vendor contract | ICO lists required processor contract terms | Whether an AI vendor is a processor depends on the facts |
| Overseas transfers | ICO sets conditions for relying on the UK Extension to the EU-US Data Privacy Framework | Check your vendor's actual mechanism |
| Automated decisions | Articles 22A to 22D in force from 5 February 2026 | Booking-request scenario is our unverified reading |
| Telling callers it is an AI | No UK primary source found requiring it; EU Article 50 applies to providers from 2 August 2026 | Confirm EU position with your vendor |
| Card details | PCI SSC says storing validation codes after authorisation is a violation | No ICO or NCSC page found |
| Retention | UK GDPR sets no fixed period; you need a policy | No ICO figure for call recordings |
| Lawful basis | Not covered here | We did not read the ICO's lawful basis guidance |

## Recording calls

The Telecommunications (Lawful Business Practice) (Interception of Communications) Regulations 2000 set conditions for businesses that monitor or record calls. As we read [regulation 3](https://www.legislation.gov.uk/uksi/2000/2699/regulation/3), there are conditions. The recording must be for the business. The person controlling the phone system must consent. And they must have made all reasonable efforts to inform users of the system that communications may be intercepted. Whether callers count as "users of the system" is not clear from the page we read, which is one reason we suggest telling every caller. The page we read shows the version as originally made, so check legislation.gov.uk for the current text.

On what you should tell people, the ICO's guidance on monitoring workers says you must tell people you are recording the call and why, and that a recorded message is good practice (see [ICO, monitoring telephone calls](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/employment/monitoring-workers/specific-data-protection-considerations-for-different-ways-or-methods-of-monitoring-workers/)). That page is about monitoring staff, not guests, and we found no ICO page dedicated to recording customers' calls. Even so, a clear message at the start of every call is the safest approach to take. As shown on the [Hanas website](https://gethanas.com/) on 15 November 2026, the Hanas demo works this way: its first sentence says it is an AI receptionist and that the call is recorded.

## UK GDPR when an AI vendor handles the call

**Who is responsible.** A controller [determines the purposes and means of the processing](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/controllers-and-processors/controllers-and-processors/what-are-controllers-and-processors/), and a processor acts on its behalf. Whether a particular AI vendor is a processor depends on the facts, and we found no primary source on AI receptionists specifically. In our reading, in the usual set-up the hotel decides why guests' calls are handled, so the hotel is the controller.

**The contract.** The ICO's page on [what a processor contract must include](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/contracts-and-liabilities-between-controllers-and-processors-multi/what-needs-to-be-included-in-the-contract/) lists terms such as:

- processing only on your documented instructions
- confidentiality duties
- security measures
- prior written authorisation for sub-processors
- help with data subject rights, breach notification and impact assessments
- deletion or return of data at the end of the contract
- audits

Ask any vendor for its data processing agreement and check it against that list.

**Your privacy notice.** The ICO's AI audit toolkit names, as a risk, [AI being in use without privacy information saying so](https://ico.org.uk/for-organisations/advice-and-services/audits/data-protection-audit-framework/toolkits/artificial-intelligence/transparency/). Update your guest privacy notice to describe call recording, the AI and the vendors involved.

**Impact assessment.** The ICO says [processing involving innovative technologies](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/data-protection-impact-assessments-dpias/when-do-we-need-to-do-a-dpia/) can trigger a data protection impact assessment (DPIA), generally when combined with another criterion. We found no primary source saying whether a hotel's AI call answering needs one, so read the ICO's DPIA page and decide for your own case.

**Lawful basis.** This article does not cover which lawful basis suits call recording, because we did not read the ICO's lawful basis guidance. Read it before you choose a basis.

## Where the data goes

Some AI voice products use speech providers outside the UK. If personal data is sent to the US, the ICO's page on the [UK Extension to the EU-US Data Privacy Framework](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/international-transfers/adequacy-regulations/how-does-the-uk-extension-to-the-eu-us-data-privacy-framework-work/) (last updated 30 July 2026) says you can rely on it only where the US business has an active status on the DPF list, has certified to the UK Extension and the certification covers the type of data. Otherwise you need appropriate safeguards or an exception, and a transfer risk assessment first if you use a safeguard.

Ask every vendor where calls are processed and stored, including sub-processors. For example, as stated in the [privacy and security section of the Hanas website](https://gethanas.com/#trust) on 15 November 2026, Hanas stores transcripts and requests in Ireland and its speech provider, ElevenLabs, processes calls in the US. Whether that arrangement meets your transfer obligations is something your hotel should check. Hanas's [privacy notice](https://gethanas.com/privacy) is the place to check the detail. For how other vendors describe where they store data, see our [comparison of seven AI receptionists](https://gethanas.com/blog/7-best-ai-receptionists-for-uk-small-hotels-and-b-bs-2026).

## Automated decisions and human involvement

Section 80 of the Data (Use and Access) Act 2025 replaced UK GDPR Article 22 with Articles 22A to 22D, and [the commencement regulations](https://www.legislation.gov.uk/uksi/2026/82/regulation/2/made) bring section 80 into force on 5 February 2026. As we read [section 80](https://www.legislation.gov.uk/ukpga/2025/18/section/80), a decision is "based solely on automated processing" when there is no meaningful human involvement. A "significant decision" is one with a legal or similarly significant effect. Where those apply, the new Article 22C safeguards include telling the person, letting them make representations, obtaining human intervention and contesting the decision.

Does a receptionist that only takes a booking request for a person to approve count? **We found no primary source on that scenario, so what follows is our unverified interpretation.** If a person genuinely decides each booking, the decision is not based solely on automated processing. The risk is approval that is a rubber stamp. We read an [ICO draft impact assessment dated March 2026](https://ico.org.uk/about-the-ico/research-reports-impact-and-evaluation/impact-and-evaluation/impact-assessment/update-to-automated-decision-making-guidance-draft-impact-assessment/) that refers to draft automated decision-making guidance, and we found no final version, so watch for it. The ICO's page on [rights related to automated decision-making](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/rights-related-to-automated-decision-making-including-profiling/) still used the old wording when we read it.

Practical steps that follow from the tests: keep a person making the final decision on each booking, and avoid letting software decline guests or set prices on its own without review. For example, a guest rings at 11 pm to ask for a double room next weekend. The AI takes the dates and contact details and sends a request. Whether the guest gets the room is then decided by a member of staff, who can approve, decline or call back.

## Telling callers they are speaking to an AI

**UK.** We found no UK primary source that requires a business to tell callers they are speaking to an AI. The ICO's [guidance on explaining decisions made with AI](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/artificial-intelligence/explaining-decisions-made-with-artificial-intelligence/part-1-the-basics-of-explaining-ai/legal-framework/) ties information duties to solely automated decisions with significant effects, though that guidance may pre-date the 2025 Act changes. Its AI transparency toolkit treats undisclosed AI as a risk. Disclosing early costs little and avoids that risk.

**EU guests.** The EU AI Act's Article 50 says providers of AI systems that interact directly with people must design them so those people are informed they are dealing with an AI, unless that is obvious from the context. According to the [text of Article 50](https://artificialintelligenceact.eu/article/50/) on the Future of Life Institute's site, it applies from 2 August 2026, and as worded that duty falls on the provider, not on the hotel. The same site's page on the [Digital Omnibus](https://artificialintelligenceact.eu/ai-act-explorer/digital-omnibus/) reports that providers of generative AI systems already on the market before 2 August 2026 have until 2 December 2026 to comply with Article 50(2), which concerns marking AI-generated content, not call disclosure. We read only part of that page and could not retrieve the official EUR-Lex text, so confirm the current position with the vendor if you take bookings from EU guests.

## Card details on calls

The PCI Security Standards Council's [FAQ on audio recordings](https://www.pcisecuritystandards.org/faqs/1210/) says storing card validation codes after authorisation is a violation, and that applies to recorded audio. The simplest way to avoid the problem is not to let an AI line collect card details at all. Ask every vendor, Hanas included, how it handles card details spoken on a call. We found no ICO or NCSC page on card data spoken on recorded calls.

## Marketing rules and retention

**Marketing calls.** The ICO's [guidance on live direct marketing calls](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-direct-marketing-using-live-calls/what-are-live-direct-marketing-calls/) is framed around calls you make. It does not address inbound calls answered by an AI, and this article is about inbound calls only. If an AI ever makes outbound calls, different rules apply.

**How long to keep recordings.** The ICO's [storage limitation guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/storage-limitation/) says UK GDPR sets no specific time limits and that you need a policy setting standard retention periods wherever possible. We found no ICO figure for call recordings. The [Hanas website](https://gethanas.com/#trust) states that call transcripts are deleted after 30 days by default (as of 15 November 2026). That is a product choice, not a legal standard.

## Questions to ask any AI receptionist vendor

1. Will you sign a data processing agreement that covers the terms the ICO lists?
2. Where are calls recorded, transcribed and stored, and which sub-processors touch them?
3. If data goes outside the UK, what transfer mechanism do you rely on?
4. How does the AI tell callers it is an AI and that the call is recorded?
5. Does the AI collect card details? If so, how is that data kept out of recordings?
6. How long are recordings and transcripts kept, and can I shorten that?
7. Does a person make the final decision on bookings, and how is that shown?
8. What happens when the AI cannot help?

For price questions to ask as well, see [what an AI receptionist costs in the UK](https://gethanas.com/blog/ai-receptionist-for-hotels-what-it-costs-in-the-uk-2026).

## Frequently asked questions

### Do I have to tell callers I am recording?

The ICO's monitoring guidance says you must tell people you are recording and why, and calls a recorded message good practice. That page is about workers, and we found no customer-specific ICO page, so the safe approach is a clear message at the start of every call.

### Do I need a DPIA?

The ICO lists innovative technologies as a possible trigger, usually alongside another criterion. We found no primary source answering this for a hotel's AI call handling, so work through the ICO's DPIA page for your own situation.

### Does the EU AI Act apply to a UK hotel?

We cannot say for certain. Article 50, as worded, places the transparency duty on providers. If you take bookings from EU guests, ask your vendor how it complies, and check the current official text.

### Is Hanas compliant with UK GDPR?

Compliance depends on how a hotel uses a product as well as on the product. We describe our practices above, but we are not able to certify any hotel's compliance and this article is not legal advice.

## Sources

- legislation.gov.uk, [Lawful Business Practice Regulations 2000, regulation 3](https://www.legislation.gov.uk/uksi/2000/2699/regulation/3); [Data (Use and Access) Act 2025, section 80](https://www.legislation.gov.uk/ukpga/2025/18/section/80); [Commencement No. 6 Regulations 2026, regulation 2](https://www.legislation.gov.uk/uksi/2026/82/regulation/2/made).
- ICO: [monitoring workers](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/employment/monitoring-workers/specific-data-protection-considerations-for-different-ways-or-methods-of-monitoring-workers/); [controllers and processors](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/controllers-and-processors/controllers-and-processors/what-are-controllers-and-processors/); [processor contracts](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/contracts-and-liabilities-between-controllers-and-processors-multi/what-needs-to-be-included-in-the-contract/); [AI transparency toolkit](https://ico.org.uk/for-organisations/advice-and-services/audits/data-protection-audit-framework/toolkits/artificial-intelligence/transparency/); [DPIAs](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/data-protection-impact-assessments-dpias/when-do-we-need-to-do-a-dpia/); [UK Extension to the EU-US DPF](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/international-transfers/adequacy-regulations/how-does-the-uk-extension-to-the-eu-us-data-privacy-framework-work/); [automated decision-making rights](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/rights-related-to-automated-decision-making-including-profiling/); [explaining decisions made with AI](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/artificial-intelligence/explaining-decisions-made-with-artificial-intelligence/part-1-the-basics-of-explaining-ai/legal-framework/); [live direct marketing calls](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-direct-marketing-using-live-calls/what-are-live-direct-marketing-calls/); [storage limitation](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/storage-limitation/).
- PCI Security Standards Council, [FAQ 1210](https://www.pcisecuritystandards.org/faqs/1210/).
- Future of Life Institute, [EU AI Act, Article 50](https://artificialintelligenceact.eu/article/50/) and [Digital Omnibus on AI](https://artificialintelligenceact.eu/ai-act-explorer/digital-omnibus/). These are reproductions, not the Official Journal.
- ICO, [draft impact assessment for automated decision-making guidance](https://ico.org.uk/about-the-ico/research-reports-impact-and-evaluation/impact-and-evaluation/impact-assessment/update-to-automated-decision-making-guidance-draft-impact-assessment/) (March 2026).
- Hanas, [privacy and security section](https://gethanas.com/#trust) and [privacy notice](https://gethanas.com/privacy).

All pages were read on 15 November 2026.

## Related reads

- [7 best AI receptionists for UK small hotels and B&Bs](https://gethanas.com/blog/7-best-ai-receptionists-for-uk-small-hotels-and-b-bs-2026): compares vendors, including where each says it stores data.
- [What an AI receptionist costs in the UK](https://gethanas.com/blog/ai-receptionist-for-hotels-what-it-costs-in-the-uk-2026): published prices, with workings.
- [How many calls does a small hotel miss?](https://gethanas.com/blog/how-many-calls-does-a-small-hotel-miss-what-it-costs): measure the problem before you choose a fix.
- [Hanas for boutique hotels](https://gethanas.com/for/boutique-hotels)

## About this article

Written and checked by the Hanas team at Vibesapps, the company behind Hanas. Editorial standards: every regulatory claim links to a primary source, we label our own interpretations, we say where we found no source, and we disclose that we make Hanas. We correct errors promptly and show the update date at the top. To report an error, email [support@vibesapps.co](mailto:support@vibesapps.co). More about us: [About Hanas](https://gethanas.com/about).
