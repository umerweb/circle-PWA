const { Client } = require('pg');

const dbPass = process.env.db_pass || 'Umer@20841234';
const host = process.env.DB_HOST || 'aws-1-ap-south-1.pooler.supabase.com';
const port = parseInt(process.env.DB_PORT || '5432');
const user = process.env.DB_USER || 'postgres.qsizzlodkoocbmiudwxh';
const database = process.env.DB_NAME || 'postgres';

const danishNames = [
  'Lars Nielsen', 'Mette Jensen', 'Frederik Hansen', 'Sofia Christensen', 'Christian Møller',
  'Emma Andersen', 'Mikkel Pedersen', 'Ida Poulsen', 'Jonas Larsen', 'Astrid Thomsen',
  'Peter Rasmussen', 'Camilla Sørensen', 'Thomas Olesen', 'Sara Kristensen', 'Mads Johansen',
  'Julie Lund', 'Rasmus Holm', 'Anna Vestergaard', 'Simon Schmidt', 'Freja Bruun',
  'Anders Simonsen', 'Laura Henriksen', 'Jakob Kristiansen', 'Signe Clausen', 'Emil Mortensen',
  'Mathilde Bech', 'Magnus Friis', 'Cecilie Overgaard', 'Alexander Dam', 'Karla Frost',
  'Kasper Toft', 'Nanna Ravn', 'Oliver Winther', 'Katrine Bjerre', 'Victor Kofoed',
  'Alberte Dahl', 'Lucas Bach', 'Clara Krog', 'Benjamin Lind', 'Lærke Sondergaard'
];

