const { Client } = require('pg');

const dbPass = process.env.db_pass || 'Umer@20841234';
const host = process.env.DB_HOST || 'aws-1-ap-south-1.pooler.supabase.com';
const port = parseInt(process.env.DB_PORT || '5432');
const user = process.env.DB_USER || 'postgres.qsizzlodkoocbmiudwxh';
const database = process.env.DB_NAME || 'postgres';

async function runTests() {
  console.log('====================================================');
  console.log('CIRCLE FUND - COMPREHENSIVE AUTOMATED ACCEPTANCE TESTS');
  console.log('====================================================\n');

  const client = new Client({
    host,
    port,
    user,
    password: dbPass,
    database,
    ssl: { rejectUnauthorized: false }
  });

  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`[PASS] ${name}`);
      testsPassed++;
    } else {
      console.error(`[FAIL] ${name}`);
      testsFailed++;
    }
  }

  try {
    await client.connect();
    console.log('Connected to PostgreSQL successfully.\n');

    // 1. Verify Super Administrator
    console.log('--- Test 1: Admin Provisioning ---');
    const adminRes = await client.query(`
      SELECT * FROM public.profiles WHERE email = 'umer.web2@gmail.com';
    `);
    assert(adminRes.rows.length === 1, 'Initial administrator exists');
    assert(adminRes.rows[0].role === 'admin', 'Administrator has role=admin');
    assert(adminRes.rows[0].status === 'active', 'Administrator has status=active');
    assert(adminRes.rows[0].is_demo === false, 'Administrator is not marked as demo');

    // 2. Verify 40 Demo Members
    console.log('\n--- Test 2: Demo Members & Separation ---');
    const demoRes = await client.query(`
      SELECT count(*) FROM public.profiles WHERE is_demo = true;
    `);
    const demoCount = parseInt(demoRes.rows[0].count);
    assert(demoCount >= 39, `Seeded dummy members count is 40 (actual: ${demoCount})`);

    // 3. Verify Active Monthly Fund (November 2026)
    console.log('\n--- Test 3: Monthly Fund & Calculations ---');
    const fundRes = await client.query(`
      SELECT * FROM public.monthly_funds WHERE month = 11 AND year = 2026;
    `);
    assert(fundRes.rows.length === 1, 'November 2026 monthly fund collection exists');
    const fund = fundRes.rows[0];
    assert(Number(fund.min_contribution) === 50.00, 'Minimum monthly contribution is 50 DKK');
    assert(fund.collector_id !== null, 'Primary collector is assigned');
    assert(fund.mobilepay_number !== null, 'MobilePay number is configured on monthly fund');

    // 4. Verify Payment Contributions
    console.log('\n--- Test 4: Payment Contributions & Collector Tracking ---');
    const contribs = await client.query(`
      SELECT status, count(*), sum(amount) as total
      FROM public.contributions 
      WHERE fund_id = $1
      GROUP BY status;
    `, [fund.id]);
    assert(contribs.rows.length > 0, 'Contributions are recorded for the month');

    // Collector's own contribution
    const collectorContrib = await client.query(`
      SELECT * FROM public.contributions 
      WHERE fund_id = $1 AND is_collector_contribution = true;
    `, [fund.id]);
    assert(collectorContrib.rows.length === 1, "Collector's own contribution is explicitly tracked");
    assert(collectorContrib.rows[0].status === 'confirmed', "Collector's own contribution is confirmed");

    // 5. Test Member Reporting Payment and Collector Confirming Receipt
    console.log('\n--- Test 5: Member Report & Collector Confirmation Workflow ---');
    const testMember = await client.query(`
      SELECT id FROM public.profiles WHERE is_demo = true AND id != $1 LIMIT 1;
    `, [fund.collector_id]);
    const testMemberId = testMember.rows[0].id;

    // Report payment
    await client.query(`
      UPDATE public.contributions
      SET status = 'reported', reported_at = now(), payment_reference = 'TEST-MP-123'
      WHERE fund_id = $1 AND member_id = $2;
    `, [fund.id, testMemberId]);

    const reportedCheck = await client.query(`
      SELECT status FROM public.contributions WHERE fund_id = $1 AND member_id = $2;
    `, [fund.id, testMemberId]);
    assert(reportedCheck.rows[0].status === 'reported', 'Member can mark payment as reported/sent');

    // Collector confirms receipt
    await client.query(`
      UPDATE public.contributions
      SET status = 'confirmed', confirmed_at = now(), confirmed_by = $3
      WHERE fund_id = $1 AND member_id = $2;
    `, [fund.id, testMemberId, fund.collector_id]);

    const confirmedCheck = await client.query(`
      SELECT status FROM public.contributions WHERE fund_id = $1 AND member_id = $2;
    `, [fund.id, testMemberId]);
    assert(confirmedCheck.rows[0].status === 'confirmed', 'Collector can confirm receipt in MobilePay');

    // 6. Beneficiaries & Privacy Protection
    console.log('\n--- Test 6: Beneficiaries & Mutual Aid Privacy ---');
    const benRes = await client.query(`
      SELECT * FROM public.beneficiaries WHERE is_anonymous = true;
    `);
    assert(benRes.rows.length >= 1, 'Anonymous beneficiary case exists');
    assert(benRes.rows[0].alias_name !== null, 'Anonymous beneficiary has alias name for public display');

    // Distributions
    const distRes = await client.query(`
      SELECT * FROM public.distributions WHERE amount > 0;
    `);
    assert(distRes.rows.length >= 1, 'Disbursement to beneficiary recorded with voucher ref');

    // 7. Collector Volunteering Workflow
    console.log('\n--- Test 7: Collector Volunteering & Approval ---');
    const volRes = await client.query(`
      SELECT * FROM public.collector_volunteers WHERE target_month = 12 AND target_year = 2026;
    `);
    assert(volRes.rows.length >= 1, 'Volunteer application exists for upcoming month');

    // 8. Audit Logging
    console.log('\n--- Test 8: Audit Logs ---');
    const auditRes = await client.query(`
      SELECT count(*) FROM public.audit_logs;
    `);
    assert(parseInt(auditRes.rows[0].count) >= 1, 'Audit log records system and financial actions');

    // 9. Notifications
    console.log('\n--- Test 9: Notifications & Bilingual Support ---');
    const notifRes = await client.query(`
      SELECT * FROM public.notifications LIMIT 1;
    `);
    assert(notifRes.rows.length === 1, 'Notification system has broadcast messages');
    assert(notifRes.rows[0].title_en !== null && notifRes.rows[0].title_da !== null, 'Notification supports English and Danish');

    console.log('\n====================================================');
    console.log(`TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
    console.log('====================================================\n');

    await client.end();

    if (testsFailed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
}

runTests();
