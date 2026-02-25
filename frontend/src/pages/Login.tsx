import { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Row, Col, Statistic } from 'antd';
import { UserOutlined, LockOutlined, ThunderboltOutlined, RocketOutlined, SafetyOutlined, TeamOutlined } from '@ant-design/icons';
import client from '../api/client';
import { useAuthStore } from '../store/auth';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      flexDirection: isMobile ? 'column' : 'row',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      {/* 左侧品牌展示区 */}
      <div style={{
        flex: isMobile ? 'none' : 1,
        display: isMobile ? 'none' : 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* 装饰性背景元素 */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '300px',
          height: '300px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          filter: 'blur(60px)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-100px',
          left: '-100px',
          width: '400px',
          height: '400px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          filter: 'blur(80px)'
        }} />

        {/* 品牌内容 */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '500px' }}>
          <div style={{
            fontSize: 56,
            fontWeight: 'bold',
            marginBottom: 24,
            textShadow: '0 2px 20px rgba(0,0,0,0.2)'
          }}>
            易送
          </div>
          <div style={{
            fontSize: 24,
            marginBottom: 16,
            opacity: 0.95
          }}>
            即时配送聚合发单平台
          </div>
          <div style={{
            fontSize: 16,
            marginBottom: 48,
            opacity: 0.85,
            lineHeight: 1.8
          }}>
            对标青云、麦芽田，为商家提供智能化配送解决方案
          </div>

          {/* 核心特性 */}
          <div style={{ marginTop: 60 }}>
            <Row gutter={[24, 24]}>
              <Col span={12}>
                <div style={{
                  padding: '20px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: 12,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <ThunderboltOutlined style={{ fontSize: 32, marginBottom: 12 }} />
                  <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>智能派单</div>
                  <div style={{ fontSize: 14, opacity: 0.9 }}>AI驱动的配送策略</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{
                  padding: '20px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: 12,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <RocketOutlined style={{ fontSize: 32, marginBottom: 12 }} />
                  <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>多平台聚合</div>
                  <div style={{ fontSize: 14, opacity: 0.9 }}>一键对接多个运力</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{
                  padding: '20px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: 12,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <SafetyOutlined style={{ fontSize: 32, marginBottom: 12 }} />
                  <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>安全可靠</div>
                  <div style={{ fontSize: 14, opacity: 0.9 }}>企业级数据保护</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{
                  padding: '20px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: 12,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <TeamOutlined style={{ fontSize: 32, marginBottom: 12 }} />
                  <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>专业服务</div>
                  <div style={{ fontSize: 14, opacity: 0.9 }}>7×24小时支持</div>
                </div>
              </Col>
            </Row>
          </div>

          {/* 数据展示 */}
          <div style={{
            marginTop: 60,
            padding: '30px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 16,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <Row gutter={32}>
              <Col span={8}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>服务商家</span>}
                  value={1200}
                  suffix="+"
                  valueStyle={{ color: 'white', fontSize: 28 }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>日均订单</span>}
                  value={50000}
                  suffix="+"
                  valueStyle={{ color: 'white', fontSize: 28 }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>配送准时率</span>}
                  value={98.5}
                  suffix="%"
                  valueStyle={{ color: 'white', fontSize: 28 }}
                />
              </Col>
            </Row>
          </div>
        </div>
      </div>

      {/* 右侧登录表单区 */}
      <div style={{
        width: isMobile ? '100%' : '480px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '20px' : '40px',
        background: 'white'
      }}>
        <Card
          style={{
            width: '100%',
            maxWidth: isMobile ? '100%' : 400,
            boxShadow: 'none',
            border: 'none'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 30 : 40 }}>
            <div style={{
              width: isMobile ? 56 : 64,
              height: isMobile ? 56 : 64,
              margin: '0 auto 20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isMobile ? 28 : 32,
              color: 'white',
              fontWeight: 'bold'
            }}>
              易
            </div>
            <h1 style={{ fontSize: isMobile ? 24 : 28, marginBottom: 8, fontWeight: 'bold', color: '#1a1a1a' }}>
              欢迎回来
            </h1>
            <p style={{ color: '#999', fontSize: 14 }}>登录您的易送账户</p>
          </div>

          <Form onFinish={handleLogin} size={isMobile ? 'middle' : 'large'}>
            <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input
                prefix={<UserOutlined style={{ color: '#999' }} />}
                placeholder="用户名"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password
                prefix={<LockOutlined style={{ color: '#999' }} />}
                placeholder="密码"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  height: isMobile ? 44 : 48,
                  borderRadius: 8,
                  fontSize: isMobile ? 15 : 16,
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                登录
              </Button>
            </Form.Item>
          </Form>

          <Button
            type="default"
            onClick={handleQuickLogin}
            loading={loading}
            block
            style={{
              height: isMobile ? 44 : 48,
              borderRadius: 8,
              fontSize: 14,
              marginTop: 12
            }}
          >
            快速体验（演示账号）
          </Button>

          <div style={{
            marginTop: 24,
            padding: 16,
            background: '#f5f7fa',
            borderRadius: 8,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
              演示账号
            </div>
            <div style={{ fontSize: 13, color: '#1890ff', fontFamily: 'monospace' }}>
              demo / demo123
            </div>
          </div>

          <div style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: '#999' }}>
            <p>登录即表示您同意我们的服务条款和隐私政策</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
