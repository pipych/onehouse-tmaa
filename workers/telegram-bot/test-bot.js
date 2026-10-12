// Automated verification of Telegram Bot Handler with Bot API 10.3 Rich Messages & Rich Buttons
import worker from './src/index.ts';

async function runTests() {
  console.log('🧪 Starting Telegram Bot automated verification...');

  // Mock environment
  const mockEnv = {
    BOT_TOKEN: '123456789:MOCK_TOKEN_FOR_TESTS',
    MINI_APP_URL: 'https://onelaunch.pp.ua/',
  };

  // Intercept fetch calls to api.telegram.org
  const originalFetch = globalThis.fetch;
  const sentRequests = [];

  globalThis.fetch = async (url, options) => {
    if (typeof url === 'string' && url.includes('api.telegram.org')) {
      const body = options?.body ? JSON.parse(options.body) : null;
      sentRequests.push({ url, method: options?.method, body });
      return new Response(JSON.stringify({ ok: true, result: { message_id: 123 } }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return originalFetch(url, options);
  };

  try {
    // 1. Test Dashboard GET /
    console.log('Test 1: GET / (Dashboard)');
    const dashRes = await worker.fetch(new Request('https://worker.test/'), mockEnv);
    if (dashRes.status !== 200) throw new Error(`GET / returned status ${dashRes.status}`);
    const dashHtml = await dashRes.text();
    if (!dashHtml.includes('OneApp Telegram Bot')) throw new Error('Dashboard HTML missing title');
    console.log('✓ Test 1 Passed: Dashboard rendered');

    // 2. Test /app command (Compact Inline Button, delete user message & store bot message)
    console.log('Test 2: POST /webhook with /app (Inline button with custom emoji & message deletion)');
    sentRequests.length = 0;
    let nextMsgId = 100;
    globalThis.fetch = async (url, options) => {
      if (typeof url === 'string' && url.includes('api.telegram.org')) {
        const body = options?.body ? JSON.parse(options.body) : null;
        const assignedId = nextMsgId++;
        sentRequests.push({ url, method: options?.method, body, responseMessageId: assignedId });
        return new Response(JSON.stringify({ ok: true, result: { message_id: assignedId } }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return originalFetch(url, options);
    };

    const appUpdate = {
      update_id: 1001,
      message: {
        message_id: 50,
        chat: { id: 777, type: 'private' },
        from: { id: 777, is_bot: false, first_name: 'TestUser' },
        text: '/app',
      },
    };
    const appRes = await worker.fetch(
      new Request('https://worker.test/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appUpdate),
      }),
      mockEnv
    );
    if (appRes.status !== 200) throw new Error(`/app returned ${appRes.status}`);
    
    // Check that sendMessage was called AND deleteMessage for user message 50 was called
    const sendReq = sentRequests.find((r) => r.url.endsWith('/sendMessage'));
    if (!sendReq) throw new Error('Expected /sendMessage call');
    const deleteUserReq = sentRequests.find((r) => r.url.endsWith('/deleteMessage') && r.body?.message_id === 50);
    if (!deleteUserReq) throw new Error('Expected user command message (id 50) to be deleted');
    console.log('✓ Test 2 Passed: /app sent message and deleted user message 50');

    // 3. Test /all command & duplicate message deletion
    console.log('Test 3: POST /webhook with /all (Rich Message with 3 colored buttons & duplicate deletion)');
    sentRequests.length = 0;
    // Call /all first time (message_id 60)
    await worker.fetch(
      new Request('https://worker.test/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          update_id: 1002,
          message: {
            message_id: 60,
            chat: { id: 777, type: 'private' },
            from: { id: 777, is_bot: false, first_name: 'TestUser' },
            text: '/all',
          },
        }),
      }),
      mockEnv
    );
    const firstAllReq = sentRequests.find((r) => r.url.endsWith('/sendRichMessage'));
    if (!firstAllReq) throw new Error('Expected /sendRichMessage call on first /all');
    const firstAllBotMsgId = firstAllReq.responseMessageId; // exact bot message ID returned
    // Check user msg 60 was deleted
    const deleteFirstAllUserReq = sentRequests.find((r) => r.url.endsWith('/deleteMessage') && r.body?.message_id === 60);
    if (!deleteFirstAllUserReq) throw new Error('Expected user command message 60 to be deleted');

    // Now call /all second time (message_id 61)
    sentRequests.length = 0;
    await worker.fetch(
      new Request('https://worker.test/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          update_id: 1003,
          message: {
            message_id: 61,
            chat: { id: 777, type: 'private' },
            from: { id: 777, is_bot: false, first_name: 'TestUser' },
            text: '/all',
          },
        }),
      }),
      mockEnv
    );
    // Verify previous bot /all message was deleted!
    const deletePrevBotAll = sentRequests.find((r) => r.url.endsWith('/deleteMessage') && r.body?.message_id === firstAllBotMsgId);
    if (!deletePrevBotAll) {
      throw new Error(`Expected previous bot /all message (${firstAllBotMsgId}) to be deleted on duplicate /all call`);
    }
    // Verify user msg 61 was deleted
    const deleteSecondAllUserReq = sentRequests.find((r) => r.url.endsWith('/deleteMessage') && r.body?.message_id === 61);
    if (!deleteSecondAllUserReq) throw new Error('Expected user command message 61 to be deleted');
    console.log('✓ Test 3 Passed: /all sent Rich Message, deleted previous bot /all message and user message');

    // 4. Test distinct command does NOT delete /all (only identical messages deleted)
    console.log('Test 4: POST /webhook with /app does NOT delete bot /all message');
    sentRequests.length = 0;
    await worker.fetch(
      new Request('https://worker.test/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          update_id: 1004,
          message: {
            message_id: 70,
            chat: { id: 777, type: 'private' },
            from: { id: 777, is_bot: false, first_name: 'TestUser' },
            text: '/app',
          },
        }),
      }),
      mockEnv
    );
    const deleteCallCheck = sentRequests.find((r) => r.url.endsWith('/deleteMessage') && r.body?.message_id === nextMsgId - 2);
    // nextMsgId - 2 was the second /all message, which must NOT be deleted by /app
    const secondAllMsgId = nextMsgId - 2;
    const deletedSecondAll = sentRequests.some((r) => r.url.endsWith('/deleteMessage') && r.body?.message_id === secondAllMsgId);
    if (deletedSecondAll) {
      throw new Error('Distinct command /app should NOT delete previous /all bot message!');
    }
    console.log('✓ Test 4 Passed: Only identical bot messages are deleted, different commands remain untouched');

    // 5. Test Group & Forum Topics Authorization (https://t.me/c/2997374585/35 & /1702)
    console.log('Test 5: Forum Topics: Topic 35 allowed, Topic 1702 ignored, other groups ignored');
    const targetGroupId = -1002997374585;

    // 5a. Topic 35 in Target Group (ALLOWED, message_thread_id must be 35)
    sentRequests.length = 0;
    const topic35Res = await worker.fetch(
      new Request('https://worker.test/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          update_id: 1005,
          message: {
            message_id: 80,
            message_thread_id: 35,
            chat: { id: targetGroupId, type: 'supergroup', title: 'Target Forum' },
            from: { id: 777, is_bot: false, first_name: 'TopicUser' },
            text: '/all',
          },
        }),
      }),
      mockEnv
    );
    if (topic35Res.status !== 200) throw new Error(`Topic 35 returned status ${topic35Res.status}`);
    const topic35Req = sentRequests.find((r) => r.url.endsWith('/sendRichMessage'));
    if (!topic35Req || topic35Req.body?.message_thread_id !== 35) {
      throw new Error(`Expected message_thread_id 35 on topic 35 response, got: ${JSON.stringify(topic35Req?.body)}`);
    }
    console.log('✓ Test 5a Passed: Target Group topic 35 successfully handled with message_thread_id: 35');

    // 5b. Topic 1702 in Target Group (IGNORED - reserved for future features)
    sentRequests.length = 0;
    const topic1702Res = await worker.fetch(
      new Request('https://worker.test/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          update_id: 1006,
          message: {
            message_id: 81,
            message_thread_id: 1702,
            chat: { id: targetGroupId, type: 'supergroup', title: 'Target Forum' },
            from: { id: 777, is_bot: false, first_name: 'TopicUser' },
            text: '/all',
          },
        }),
      }),
      mockEnv
    );
    const topic1702Json = await topic1702Res.json();
    if (topic1702Json.status !== 'ignored_unauthorized_chat_or_topic') {
      throw new Error(`Topic 1702 should be ignored, got: ${JSON.stringify(topic1702Json)}`);
    }
    if (sentRequests.length > 0) {
      throw new Error(`Topic 1702 should not send any requests, sent: ${sentRequests.length}`);
    }
    console.log('✓ Test 5b Passed: Topic 1702 is ignored (reserved for future features)');

    // 5c. General or unknown topic in Target Group (IGNORED)
    sentRequests.length = 0;
    const topicOtherRes = await worker.fetch(
      new Request('https://worker.test/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          update_id: 1007,
          message: {
            message_id: 82,
            message_thread_id: 999,
            chat: { id: targetGroupId, type: 'supergroup', title: 'Target Forum' },
            from: { id: 777, is_bot: false, first_name: 'TopicUser' },
            text: '/app',
          },
        }),
      }),
      mockEnv
    );
    const topicOtherJson = await topicOtherRes.json();
    if (topicOtherJson.status !== 'ignored_unauthorized_chat_or_topic') {
      throw new Error(`Unauthorized topic should be ignored: ${JSON.stringify(topicOtherJson)}`);
    }
    console.log('✓ Test 5c Passed: Unauthorized group topics are ignored');

    // 5d. Non-command group message in Topic 35 (IGNORED)
    sentRequests.length = 0;
    const nonCommandRes = await worker.fetch(
      new Request('https://worker.test/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          update_id: 1008,
          message: {
            message_id: 83,
            message_thread_id: 35,
            chat: { id: targetGroupId, type: 'supergroup', title: 'Target Forum' },
            from: { id: 777, is_bot: false, first_name: 'TopicUser' },
            text: 'Привет всем в чате!',
          },
        }),
      }),
      mockEnv
    );
    const nonCommandJson = await nonCommandRes.json();
    if (nonCommandJson.status !== 'ignored_non_command_group_message') {
      throw new Error(`Non-command in topic 35 should be ignored: ${JSON.stringify(nonCommandJson)}`);
    }
    console.log('✓ Test 5d Passed: Non-command chatter in topic 35 does not trigger the bot');

    // 6. Test callback_query handling
    console.log('Test 6: POST /webhook with callback_query');
    sentRequests.length = 0;
    await worker.fetch(
      new Request('https://worker.test/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          update_id: 1009,
          callback_query: {
            id: 'cb_123',
            from: { id: 777, is_bot: false, first_name: 'Alex' },
            data: 'open_app',
          },
        }),
      }),
      mockEnv
    );
    const cbReq = sentRequests.find((r) => r.url.endsWith('/answerCallbackQuery'));
    if (!cbReq || cbReq.body?.callback_query_id !== 'cb_123') {
      throw new Error('Callback query answer missing');
    }
    console.log('✓ Test 6 Passed: Callback query answered successfully');

    // 7. Test inline_query handling
    console.log('Test 7: POST /webhook with inline_query');
    sentRequests.length = 0;
    await worker.fetch(
      new Request('https://worker.test/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          update_id: 1010,
          inline_query: {
            id: 'iq_123',
            from: { id: 777, is_bot: false, first_name: 'Alex' },
            query: '',
            offset: '',
          },
        }),
      }),
      mockEnv
    );
    const iqReq = sentRequests.find((r) => r.url.endsWith('/answerInlineQuery'));
    if (!iqReq || iqReq.body?.inline_query_id !== 'iq_123') {
      throw new Error('Inline query answer missing');
    }
    console.log('✓ Test 7 Passed: Inline query answered successfully with app card');

    // 8. Test New Article Broadcast (POST /publish-article to Topic 1702 with photo & Rich Button)
    console.log('Test 8: Article Broadcast to Topic 1702 (Photo preview, Title, Rich Button «Читать»)');
    sentRequests.length = 0;
    const testArticle = {
      id: 'art-777',
      title: 'Великое открытие OneHouse 2026',
      cover_url: 'https://example.com/cover.webp',
      content: 'Текст интереснейшей статьи...',
    };

    // 8a. Successful Rich Message broadcast
    const pubRes = await worker.fetch(
      new Request('https://worker.test/publish-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post: testArticle }),
      }),
      mockEnv
    );
    if (pubRes.status !== 200) throw new Error(`/publish-article returned status ${pubRes.status}`);
    const pubReq = sentRequests.find((r) => r.url.endsWith('/sendRichMessage'));
    if (!pubReq) throw new Error('Expected /sendRichMessage for article broadcast');
    if (pubReq.body?.chat_id !== -1002997374585) {
      throw new Error(`Expected chat_id -1002997374585, got ${pubReq.body?.chat_id}`);
    }
    if (pubReq.body?.message_thread_id !== 1702) {
      throw new Error(`Expected message_thread_id 1702, got ${pubReq.body?.message_thread_id}`);
    }
    if (pubReq.body?.link_preview_options?.url !== testArticle.cover_url) {
      throw new Error('Expected link_preview_options with cover_url');
    }
    if (!pubReq.body?.rich_message?.html?.includes('startapp=article_art-777')) {
      throw new Error('Expected direct startapp link in rich_message HTML button');
    }
    if (!pubReq.body?.rich_message?.html?.includes('Читать')) {
      throw new Error('Expected «Читать» button in rich_message HTML');
    }
    console.log('✓ Test 8a Passed: /publish-article sent Rich Message with photo link preview and «Читать» button to topic 1702');

    // 8b. Test CORS preflight (OPTIONS)
    const optionsRes = await worker.fetch(
      new Request('https://worker.test/publish-article', { method: 'OPTIONS' }),
      mockEnv
    );
    if (optionsRes.status !== 204) throw new Error(`OPTIONS returned status ${optionsRes.status}`);
    if (optionsRes.headers.get('Access-Control-Allow-Origin') !== '*') {
      throw new Error('Missing CORS Access-Control-Allow-Origin: * header');
    }
    console.log('✓ Test 8b Passed: OPTIONS preflight handled with proper CORS headers');

    // 8c. Test fallback to sendPhoto if sendRichMessage fails
    sentRequests.length = 0;
    globalThis.fetch = async (url, options) => {
      if (typeof url === 'string' && url.includes('api.telegram.org')) {
        const body = options?.body ? JSON.parse(options.body) : null;
        sentRequests.push({ url, method: options?.method, body });
        if (url.endsWith('/sendRichMessage')) {
          return new Response(JSON.stringify({ ok: false, error_code: 400, description: 'Not supported' }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response(JSON.stringify({ ok: true, result: { message_id: 888 } }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return originalFetch(url, options);
    };

    const fallbackRes = await worker.fetch(
      new Request('https://worker.test/publish-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post: testArticle }),
      }),
      mockEnv
    );
    if (fallbackRes.status !== 200) throw new Error(`Fallback returned status ${fallbackRes.status}`);
    const photoReq = sentRequests.find((r) => r.url.endsWith('/sendPhoto'));
    if (!photoReq) throw new Error('Expected fallback to /sendPhoto when sendRichMessage fails');
    if (photoReq.body?.photo !== testArticle.cover_url) {
      throw new Error('sendPhoto missing cover_url');
    }
    if (photoReq.body?.message_thread_id !== 1702) {
      throw new Error('sendPhoto missing message_thread_id 1702');
    }
    const inlineBtn = photoReq.body?.reply_markup?.inline_keyboard?.[0]?.[0];
    if (inlineBtn?.text !== 'Читать' || !inlineBtn?.url?.includes('startapp=article_art-777')) {
      throw new Error('sendPhoto missing inline button «Читать» with startapp URL');
    }
    console.log('✓ Test 8c Passed: Fallback to sendPhoto works reliably with photo, caption, and «Читать» inline button');

    // 8d. Test Webhook direct publication ({ type: 'new_post', post: ... })
    sentRequests.length = 0;
    globalThis.fetch = async (url, options) => {
      if (typeof url === 'string' && url.includes('api.telegram.org')) {
        const body = options?.body ? JSON.parse(options.body) : null;
        sentRequests.push({ url, method: options?.method, body });
        return new Response(JSON.stringify({ ok: true, result: { message_id: 999 } }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return originalFetch(url, options);
    };

    const webhookPostRes = await worker.fetch(
      new Request('https://worker.test/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'new_post', post: testArticle }),
      }),
      mockEnv
    );
    if (webhookPostRes.status !== 200) throw new Error(`Webhook post returned ${webhookPostRes.status}`);
    const webhookRichReq = sentRequests.find((r) => r.url.endsWith('/sendRichMessage'));
    if (!webhookRichReq || webhookRichReq.body?.message_thread_id !== 1702) {
      throw new Error('Webhook new_post failed to broadcast to topic 1702');
    }
    console.log('✓ Test 8d Passed: POST /webhook with { type: "new_post" } successfully broadcasts to topic 1702');

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! Everything conforms to requirements.');
  } finally {
    globalThis.fetch = originalFetch;
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
