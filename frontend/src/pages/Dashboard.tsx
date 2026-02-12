import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { ShoppingOutlined, CheckCircleOutlined, ClockCircleOutlined, DollarOutlined } from '@ant-design/icons';
import client from '../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState({
    todayOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    todayRevenue: 0
  });

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      const { data } = await client.get('/statistics/dashboard');
      setStats(data);
    } catch (error) {
      console.error('加载仪表盘失败:', error);
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ marginBottom: 16, fontSize: 18 }}>今日数据概览</h2>
      <Row gutter={[12, 12]}>
        <Col span={12}>
          <Card>
            <Statistic
              title="今日订单"
              value={stats.todayOrders}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#3f8600', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="已完成"
              value={stats.completedOrders}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="待处理"
              value={stats.pendingOrders}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="今日营收"
              value={stats.todayRevenue}
              prefix="¥"
              precision={2}
              valueStyle={{ color: '#cf1322', fontSize: 24 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
