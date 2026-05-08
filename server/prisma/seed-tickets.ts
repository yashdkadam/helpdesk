import { prisma } from "../src/lib/prisma";

const tickets = [
  // general_question – open
  { subject: "How do I reset my password?", body: "I forgot my password and can't log in. What's the process to reset it?", senderName: "Emma Johnson", senderEmail: "emma.johnson@gmail.com", status: "open", category: "general_question", daysAgo: 1 },
  { subject: "What are your business hours?", body: "I'd like to know when your support team is available to assist.", senderName: "Liam Brown", senderEmail: "liam.brown@outlook.com", status: "open", category: "general_question", daysAgo: 2 },
  { subject: "Do you offer a free trial?", body: "Before purchasing, I'd like to try the product. Do you have a free trial option?", senderName: "Sophia Martinez", senderEmail: "sophia.m@yahoo.com", status: "open", category: "general_question", daysAgo: 3 },
  { subject: "Can I change my subscription plan?", body: "I'm currently on the basic plan and want to upgrade to pro. How do I do that?", senderName: "Noah Davis", senderEmail: "noah.davis@company.com", status: "open", category: "general_question", daysAgo: 4 },
  { subject: "How do I add team members?", body: "I need to invite my colleagues to the workspace. Where is that option?", senderName: "Olivia Wilson", senderEmail: "olivia.wilson@startup.io", status: "open", category: "general_question", daysAgo: 5 },
  { subject: "Is there a mobile app?", body: "I travel frequently and need to access my account on my phone.", senderName: "James Anderson", senderEmail: "james.a@personal.net", status: "open", category: "general_question", daysAgo: 6 },
  { subject: "How do I export my data?", body: "I need to download all my account data for compliance purposes.", senderName: "Isabella Thomas", senderEmail: "i.thomas@enterprise.com", status: "open", category: "general_question", daysAgo: 7 },
  { subject: "Can I use my own domain?", body: "We'd like to white-label the product with our company domain.", senderName: "William Jackson", senderEmail: "w.jackson@agency.com", status: "open", category: "general_question", daysAgo: 8 },
  { subject: "Where do I find my invoices?", body: "I need to download past invoices for our accounting department.", senderName: "Mia White", senderEmail: "mia.white@firm.co", status: "open", category: "general_question", daysAgo: 9 },
  { subject: "How do I cancel my account?", body: "I've decided to stop using the service. What's the cancellation process?", senderName: "Elijah Harris", senderEmail: "e.harris@private.me", status: "open", category: "general_question", daysAgo: 10 },

  // general_question – resolved
  { subject: "What payment methods do you accept?", body: "Do you accept PayPal or only credit cards?", senderName: "Charlotte Clark", senderEmail: "charlotte.c@shopper.com", status: "resolved", category: "general_question", daysAgo: 15 },
  { subject: "Is my data encrypted?", body: "We're a healthcare company and need to ensure HIPAA compliance.", senderName: "Benjamin Lewis", senderEmail: "ben.lewis@healthco.org", status: "resolved", category: "general_question", daysAgo: 18 },
  { subject: "Can I switch billing from monthly to annual?", body: "I'd like to save money by paying annually instead of monthly.", senderName: "Amelia Robinson", senderEmail: "amelia.r@blog.net", status: "resolved", category: "general_question", daysAgo: 20 },
  { subject: "Do you have an affiliate program?", body: "I'd love to recommend your product and earn a commission.", senderName: "Henry Walker", senderEmail: "henry.w@influencer.social", status: "resolved", category: "general_question", daysAgo: 22 },
  { subject: "How many users can I have on my plan?", body: "I manage a team of 25 and need to know which plan fits.", senderName: "Evelyn Hall", senderEmail: "evelyn.hall@corp.net", status: "resolved", category: "general_question", daysAgo: 25 },

  // general_question – closed
  { subject: "Is there a student discount?", body: "I'm a university student and wondering if there's a discounted plan.", senderName: "Alexander Allen", senderEmail: "alex.allen@university.edu", status: "closed", category: "general_question", daysAgo: 30 },
  { subject: "Do you support multiple languages?", body: "Our team is based in France and Germany. Is the UI available in French and German?", senderName: "Scarlett Young", senderEmail: "scarlett.y@eurofirm.eu", status: "closed", category: "general_question", daysAgo: 35 },
  { subject: "Can I pause my subscription?", body: "I'm going on parental leave for 3 months. Can I pause instead of cancel?", senderName: "Daniel Hernandez", senderEmail: "d.hernandez@family.com", status: "closed", category: "general_question", daysAgo: 40 },
  { subject: "What's your uptime SLA?", body: "Our operations depend on 99.9% uptime. What's your guarantee?", senderName: "Victoria King", senderEmail: "v.king@ops.company", status: "closed", category: "general_question", daysAgo: 45 },
  { subject: "How do I change my email address?", body: "I got a new work email and want to update my account.", senderName: "Sebastian Wright", senderEmail: "s.wright@newemail.com", status: "closed", category: "general_question", daysAgo: 50 },

  // technical_question – open
  { subject: "API rate limit keeps getting hit", body: "We're making about 500 requests per minute and hitting the rate limit. What are our options?", senderName: "Aiden Scott", senderEmail: "aiden.s@devteam.io", status: "open", category: "technical_question", daysAgo: 1 },
  { subject: "Webhook not receiving events", body: "I've set up the webhook endpoint but events aren't coming through. Here's my server config...", senderName: "Luna Torres", senderEmail: "luna.t@techstartup.dev", status: "open", category: "technical_question", daysAgo: 2 },
  { subject: "SSO configuration failing", body: "We're trying to set up SAML SSO with our Okta provider but getting a certificate error.", senderName: "Carter Moore", senderEmail: "carter.m@bigcorp.com", status: "open", category: "technical_question", daysAgo: 3 },
  { subject: "CSV import silently drops rows", body: "When I import a 5000-row CSV, only 4800 rows appear. No error is shown.", senderName: "Penelope Lee", senderEmail: "penelope.l@datacompany.com", status: "open", category: "technical_question", daysAgo: 4 },
  { subject: "2FA codes not working", body: "I set up two-factor authentication but the codes from my authenticator app are always rejected.", senderName: "Jackson Martin", senderEmail: "j.martin@secure.me", status: "open", category: "technical_question", daysAgo: 5 },
  { subject: "Zapier integration broken after update", body: "Since last week's update our Zap stopped triggering. The connection still shows as active.", senderName: "Aria Thompson", senderEmail: "aria.t@automate.biz", status: "open", category: "technical_question", daysAgo: 6 },
  { subject: "Dashboard charts not loading on Safari", body: "The analytics charts render fine in Chrome but show a blank area in Safari 17.", senderName: "Grayson Garcia", senderEmail: "g.garcia@design.studio", status: "open", category: "technical_question", daysAgo: 7 },
  { subject: "OAuth token expiring too fast", body: "Our integration's access token is expiring after 1 hour. The docs say it should last 24 hours.", senderName: "Zoey Martinez", senderEmail: "zoey.m@integration.tech", status: "open", category: "technical_question", daysAgo: 8 },
  { subject: "Bulk delete API returns 500", body: "Calling DELETE /api/items with an array of 200+ IDs returns a 500 error.", senderName: "Ryan Anderson", senderEmail: "ryan.a@developer.com", status: "open", category: "technical_question", daysAgo: 9 },
  { subject: "Date filter returns wrong timezone results", body: "Filtering by 'today' returns records from yesterday for users in UTC+8.", senderName: "Nora Wilson", senderEmail: "nora.w@global.co", status: "open", category: "technical_question", daysAgo: 10 },

  // technical_question – resolved
  { subject: "PDF exports are missing images", body: "When exporting reports to PDF, all embedded images are blank.", senderName: "Levi Jackson", senderEmail: "levi.j@reportco.com", status: "resolved", category: "technical_question", daysAgo: 12 },
  { subject: "Search not returning exact phrase matches", body: "Searching for 'annual report 2024' returns unrelated results instead of the exact document.", senderName: "Ella White", senderEmail: "ella.white@research.org", status: "resolved", category: "technical_question", daysAgo: 14 },
  { subject: "Can't connect PostgreSQL data source", body: "Getting 'SSL required' error when trying to connect our RDS instance.", senderName: "Lincoln Harris", senderEmail: "lincoln.h@dataeng.io", status: "resolved", category: "technical_question", daysAgo: 16 },
  { subject: "Email notifications going to spam", body: "All system emails are landing in Gmail's spam folder for our entire team.", senderName: "Hazel Clark", senderEmail: "hazel.c@teamwork.com", status: "resolved", category: "technical_question", daysAgo: 18 },
  { subject: "Sorting doesn't work for numeric columns", body: "Sorting a column with values 1, 2, 10, 20 gives 1, 10, 2, 20 instead of numerical order.", senderName: "Ezra Lewis", senderEmail: "ezra.l@datavis.co", status: "resolved", category: "technical_question", daysAgo: 20 },
  { subject: "File upload stuck at 99%", body: "Uploading files larger than 50MB always gets stuck at 99% progress and never completes.", senderName: "Aurora Robinson", senderEmail: "aurora.r@mediahouse.com", status: "resolved", category: "technical_question", daysAgo: 22 },
  { subject: "Duplicate records appearing after sync", body: "After syncing with our CRM, contacts are appearing twice in the database.", senderName: "Elias Walker", senderEmail: "elias.w@crm-admin.com", status: "resolved", category: "technical_question", daysAgo: 24 },
  { subject: "Slack notifications stopped sending", body: "We stopped receiving Slack alerts two days ago. The integration is still enabled.", senderName: "Chloe Hall", senderEmail: "chloe.h@slack-user.com", status: "resolved", category: "technical_question", daysAgo: 26 },
  { subject: "Multi-select dropdown not saving", body: "Changes to multi-select fields revert to previous values after saving.", senderName: "Owen Young", senderEmail: "owen.y@formbuilder.net", status: "resolved", category: "technical_question", daysAgo: 28 },
  { subject: "Map widget not rendering on mobile", body: "The embedded map shows correctly on desktop but is completely blank on iOS devices.", senderName: "Stella Hernandez", senderEmail: "stella.h@mobile-dev.io", status: "resolved", category: "technical_question", daysAgo: 30 },

  // technical_question – closed
  { subject: "Can't delete archived projects", body: "Archived projects can't be permanently deleted even with admin permissions.", senderName: "Felix King", senderEmail: "felix.k@pm-tool.com", status: "closed", category: "technical_question", daysAgo: 35 },
  { subject: "Reports generating with wrong currency", body: "Revenue reports are showing amounts in USD but our account is set to EUR.", senderName: "Isla Wright", senderEmail: "isla.w@finance.eu", status: "closed", category: "technical_question", daysAgo: 38 },
  { subject: "Custom domain SSL certificate expired", body: "Our custom domain is showing an SSL warning in browsers since this morning.", senderName: "Jasper Scott", senderEmail: "jasper.s@customdomain.com", status: "closed", category: "technical_question", daysAgo: 42 },
  { subject: "Recursive formula causing infinite loop", body: "I created a formula that references itself and now the page is unresponsive.", senderName: "Lily Torres", senderEmail: "lily.t@spreadsheet.pro", status: "closed", category: "technical_question", daysAgo: 46 },
  { subject: "IP whitelist not blocking traffic", body: "We set up IP whitelist restrictions but users outside the allowed range can still access the app.", senderName: "Theo Moore", senderEmail: "theo.m@security.team", status: "closed", category: "technical_question", daysAgo: 50 },

  // refund_request – open
  { subject: "Charged twice for last month", body: "My credit card statement shows two charges of $49 on the same date. Please refund the duplicate.", senderName: "Maya Lee", senderEmail: "maya.lee@personal.com", status: "open", category: "refund_request", daysAgo: 1 },
  { subject: "Refund for unused annual plan", body: "I accidentally upgraded to annual when I meant monthly. I'd like a refund for the difference.", senderName: "Lucas Martin", senderEmail: "lucas.m@mistake.com", status: "open", category: "refund_request", daysAgo: 2 },
  { subject: "Product didn't work as advertised", body: "The integration with QuickBooks that was listed as a feature doesn't actually work. I want a refund.", senderName: "Layla Thompson", senderEmail: "layla.t@accounting.biz", status: "open", category: "refund_request", daysAgo: 3 },
  { subject: "Cancelled but still got charged", body: "I cancelled my subscription two weeks ago but was still billed this month.", senderName: "Ethan Garcia", senderEmail: "ethan.g@cancelled.me", status: "open", category: "refund_request", daysAgo: 4 },
  { subject: "Team member refund after downgrade", body: "We reduced from 10 seats to 5 mid-cycle. Requesting a prorated refund for the 5 unused seats.", senderName: "Avery Martinez", senderEmail: "avery.m@teamlead.com", status: "open", category: "refund_request", daysAgo: 5 },
  { subject: "Wrong plan charged at signup", body: "I signed up for the Starter plan but was charged the Pro plan price. Please correct this.", senderName: "Harper Anderson", senderEmail: "harper.a@newuser.com", status: "open", category: "refund_request", daysAgo: 6 },
  { subject: "Service was down during my billing period", body: "The platform was unavailable for 3 days last month. I'm requesting a partial refund.", senderName: "Mason Wilson", senderEmail: "mason.w@downtime.report", status: "open", category: "refund_request", daysAgo: 7 },
  { subject: "Charged after free trial ended unexpectedly", body: "I wasn't notified that my trial was ending. I would have cancelled. Please refund the first charge.", senderName: "Evelyn Jackson", senderEmail: "evelyn.j@trial.user", status: "open", category: "refund_request", daysAgo: 8 },
  { subject: "Refund for add-on I never activated", body: "I see a charge for the Advanced Analytics add-on that I never enabled.", senderName: "Logan White", senderEmail: "logan.w@addon.com", status: "open", category: "refund_request", daysAgo: 9 },
  { subject: "Overpayment due to currency conversion error", body: "I'm billed in USD but our bank converted at a much worse rate than expected. Charged ~$20 extra.", senderName: "Abigail Harris", senderEmail: "abigail.h@international.co", status: "open", category: "refund_request", daysAgo: 10 },

  // refund_request – resolved
  { subject: "Duplicate charge from failed payment retry", body: "The payment failed on the 1st and succeeded on the 3rd, but both charges went through.", senderName: "Jackson Clark", senderEmail: "jackson.c@billing.issue", status: "resolved", category: "refund_request", daysAgo: 13 },
  { subject: "Refund for a seat we never used", body: "We bought 3 seats but only ever used 2. The third was never activated.", senderName: "Sofia Lewis", senderEmail: "sofia.l@team.small", status: "resolved", category: "refund_request", daysAgo: 16 },
  { subject: "Billed for features removed from my plan", body: "Features I was using were moved to a higher tier but I'm still being charged the same.", senderName: "Aiden Robinson", senderEmail: "aiden.r@legacy.plan", status: "resolved", category: "refund_request", daysAgo: 19 },
  { subject: "Charged in wrong currency", body: "My account is set to GBP but I was charged in USD at today's exchange rate.", senderName: "Mila Walker", senderEmail: "mila.w@uk.user", status: "resolved", category: "refund_request", daysAgo: 22 },
  { subject: "Refund for enterprise plan signed under wrong account", body: "Our finance team accidentally paid for enterprise under a personal account. Need a refund to recharge the company card.", senderName: "Sebastian Hall", senderEmail: "sebastian.h@enterprise.corp", status: "resolved", category: "refund_request", daysAgo: 25 },
  { subject: "Annual plan not receiving promised discount", body: "The checkout showed a 20% annual discount but my invoice shows full price.", senderName: "Camila Young", senderEmail: "camila.y@deal.seeker", status: "resolved", category: "refund_request", daysAgo: 28 },
  { subject: "Refund for accidental upgrade by team member", body: "A junior team member accidentally upgraded to the Enterprise plan. Can we reverse this?", senderName: "Ezra Hernandez", senderEmail: "ezra.h@accidental.upgrade", status: "resolved", category: "refund_request", daysAgo: 31 },
  { subject: "Promotional code not applied at checkout", body: "I used promo code SAVE20 but was charged full price. Please apply the discount retroactively.", senderName: "Aurora King", senderEmail: "aurora.k@promo.code", status: "resolved", category: "refund_request", daysAgo: 34 },
  { subject: "Refund request after account compromise", body: "My account was accessed without permission and upgraded. Requesting reversal of all charges.", senderName: "Levi Wright", senderEmail: "levi.w@security.incident", status: "resolved", category: "refund_request", daysAgo: 37 },
  { subject: "Trial converted to paid without warning", body: "No email warned me the trial was ending. The charge appeared without any notification.", senderName: "Penelope Scott", senderEmail: "penelope.s@no.notice", status: "resolved", category: "refund_request", daysAgo: 40 },

  // refund_request – closed
  { subject: "Refund denied but I have proof of cancellation", body: "I cancelled on the 28th and have a confirmation email, but I was still charged on the 1st.", senderName: "Lincoln Torres", senderEmail: "lincoln.t@proof.com", status: "closed", category: "refund_request", daysAgo: 45 },
  { subject: "Refund for non-delivered physical goods", body: "The conference package that was supposed to ship with my enterprise contract never arrived.", senderName: "Hazel Moore", senderEmail: "hazel.m@conference.swag", status: "closed", category: "refund_request", daysAgo: 48 },
  { subject: "Duplicate accounts, need to merge and refund one", body: "I have two accounts with two active subscriptions. I only need one. Please refund the duplicate.", senderName: "Felix Lee", senderEmail: "felix.l@duplicate.account", status: "closed", category: "refund_request", daysAgo: 52 },
  { subject: "Charged for plan that no longer exists", body: "I'm on a legacy plan that was discontinued. I was still charged even though migration wasn't completed.", senderName: "Isla Martin", senderEmail: "isla.m@legacy.pricing", status: "closed", category: "refund_request", daysAgo: 56 },
  { subject: "Refund for software license unused due to company closure", body: "Our startup shut down and we were unable to use the annual license we just purchased.", senderName: "Jasper Thompson", senderEmail: "jasper.t@shutdown.io", status: "closed", category: "refund_request", daysAgo: 60 },

  // Mix – more variety across statuses
  { subject: "Account locked after too many login attempts", body: "I tried my password too many times and now I'm locked out. How do I regain access?", senderName: "Lily Garcia", senderEmail: "lily.g@locked.out", status: "open", category: "technical_question", daysAgo: 11 },
  { subject: "Can two users share an account?", body: "My business partner and I want to use the same account to save on licensing costs.", senderName: "Theo Martinez", senderEmail: "theo.m@shared.account", status: "resolved", category: "general_question", daysAgo: 17 },
  { subject: "Billing address needs to be updated", body: "We moved offices. I need to update the billing address on file for our invoices.", senderName: "Maya Anderson", senderEmail: "maya.a@new.address", status: "resolved", category: "general_question", daysAgo: 19 },
  { subject: "Integration with Salesforce not syncing", body: "Leads created in Salesforce aren't appearing after a 1-hour delay as documented.", senderName: "Lucas Wilson", senderEmail: "lucas.w@salesforce.user", status: "open", category: "technical_question", daysAgo: 3 },
  { subject: "Refund request – purchased wrong product tier", body: "I purchased the Business tier when I needed the Enterprise tier. Can I get a credit?", senderName: "Layla Jackson", senderEmail: "layla.j@wrong.tier", status: "open", category: "refund_request", daysAgo: 2 },
  { subject: "Data not visible to sub-account users", body: "Sub-account users can log in but see no data. Permissions look correct on my end.", senderName: "Ethan White", senderEmail: "ethan.w@permissions.bug", status: "open", category: "technical_question", daysAgo: 4 },
  { subject: "How do I transfer account ownership?", body: "I'm leaving the company and need to transfer admin rights to my colleague before I go.", senderName: "Avery Harris", senderEmail: "avery.h@leaving.soon", status: "resolved", category: "general_question", daysAgo: 21 },
  { subject: "Refund for misunderstood pricing page", body: "The pricing page implied the add-on was included. It wasn't. I'd like a refund.", senderName: "Harper Clark", senderEmail: "harper.c@misled.customer", status: "open", category: "refund_request", daysAgo: 6 },
  { subject: "API documentation has wrong endpoint", body: "The docs say POST /v2/events but it returns 404. The working endpoint appears to be /v2/event.", senderName: "Mason Lewis", senderEmail: "mason.l@api.dev", status: "resolved", category: "technical_question", daysAgo: 14 },
  { subject: "Error 403 when accessing shared links", body: "Links shared by admins give guests a 403 error even after they've been granted access.", senderName: "Evelyn Robinson", senderEmail: "evelyn.r@shared.links", status: "open", category: "technical_question", daysAgo: 5 },
  { subject: "Can't see historical data beyond 90 days", body: "The date picker won't let me select dates older than 90 days. Is there a limit on our plan?", senderName: "Logan Walker", senderEmail: "logan.w@history.needed", status: "closed", category: "general_question", daysAgo: 55 },
  { subject: "Payment failed but account shows active", body: "My last payment failed yet the account is still active. Will it cut off suddenly?", senderName: "Abigail Hall", senderEmail: "abigail.h@payment.pending", status: "open", category: "general_question", daysAgo: 1 },
  { subject: "Automated report not arriving by email", body: "I set up a weekly report to be emailed every Monday but it stopped arriving 3 weeks ago.", senderName: "Jackson Young", senderEmail: "jackson.y@weekly.report", status: "resolved", category: "technical_question", daysAgo: 23 },
  { subject: "GDPR data deletion request", body: "Under GDPR Article 17, I request permanent deletion of all personal data associated with my account.", senderName: "Sofia Hernandez", senderEmail: "sofia.h@gdpr.eu", status: "resolved", category: "general_question", daysAgo: 29 },
  { subject: "Unexpected charge after downgrading plan", body: "I downgraded from Pro to Basic but was still charged the Pro price for another month.", senderName: "Aiden King", senderEmail: "aiden.k@downgrade.fail", status: "open", category: "refund_request", daysAgo: 3 },
  { subject: "Custom reports not respecting date range filter", body: "When I filter a custom report to Q3 only, it still shows data from Q4.", senderName: "Mila Wright", senderEmail: "mila.w@report.bug", status: "open", category: "technical_question", daysAgo: 6 },
  { subject: "Do you store data in the EU?", body: "Our legal team requires that all data be stored within the European Union. Can you confirm?", senderName: "Sebastian Scott", senderEmail: "sebastian.s@compliance.eu", status: "resolved", category: "general_question", daysAgo: 33 },
  { subject: "Refund for team account after layoffs", body: "We had to lay off half the team and need to downgrade. Can we get a refund on unused seats?", senderName: "Camila Torres", senderEmail: "camila.t@layoffs.sad", status: "open", category: "refund_request", daysAgo: 8 },
  { subject: "App crashes when uploading large videos", body: "Uploading MP4 files over 2GB causes the browser to freeze and eventually show a white screen.", senderName: "Ezra Moore", senderEmail: "ezra.m@video.editor", status: "resolved", category: "technical_question", daysAgo: 27 },
  { subject: "Can we get a nonprofit discount?", body: "We are a registered 501(c)(3) charity. Do you have reduced pricing for nonprofits?", senderName: "Aurora Lee", senderEmail: "aurora.l@nonprofit.org", status: "open", category: "general_question", daysAgo: 5 },
];

async function main() {
  const created = await prisma.$transaction(
    tickets.map((t) => {
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - t.daysAgo);
      return prisma.ticket.create({
        data: {
          subject: t.subject,
          body: t.body,
          senderName: t.senderName,
          senderEmail: t.senderEmail,
          status: t.status as "open" | "resolved" | "closed",
          category: t.category as "general_question" | "technical_question" | "refund_request",
          createdAt,
        },
      });
    })
  );
  console.log(`Created ${created.length} tickets.`);
  await prisma.$disconnect();
}

main();
