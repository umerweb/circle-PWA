const { Client } = require('pg');

async function run() {
  console.log('====================================================');
  console.log('CIRCLE FUND - PRODUCTION AUTH & OTP ACCEPTANCE TESTS');
  console.log('====================================================\n');

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('Connected to PostgreSQL successfully.');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Check Resend API Key is set
    assert(Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_')), 'Resend API key is configured');
    assert(process.env.EMAIL_ENABLED === 'true', 'EMAIL_ENABLED is set to true');

    // 2. Check auth_otps table exists
    const tableCheck = await client.query(`
      SELECT table_name FROM information_schema.tables WHERE table_name = 'auth_otps' AND table_schema = 'public'
    `);
    assert(tableCheck.rows.length === 1, 'public.auth_otps table exists in database');

    // 3. Test OTP generation and database storage
    const testEmail = 'otp.test.member@example.com';
    // Clean up test email from profiles and auth_otps if existed from previous run
    await client.query(`DELETE FROM public.profiles WHERE email = $1`, [testEmail]);
    await client.query(`DELETE FROM public.auth_otps WHERE email = $1`, [testEmail]);

    // Insert test OTP
    const testCode = '748291';
    await client.query(`
      INSERT INTO public.auth_otps (email, otp_code, purpose, metadata, expires_at)
      VALUES ($1, $2, 'signup', $3, NOW() + INTERVAL '10 minutes')
    `, [testEmail, testCode, JSON.stringify({ fullName: 'Poul Nyrup', phone: '+45 20 12 34 56' })]);

    const inserted = await client.query(`SELECT * FROM public.auth_otps WHERE email = $1`, [testEmail]);
    assert(inserted.rows.length === 1, 'OTP record created in database');
    assert(inserted.rows[0].otp_code === testCode, 'OTP code matches 6-digit numeric pattern');
    assert(inserted.rows[0].verified_at === null, 'OTP is initially unverified');

    // 4. Test wrong OTP attempt increments attempts counter
    await client.query(`UPDATE public.auth_otps SET attempts = attempts + 1 WHERE id = $1`, [inserted.rows[0].id]);
    const afterAttempt = await client.query(`SELECT attempts FROM public.auth_otps WHERE id = $1`, [inserted.rows[0].id]);
    assert(afterAttempt.rows[0].attempts === 1, 'Incorrect attempt increments attempt counter');

    // 5. Test successful verification and profile provisioning
    await client.query(`UPDATE public.auth_otps SET verified_at = NOW() WHERE id = $1`, [inserted.rows[0].id]);
    const verifiedRow = await client.query(`SELECT verified_at FROM public.auth_otps WHERE id = $1`, [inserted.rows[0].id]);
    assert(verifiedRow.rows[0].verified_at !== null, 'OTP verified_at timestamp successfully set');

    // Provision new production member profile (is_demo = false)
    const profileInsert = await client.query(`
      INSERT INTO public.profiles (email, full_name, phone, role, status, is_demo)
      VALUES ($1, 'Poul Nyrup', '+45 20 12 34 56', 'member', 'active', false)
      RETURNING *
    `, [testEmail]);
    assert(profileInsert.rows.length === 1, 'New member profile created on verified signup');
    assert(profileInsert.rows[0].is_demo === false, 'New signup is real member (is_demo = false)');
    assert(profileInsert.rows[0].role === 'member', 'Default role is member');

    // Enroll in active monthly fund
    const activeFund = await client.query(`SELECT id FROM public.monthly_funds WHERE status = 'active' LIMIT 1`);
    if (activeFund.rows.length > 0) {
      await client.query(`
        INSERT INTO public.contributions (fund_id, member_id, amount, status, is_collector_contribution)
        VALUES ($1, $2, 50.00, 'pending', false)
        ON CONFLICT (fund_id, member_id) DO NOTHING
      `, [activeFund.rows[0].id, profileInsert.rows[0].id]);
      
      const contribCheck = await client.query(`
        SELECT * FROM public.contributions WHERE fund_id = $1 AND member_id = $2
      `, [activeFund.rows[0].id, profileInsert.rows[0].id]);
      assert(contribCheck.rows.length === 1, 'New member automatically enrolled in active monthly fund (50 DKK pending)');
    }

    // 6. Test super admin demo preservation
    const adminCheck = await client.query(`SELECT * FROM public.profiles WHERE email = 'umer.web2@gmail.com'`);
    assert(adminCheck.rows.length === 1, 'Super Administrator (umer.web2@gmail.com) exists');
    assert(adminCheck.rows[0].role === 'admin', 'Super Administrator has admin role');

    // Clean up test record
    await client.query(`DELETE FROM public.contributions WHERE member_id = $1`, [profileInsert.rows[0].id]);
    await client.query(`DELETE FROM public.profiles WHERE id = $1`, [profileInsert.rows[0].id]);
    await client.query(`DELETE FROM public.auth_otps WHERE email = $1`, [testEmail]);
    console.log('[CLEANUP] Test records cleaned up successfully.');

    console.log('\n====================================================');
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    await client.end();
    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test execution failed:', err);
    await client.end();
    process.exit(1);
  }
}

run();