async function seed() {
  console.log('Seeding initial Circle Fund data...');
  const client = new Client({
    host,
    port,
    user,
    password: dbPass,
    database,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // 1. Admin Profile
    const adminEmail = 'umer.web2@gmail.com';
    const adminRes = await client.query(`
      INSERT INTO public.profiles (email, full_name, phone, role, status, is_demo, preferred_language, notes)
      VALUES ($1, $2, $3, 'admin', 'active', false, 'en', 'Initial Super Administrator')
      ON CONFLICT (email) DO UPDATE SET role = 'admin', status = 'active'
      RETURNING id, email, role;
    `, [adminEmail, 'Administrator (Umer)', '+45 00 00 00 00']);

    const adminId = adminRes.rows[0].id;
    console.log(`Admin profile ready: ${adminEmail} (ID: ${adminId})`);

    // 2. 40 Dummy Members
    console.log('Upserting 40 demo members...');
    const memberIds = [];

    for (let i = 1; i <= 40; i++) {
      const danishName = danishNames[i - 1] || `Danish Name ${i}`;
      const fullName = `Demo Member ${i} - ${danishName}`;
      const email = `demo.member${i}@circlefund.internal`;
      const phone = `+45 20 ${String(100000 + i).slice(1)}`;
      const mobilepay = phone;

      const res = await client.query(`
        INSERT INTO public.profiles (email, full_name, phone, mobilepay_number, role, status, is_demo, preferred_language, notes)
        VALUES ($1, $2, $3, $4, 'member', 'active', true, $5, $6)
        ON CONFLICT (email) DO UPDATE SET 
          full_name = EXCLUDED.full_name,
          phone = EXCLUDED.phone,
          mobilepay_number = EXCLUDED.mobilepay_number,
          is_demo = true
        RETURNING id;
      `, [email, fullName, phone, mobilepay, i % 2 === 0 ? 'da' : 'en', `Demo placeholder record #${i}`]);

      memberIds.push({ id: res.rows[0].id, name: fullName });
    }
    console.log(`Successfully seeded ${memberIds.length} demo members.`);

    // Set Demo Member 1 as collector for November 2026
    const collectorMember = memberIds[0];
    await client.query(`
      UPDATE public.profiles 
      SET role = 'collector', mobilepay_number = '+45 52 34 56 78' 
      WHERE id = $1;
    `, [collectorMember.id]);

    // 3. Current Monthly Fund: November 2026
    const fundMonth = 11;
    const fundYear = 2026;
    const fundTitle = 'November 2026';
    const targetAmount = 40 * 50.00; // 2000 DKK

    const fundRes = await client.query(`
      INSERT INTO public.monthly_funds (
        month, year, title, collector_id, target_amount, collected_amount, 
        min_contribution, status, payment_instructions, mobilepay_number
      )
      VALUES ($1, $2, $3, $4, $5, 0.00, 50.00, 'active', $6, $7)
      ON CONFLICT (year, month) DO UPDATE SET
        collector_id = EXCLUDED.collector_id,
        target_amount = EXCLUDED.target_amount,
        status = 'active',
        payment_instructions = EXCLUDED.payment_instructions,
        mobilepay_number = EXCLUDED.mobilepay_number
      RETURNING id;
    `, [
      fundMonth, fundYear, fundTitle, collectorMember.id, targetAmount,
      'Overfør venligst mindst 50 DKK via MobilePay til månedens indsamler. Angiv note: CF-NOV-[DitNavn].',
      '+45 52 34 56 78'
    ]);

    const fundId = fundRes.rows[0].id;
    console.log(`Monthly fund created/updated: ${fundTitle} (ID: ${fundId})`);

    // 4. Seed Contributions for this month
    // Distribution:
    // - Collector (Demo Member 1): confirmed (collector's own contribution)
    // - Demo Members 2..15: confirmed (paid 50 DKK, verified by collector)
    // - Demo Members 16..22: reported (member marked as sent, pending verification)
    // - Demo Members 23..40: pending
    let totalCollected = 0.00;

    for (let i = 0; i < memberIds.length; i++) {
      const member = memberIds[i];
      const isCollector = (i === 0);
      let status = 'pending';
      let amount = 50.00;
      let reportedAt = null;
      let confirmedAt = null;
      let confirmedBy = null;
      let paymentRef = null;

      if (isCollector) {
        status = 'confirmed';
        amount = 50.00;
        reportedAt = new Date();
        confirmedAt = new Date();
        confirmedBy = collectorMember.id;
        paymentRef = 'COLLECTOR-SELF-CONTRIBUTION-NOV';
        totalCollected += amount;
      } else if (i >= 1 && i <= 14) {
        status = 'confirmed';
        amount = (i === 5) ? 100.00 : 50.00; // member 5 generously contributed 100 DKK
        reportedAt = new Date(Date.now() - 3 * 86400000);
        confirmedAt = new Date(Date.now() - 2 * 86400000);
        confirmedBy = collectorMember.id;
        paymentRef = `MP-TXN-${100000 + i}`;
        totalCollected += amount;
      } else if (i >= 15 && i <= 21) {
        status = 'reported';
        amount = 50.00;
        reportedAt = new Date(Date.now() - 86400000);
        paymentRef = `MP-MEMBER-SENT-${200000 + i}`;
      } else {
        status = 'pending';
        amount = 50.00;
      }

      await client.query(`
        INSERT INTO public.contributions (
          fund_id, member_id, amount, status, is_collector_contribution, 
          reported_at, confirmed_at, confirmed_by, payment_reference, member_note
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (fund_id, member_id) DO UPDATE SET
          amount = EXCLUDED.amount,
          status = EXCLUDED.status,
          is_collector_contribution = EXCLUDED.is_collector_contribution,
          reported_at = EXCLUDED.reported_at,
          confirmed_at = EXCLUDED.confirmed_at,
          confirmed_by = EXCLUDED.confirmed_by,
          payment_reference = EXCLUDED.payment_reference;
      `, [
        fundId, member.id, amount, status, isCollector,
        reportedAt, confirmedAt, confirmedBy, paymentRef,
        status === 'reported' ? 'Overført via MobilePay i dag' : null
      ]);
    }

    // Update collected_amount on monthly_funds
    await client.query(`
      UPDATE public.monthly_funds
      SET collected_amount = $1
      WHERE id = $2;
    `, [totalCollected, fundId]);

    console.log(`Seeded contributions: ${totalCollected} DKK confirmed.`);

    // 5. Seed Beneficiaries
    const ben1 = await client.query(`
      INSERT INTO public.beneficiaries (
        full_name, alias_name, category, reason, is_anonymous, contact_info, total_allocated, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT DO NOTHING
      RETURNING id;
    `, [
      'Familie Jensen (Odense)', 'Community Family #1', 'medical',
      'Akut medicinsk støtte og genoptræning efter hospitalsophold for enlig forælder.',
      true, 'Tlf: +45 60 00 11 22 (fortrolig kontaktperson)', 800.00, adminId
    ]);

    const ben2 = await client.query(`
      INSERT INTO public.beneficiaries (
        full_name, alias_name, category, reason, is_anonymous, contact_info, total_allocated, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT DO NOTHING
      RETURNING id;
    `, [
      'Ungdommens Uddannelsesstøtte', 'Youth Education Fund', 'education',
      'Støtte til bøger, studiematerialer og transport for trængte unge studerende i netværket.',
      false, 'kontakt@uddannelse-circle.dk', 500.00, adminId
    ]);

    // 6. Seed Sample Distribution
    const benId = ben1.rows[0]?.id;
    if (benId) {
      await client.query(`
        INSERT INTO public.distributions (
          fund_id, beneficiary_id, amount, distribution_date, category, description, evidence_reference, recorded_by
        )
        VALUES ($1, $2, 800.00, CURRENT_DATE, 'medical', 'Medicintilskud og transportbistand', 'KVIT-2026-MED-041', $3);
      `, [fundId, benId, adminId]);
      console.log('Sample distribution recorded.');
    }

    // 7. Seed Collector Volunteers for upcoming month (December 2026)
    await client.query(`
      INSERT INTO public.collector_volunteers (
        member_id, target_month, target_year, mobilepay_number, notes, status
      )
      VALUES 
        ($1, 12, 2026, '+45 22 33 44 55', 'Jeg vil meget gerne hjælpe fællesskabet i december.', 'pending'),
        ($2, 12, 2026, '+45 33 44 55 66', 'Klar til at overtage indsamlingen næste måned.', 'pending');
    `, [memberIds[1].id, memberIds[2].id]);
    console.log('Sample collector volunteers seeded for December 2026.');

    // 8. Seed Audit Log entry
    await client.query(`
      INSERT INTO public.audit_logs (action, entity_type, entity_id, actor_id, actor_email, details)
      VALUES ('SYSTEM_INIT', 'SYSTEM', 'bootstrap', $1, $2, $3);
    `, [adminId, adminEmail, JSON.stringify({ event: 'Initial Circle Fund bootstrap migration and seed', totalDemoMembers: 40 })]);

    // 9. Seed System Notifications
    await client.query(`
      INSERT INTO public.notifications (
        recipient_id, title_en, title_da, message_en, message_da, type, link
      )
      VALUES 
        (NULL, 'November Collection Open', 'November indsamling er åben', 'The monthly contribution of 50 DKK is now open. Support your community today.', 'Månedens bidrag på 50 DKK er nu åbent. Støt dit fællesskab i dag via MobilePay.', 'collection_opened', '/fund'),
        (NULL, 'Collector Assigned', 'Månedens indsamler udpeget', 'Demo Member 1 has been assigned as collector for November 2026.', 'Demo Member 1 er udpeget som indsamler for november 2026.', 'collector_assigned', '/fund');
    `);

    console.log('Circle Fund seed completed successfully!');
    await client.end();
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
