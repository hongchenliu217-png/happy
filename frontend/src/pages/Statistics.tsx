import { useEffect, useState } from 'react';
import { Card, DatePicker, Row, Col, Statistic, Table } from 'antd';
import { ShoppingOutlined, DollarOutlined } from '@ant-design/icons';
import client from '../api/client';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default function Statistics() {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'days'),
    dayjs()
  ]);
  const [platformStats, setPlatformStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStatistics();
  }, [dateRange]);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/statistics/platforms');
      setPlatformStats(data);
    } catch (error) {
      console.error('加载统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string) => {
        const platformMap: any = {
          meituan: '美团',
          taobao: '饿了么',
          douyin: '抖音'
        };
        return platformMap[platform] || platform;
      }
    },
    {
      title: '订单数',
      dataIndex: 'orderCount',
      key: 'orderCount',
      render: (count: number) => <span style={{ fontWeight: 'bold' }}>{count}</span>
    },
    {
      title: '营收',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
          ¥{Number(revenue).toFixed(2)}
        </span>
      )
    }
  ];

  const totalOrders = platformStats.reduce((sum, item) => sum + (item.orderCount || 0), 0);
  const totalRevenue = platformStats.reduce((sum, item) => sum + (item.revenue || 0), 0);

  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ marginBottom: 16, fontSize: 18 }}>数据统计</h2>

      <Card style={{ marginBottom: 16 }}>
        <RangePicker
          value={dateRange}
          onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
          style={{ width: '100%' }}
        />
      </Card>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card>
            <Statistic
              title="总订单数"
              value={totalOrders}
              prefix={<ShoppingOutlined />}
              valueStyle={{ fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="总营收"
              value={totalRevenue}
              prefix="¥"
              precision={2}
              valueStyle={{ fontSize: 24, color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="平台分布">
        <Table
          columns={columns}
          dataSource={platformStats}
          rowKey="platform"
          loading={loading}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
}
