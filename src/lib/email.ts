/**
 * Circle Fund Email Notification System
 * 
 * Configured with EMAIL_ENABLED flag (default: false).
 * When disabled, emails are safely logged to console / delivery log without making network calls.
 * 
 * To enable in the future:
 * 1. Set EMAIL_ENABLED=true in .env
 * 2. Set EMAIL_PROVIDER=resend | smtp | sendgrid
 * 3. Provide EMAIL_API_KEY or SMTP credentials
 */

export interface EmailRecipient {
  email: string;
  name: string;
  language?: 'en' | 'da';
}

export interface EmailPayload {
  to: EmailRecipient;
  subject: string;
  html: string;
  text: string;
  templateType: 'invitation' | 'payment_reminder' | 'collector_assigned' | 'report_published';
}

export interface EmailDeliveryResult {
  success: boolean;
  messageId?: string;
  skipped: boolean;
  reason?: string;
}

// 1. Email Templates in English & Danish
export const EmailTemplates = {
  invitation: {
    en: (name: string, inviteUrl: string) => ({
      subject: 'Welcome to Circle Fund - You have been invited',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #15803d; margin-top: 0;">Circle Fund</h2>
          <p>Hello ${name},</p>
          <p>You have been invited to join our community fund. Circle Fund unites members to support each other and local beneficiaries through transparent monthly contributions.</p>
          <p><strong>Monthly Contribution:</strong> 50 DKK via MobilePay</p>
          <div style="margin: 28px 0;">
            <a href="${inviteUrl}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">Accept Invitation & Join</a>
          </div>
          <p style="color: #64748b; font-size: 14px;">This invitation is personal. If you have questions, reach out to the fund administrator.</p>
        </div>
      `,
      text: `Hello ${name},\n\nYou have been invited to join Circle Fund.\nMonthly contribution: 50 DKK via MobilePay.\n\nAccept your invitation here: ${inviteUrl}\n\nCircle Fund Community`
    }),
    da: (name: string, inviteUrl: string) => ({
      subject: 'Velkommen til Circle Fund - Du er blevet inviteret',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #15803d; margin-top: 0;">Circle Fund</h2>
          <p>Hej ${name},</p>
          <p>Du er blevet inviteret til at deltage i vores fællesskabspulje. Circle Fund samler medlemmer for at støtte hinanden og lokale modtagere gennem gennemskuelige månedlige bidrag.</p>
          <p><strong>Månedligt bidrag:</strong> 50 DKK via MobilePay</p>
          <div style="margin: 28px 0;">
            <a href="${inviteUrl}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">Acceptér invitation og tilmeld dig</a>
          </div>
          <p style="color: #64748b; font-size: 14px;">Denne invitation er personlig. Har du spørgsmål, kan du kontakte administratoren.</p>
        </div>
      `,
      text: `Hej ${name},\n\nDu er blevet inviteret til Circle Fund.\nMånedligt bidrag: 50 DKK via MobilePay.\n\nAcceptér din invitation her: ${inviteUrl}\n\nCircle Fund Fællesskab`
    })
  },

  paymentReminder: {
    en: (name: string, month: string, collectorName: string, mobilePay: string) => ({
      subject: `Circle Fund: Reminder for ${month} Contribution (50 DKK)`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #15803d; margin-top: 0;">Circle Fund - Payment Reminder</h2>
          <p>Hello ${name},</p>
          <p>This is a friendly reminder that the community contribution for <strong>${month}</strong> is open.</p>
          <div style="background-color: #f8fafc; border-left: 4px solid #16a34a; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Amount:</strong> 50 DKK (minimum)</p>
            <p style="margin: 0 0 8px 0;"><strong>Collector:</strong> ${collectorName}</p>
            <p style="margin: 0;"><strong>MobilePay Number:</strong> ${mobilePay}</p>
          </div>
          <p>After transferring, please remember to visit Circle Fund to mark your payment as sent.</p>
          <p style="color: #64748b; font-size: 14px;">Thank you for continuing to support our shared mission.</p>
        </div>
      `,
      text: `Hello ${name},\n\nReminder: Circle Fund contribution for ${month} is 50 DKK.\nCollector: ${collectorName}\nMobilePay: ${mobilePay}\n\nPlease mark your payment on the portal once sent.\n\nThank you!`
    }),
    da: (name: string, month: string, collectorName: string, mobilePay: string) => ({
      subject: `Circle Fund: Påmindelse om ${month} bidrag (50 DKK)`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #15803d; margin-top: 0;">Circle Fund - Betalingspåmindelse</h2>
          <p>Hej ${name},</p>
          <p>Dette er en venlig påmindelse om, at fællesskabsbidraget for <strong>${month}</strong> er åbent.</p>
          <div style="background-color: #f8fafc; border-left: 4px solid #16a34a; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Beløb:</strong> 50 DKK (minimum)</p>
            <p style="margin: 0 0 8px 0;"><strong>Månedens indsamler:</strong> ${collectorName}</p>
            <p style="margin: 0;"><strong>MobilePay-nummer:</strong> ${mobilePay}</p>
          </div>
          <p>Når du har overført beløbet, bedes du gå til Circle Fund og markere betalingen som sendt.</p>
          <p style="color: #64748b; font-size: 14px;">Mange tak for din opbakning til vores fælles formål.</p>
        </div>
      `,
      text: `Hej ${name},\n\nPåmindelse: Circle Fund bidrag for ${month} er 50 DKK.\nIndsamler: ${collectorName}\nMobilePay: ${mobilePay}\n\nHusk at markere din betaling i portalen efter overførsel.\n\nTak for din støtte!`
    })
  },

  collectorAssigned: {
    en: (name: string, month: string) => ({
      subject: `Circle Fund: You are assigned as Collector for ${month}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #15803d; margin-top: 0;">Circle Fund - Collector Assignment</h2>
          <p>Hello ${name},</p>
          <p>You have been approved and assigned as the primary collector for <strong>${month}</strong>.</p>
          <p>During this month, fellow members will transfer their 50 DKK contributions directly to your MobilePay number. Please check your incoming payments and verify them in the Circle Fund portal.</p>
          <p>Don't forget to also record your own monthly contribution on your dashboard.</p>
        </div>
      `,
      text: `Hello ${name},\n\nYou have been assigned as collector for ${month}.\nPlease verify incoming MobilePay payments in the Circle Fund portal.\nThank you for volunteering!`
    }),
    da: (name: string, month: string) => ({
      subject: `Circle Fund: Du er udpeget som indsamler for ${month}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #15803d; margin-top: 0;">Circle Fund - Indsamlerudnævnelse</h2>
          <p>Hej ${name},</p>
          <p>Du er blevet godkendt og udpeget som primær indsamler for <strong>${month}</strong>.</p>
          <p>I løbet af måneden vil medlemmer overføre deres 50 DKK bidrag direkte til dit MobilePay-nummer. Hold øje med dine indbetalinger og bekræft dem i Circle Fund portalen.</p>
          <p>Husk også at registrere dit eget månedlige bidrag på dit betalingspanel.</p>
        </div>
      `,
      text: `Hej ${name},\n\nDu er udpeget som indsamler for ${month}.\nBekræft venligst modtagne MobilePay indbetalinger i portalen.\nTak for din frivillige indsats!`
    })
  },

  reportPublished: {
    en: (period: string, totalCollected: string, totalDistributed: string) => ({
      subject: `Circle Fund: Financial Report for ${period} Published`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #15803d; margin-top: 0;">Circle Fund - Report Published</h2>
          <p>The financial report for <strong>${period}</strong> has been verified and published.</p>
          <div style="background-color: #f8fafc; padding: 16px; margin: 20px 0; border-radius: 6px;">
            <p style="margin: 0 0 8px 0;"><strong>Total Collected:</strong> ${totalCollected} DKK</p>
            <p style="margin: 0;"><strong>Total Distributed:</strong> ${totalDistributed} DKK</p>
          </div>
          <p>You can view the full report, transparent audit figures, and download PDF or CSV summaries in the portal.</p>
        </div>
      `,
      text: `Circle Fund: Financial report for ${period} is published.\nTotal Collected: ${totalCollected} DKK\nTotal Distributed: ${totalDistributed} DKK\nView full details in the portal.`
    }),
    da: (period: string, totalCollected: string, totalDistributed: string) => ({
      subject: `Circle Fund: Finansiel rapport for ${period} er offentliggjort`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #15803d; margin-top: 0;">Circle Fund - Offentliggjort Rapport</h2>
          <p>Den økonomiske rapport for <strong>${period}</strong> er blevet godkendt og offentliggjort.</p>
          <div style="background-color: #f8fafc; padding: 16px; margin: 20px 0; border-radius: 6px;">
            <p style="margin: 0 0 8px 0;"><strong>Samlet indsamlet:</strong> ${totalCollected} DKK</p>
            <p style="margin: 0;"><strong>Samlet uddelt:</strong> ${totalDistributed} DKK</p>
          </div>
          <p>Du kan se hele rapporten, transparente revisionstal og hente PDF- eller CSV-opgørelser i portalen.</p>
        </div>
      `,
      text: `Circle Fund: Økonomisk rapport for ${period} er offentliggjort.\nSamlet indsamlet: ${totalCollected} DKK\nSamlet uddelt: ${totalDistributed} DKK\nSe alle detaljer i portalen.`
    })
  },

  otp: {
    en: (code: string, purpose: 'login' | 'signup', name?: string) => ({
      subject: `Circle Fund: ${code} is your verification code`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background-color: #15803d; color: #ffffff; width: 44px; height: 44px; line-height: 44px; border-radius: 12px; font-weight: bold; font-size: 20px;">CF</div>
            <h1 style="color: #0f172a; font-size: 22px; font-weight: 700; margin: 12px 0 4px 0;">Circle Fund</h1>
            <p style="color: #64748b; font-size: 13px; margin: 0;">Transparent Community Mutual Aid · Denmark</p>
          </div>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <p style="color: #334155; font-size: 14px; margin: 0 0 16px 0;">
              ${name ? `Hello <strong>${name}</strong>,<br/>` : ''}
              ${purpose === 'signup' ? 'Use this verification code to activate your new Circle Fund membership:' : 'Use this verification code to sign in to your Circle Fund account:'}
            </p>
            <div style="letter-spacing: 10px; font-family: ui-monospace, Menlo, Monaco, Consolas, monospace; font-size: 34px; font-weight: 800; color: #15803d; padding: 14px 24px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; display: inline-block;">
              ${code}
            </div>
            <p style="color: #64748b; font-size: 12px; margin: 18px 0 0 0;">
              ⏱ Valid for <strong>10 minutes</strong>. Do not share this code with anyone.
            </p>
          </div>
          <p style="color: #94a3b8; font-size: 12px; text-align: center; line-height: 1.5; margin: 0;">
            If you did not request this verification code, you can safely ignore this email.
          </p>
        </div>
      `,
      text: `Your Circle Fund verification code is: ${code}\nValid for 10 minutes.\nDo not share this code with anyone.\nIf you did not request this code, please ignore this email.`
    }),
    da: (code: string, purpose: 'login' | 'signup', name?: string) => ({
      subject: `Circle Fund: ${code} er din bekræftelseskode`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background-color: #15803d; color: #ffffff; width: 44px; height: 44px; line-height: 44px; border-radius: 12px; font-weight: bold; font-size: 20px;">CF</div>
            <h1 style="color: #0f172a; font-size: 22px; font-weight: 700; margin: 12px 0 4px 0;">Circle Fund</h1>
            <p style="color: #64748b; font-size: 13px; margin: 0;">Gennemskuelig fællesskabspulje · Danmark</p>
          </div>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <p style="color: #334155; font-size: 14px; margin: 0 0 16px 0;">
              ${name ? `Hej <strong>${name}</strong>,<br/>` : ''}
              ${purpose === 'signup' ? 'Brug denne bekræftelseskode til at aktivere dit nye Circle Fund medlemskab:' : 'Brug denne bekræftelseskode til at logge ind på din Circle Fund konto:'}
            </p>
            <div style="letter-spacing: 10px; font-family: ui-monospace, Menlo, Monaco, Consolas, monospace; font-size: 34px; font-weight: 800; color: #15803d; padding: 14px 24px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; display: inline-block;">
              ${code}
            </div>
            <p style="color: #64748b; font-size: 12px; margin: 18px 0 0 0;">
              ⏱ Gyldig i <strong>10 minutter</strong>. Del aldrig denne kode med andre.
            </p>
          </div>
          <p style="color: #94a3b8; font-size: 12px; text-align: center; line-height: 1.5; margin: 0;">
            Hvis du ikke har anmodet om denne bekræftelseskode, kan du se bort fra denne e-mail.
          </p>
        </div>
      `,
      text: `Din Circle Fund bekræftelseskode er: ${code}\nGyldig i 10 minutter.\nDel aldrig denne kode med andre.\nHvis du ikke har anmodet om koden, kan du ignorere denne e-mail.`
    })
  }
};

