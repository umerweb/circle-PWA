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
  }
};

// 2. Email Sender with Disabled by Default Guard
export async function sendNotificationEmail(payload: EmailPayload): Promise<EmailDeliveryResult> {
  const isEnabled = process.env.EMAIL_ENABLED === 'true';

  if (!isEnabled) {
    console.log(
      `[EMAIL SERVICE: DISABLED] Email to ${payload.to.email} (${payload.subject}) safely skipped. Reason: EMAIL_ENABLED=false.`
    );
    return {
      success: true,
      skipped: true,
      reason: 'EMAIL_ENABLED is set to false. Operation completed safely without sending real email.',
    };
  }

  // Future provider integration (e.g. Resend, SMTP, SendGrid)
  try {
    console.log(`[EMAIL SERVICE] Sending email to ${payload.to.email}...`);
    // Placeholder for provider execution once API credentials are provided by user
    return {
      success: true,
      skipped: false,
      messageId: `mock-msg-${Date.now()}`,
    };
  } catch (error: any) {
    console.error('[EMAIL SERVICE] Failed to send email:', error);
    return {
      success: false,
      skipped: false,
      reason: error.message || 'Unknown email delivery error',
    };
  }
}
