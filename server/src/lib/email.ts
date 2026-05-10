import sgMail from "@sendgrid/mail";

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function sendReplyEmail({
  to,
  toName,
  subject,
  body,
}: {
  to: string;
  toName: string;
  subject: string;
  body: string;
}): Promise<void> {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
    console.warn("[email] SENDGRID_API_KEY or SENDGRID_FROM_EMAIL not set — skipping");
    return;
  }

  await sgMail.send({
    to: { email: to, name: toName },
    from: { email: process.env.SENDGRID_FROM_EMAIL, name: "Support" },
    subject: `Re: ${subject}`,
    text: body,
  });
}