// 2. Direct Resend Dispatcher
export async function sendEmailDirect({
  to,
  subject,
  html,
  text
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<EmailDeliveryResult> {
  const isEnabled = process.env.EMAIL_ENABLED === 'true';
  const apiKey = process.env.RESEND_API_KEY;

  if (!isEnabled || !apiKey) {
    console.log(`[EMAIL SERVICE: SIMULATED] To: ${to} | Subject: ${subject}`);
    return {
      success: true,
      skipped: true,
      reason: 'Email sending is simulated (EMAIL_ENABLED=false or missing RESEND_API_KEY).',
    };
  }

  try {
    const fromAddress = process.env.EMAIL_FROM || 'Circle Fund <auth@service.nordpak.org>';
    console.log(`[EMAIL SERVICE] Sending email to ${to} via Resend...`);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to,
        subject,
        html,
        text,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('[EMAIL SERVICE] Resend API error response:', res.status, data);
      return {
        success: false,
        skipped: false,
        reason: data.message || 'Resend API rejected email dispatch',
      };
    }

    console.log(`[EMAIL SERVICE] Email sent successfully. Message ID: ${data.id}`);
    return {
      success: true,
      skipped: false,
      messageId: data.id,
    };
  } catch (error: any) {
    console.error('[EMAIL SERVICE] Network error dispatching email:', error);
    return {
      success: false,
      skipped: false,
      reason: error.message || 'Network dispatch failure',
    };
  }
}

// 3. High-level Notification Email Sender
export async function sendNotificationEmail(payload: EmailPayload): Promise<EmailDeliveryResult> {
  return sendEmailDirect({
    to: payload.to.email,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });
}

// 4. Dedicated OTP Email Sender
export async function sendOtpEmail({
  to,
  name,
  code,
  purpose,
  language = 'en',
}: {
  to: string;
  name?: string;
  code: string;
  purpose: 'login' | 'signup';
  language?: 'en' | 'da';
}): Promise<EmailDeliveryResult> {
  const templateBuilder = EmailTemplates.otp[language] || EmailTemplates.otp.en;
  const { subject, html, text } = templateBuilder(code, purpose, name);

  return sendEmailDirect({
    to,
    subject,
    html,
    text,
  });
}
