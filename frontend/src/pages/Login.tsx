import { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import client from '../api/client';
import { useAuthStore } from '../store/auth';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const handleLogin = async (values: any) => {
    setLoading(true);
    try {
      const { data } = await client.post('/auth/login', values);
      setAuth(data.token, data.user);
      message.success('登录成功');
    } catch (error: any) {
      message.error(error.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    setLoading(true);
    try {
      // 先尝试注册
      try {
        await client.post('/auth/register', {
          username: 'demo',
          email: 'demo@example.com',
          password: 'demo123',
          companyName: '演示商家'
        });
      } catch (e) {
        // 如果已存在则忽略
      }

      // 登录
      const { data } = await client.post('/auth/login', {
        username: 'demo',
        password: 'demo123'
      });
      setAuth(data.token, data.user);
      message.success('登录成功');
    } catch (error: any) {
      message.error('快速登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Card style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, marginBottom: 8, fontWeight: 'bold', color: '#1890ff' }}>
            易送
          </h1>
          <p style={{ color: '#999', fontSize: 13 }}>即时配送聚合发单平台</p>
          <p style={{ color: '#999', fontSize: 12 }}>对标青云、麦芽田</p>
        </div>

        <Form onFinish={handleLogin}>
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              登录
            </Button>
          </Form.Item>
        </Form>

        <Button
          type="default"
          onClick={handleQuickLogin}
          loading={loading}
          block
          size="large"
          style={{ marginTop: 8 }}
        >
          快速体验（演示账号）
        </Button>

        <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: '#999' }}>
          <p>演示账号：demo / demo123</p>
        </div>
      </Card>
    </div>
  );
}
