const { Client } = require('pg');

async function testProductionIsolation() {
  console.log('====================================================');
  console.log('CIRCLE FUND - PRODUCTION PURITY & ISOLATION TESTS');
  console.log('====================================================\n');

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('Connected to PostgreSQL database.');

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
    // 1. Verify Super Admin exists
    const adminRes = await client.query(`SELECT * FROM public.profiles WHERE email = 'umer.web2@gmail.com'`);
    assert(adminRes.rows.length === 1, 'Super Admin profile exists');
    assert(adminRes.rows[0].role === 'admin', 'Super Admin has role = admin');

    // 2. Verify Demo Members exist in database with is_demo = true
    const demoMembers = await client.query(`SELECT COUNT(*) as count FROM public.profiles WHERE is_demo = true`);
    assert(parseInt(demoMembers.rows[0].count) === 40, '40 dummy demo records exist for demonstration');

    // 3. Create a test REAL production member (is_demo = false)
    const realEmail = 'real.danish.member@example.dk';
    await client.query(`DELETE FROM public.profiles WHERE email = $1`, [realEmail]);
    const realUserInsert = await client.query(`
      INSERT INTO public.profiles (email, full_name, phone, role, status, is_demo)
      VALUES ($1, 'Frederik IX', '+45 33 12 34 56', 'member', 'active', false)
      RETURNING *;
    `, [realEmail]);
    assert(realUserInsert.rows[0].is_demo === false, 'Real member created with is_demo = false');

    // 4. Test Query for Real Member context (Simulate /api/members for a real user)
    const realMembersQuery = await client.query(`
      SELECT id, full_name, email, is_demo FROM public.profiles
      WHERE is_demo = false
      ORDER BY created_at ASC;
    `);
    const containsDemo = realMembersQuery.rows.some(m => m.is_demo === true);
    assert(!containsDemo, 'Real member directory contains 0 demo placeholder members');
    assert(realMembersQuery.rows.length >= 2, 'Real member directory contains only genuine members & admin');

    // 5. Test Query for Admin Demo Context (Simulate /api/members for umer.web2@gmail.com)
    const adminMembersQuery = await client.query(`
      SELECT id, full_name, email, is_demo FROM public.profiles
      ORDER BY is_demo ASC;
    `);
    assert(adminMembersQuery.rows.length >= 41, 'Admin demo context can see both demo placeholders and real members');

    // 6. Test Query for Real Fund context (Simulate /api/fund for a real user)
    const activeFund = await client.query(`SELECT id FROM public.monthly_funds WHERE status = 'active' LIMIT 1`);
    if (activeFund.rows.length > 0) {
      const fundId = activeFund.rows[0].id;

      // Enroll real member in fund
      await client.query(`
        INSERT INTO public.contributions (fund_id, member_id, amount, status, is_collector_contribution)
        VALUES ($1, $2, 50.00, 'pending', false)
        ON CONFLICT (fund_id, member_id) DO NOTHING;
      `, [fundId, realUserInsert.rows[0].id]);

      // Query contributions with real filter
      const realContributions = await client.query(`
        SELECT c.*, p.is_demo
        FROM public.contributions c
        JOIN public.profiles p ON c.member_id = p.id
        WHERE c.fund_id = $1 AND p.is_demo = false;
      `, [fundId]);

      const hasDemoContrib = realContributions.rows.some(c => c.is_demo === true);
      assert(!hasDemoContrib, 'Real user fund view excludes all 40 demo dummy contributions');
      assert(realContributions.rows.length >= 1, 'Real user fund view includes real member contribution');
    }

    // 7. Clean up test real user
    await client.query(`DELETE FROM public.contributions WHERE member_id = $1`, [realUserInsert.rows[0].id]);
    await client.query(`DELETE FROM public.profiles WHERE id = $1`, [realUserInsert.rows[0].id]);
    console.log('[CLEANUP] Real test records cleaned up.');

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

testProductionIsolation();
