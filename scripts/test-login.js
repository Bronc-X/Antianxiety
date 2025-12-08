const { createClient } = require('@supabase/supabase-js');

// 测试登录功能
async function testLogin() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log('开始测试登录功能...');
  
  // 测试邮箱登录
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test@example.com', // 替换为测试邮箱
    password: 'testpassword',   // 替换为测试密码
  });

  if (error) {
    console.error('登录测试失败:', error.message);
    return;
  }

  if (data.user && data.session) {
    console.log('✅ 登录测试成功!');
    console.log('用户ID:', data.user.id);
    console.log('Session 有效期:', new Date(data.session.expires_at * 1000));
    
    // 验证 session 是否可用
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (user && !userError) {
      console.log('✅ Session 验证成功!');
    } else {
      console.error('❌ Session 验证失败:', userError);
    }
  } else {
    console.error('❌ 登录返回数据异常');
  }
}

// 运行测试
testLogin().catch(console.error);
