const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://sxdswqgoqgvkmdknqzir.supabase.co',
  'sb_publishable_7_PN5q0F5n9wdnnSm4xiLQ_vHEftQL9'
);

async function test() {
  // Test insert
  const { data: insertData, error: insertError } = await supabase
    .from('past_seasons')
    .insert({
      season_number: 2,
      start_date: '2026-05-17',
      end_date: '2026-07-05',
      days_count: 49,
    })
    .select();

  console.log('INSERT result:', insertData, 'error:', insertError);

  if (!insertError) {
    // Clean up
    await supabase.from('past_seasons').delete().eq('id', insertData[0].id);
    console.log('Cleanup done');
  }
}

test().catch(console.error);
