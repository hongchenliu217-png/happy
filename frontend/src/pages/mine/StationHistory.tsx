import { useState, useEffect } from 'react';
import { Card, Tag, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined, ClockCircleOutlined, TeamOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

export default function StationHistory() {
  const navigate = useNavigate();
  const [historyList, setHistoryList] = useState<any[]>([]);

  useEffect(() => {
    // TODO: 从后端加载驻店历史记录
    const mockHistory = [
      {
        id: 1,
        date: '2026-03-03',
        startTime: '11:00',
        endTime: '13:00',
        platform: '闪送',
        platformColor: '#FF6B00',
        riderName: '张三',
        completedOrders: 10,
        cost: 120,
        avgDeliveryTime: 25
      },
      {
        id: 2,
        date: '2026-03-02',
        startTime: '17:00',
        endTime: '19:00',
        platform: '闪送',
        platformColor: '#FF6B00',
        riderName: '李四',
        completedOrders: 8,
        cost: 120,
        avgDeliveryTime: 28
      },
      {
        id: 3,
        date: '2026-03-02',
        startTime: '11:00',
        endTime: '13:00',
        platform: '闪送',
        platformColor: '#FF6B00',
        riderName: '王五',
        completedOrders: 12,
        cost: 120,
        avgDeliveryTime: 23
      },
      {
        id: 4,
        date: '2026-03-01',
        startTime: '17:00',
        endTime: '19:00',
        platform: '闪送',
        platformColor: '#FF6B00',
        riderName: '赵六',
        completedOrders: 9,
        cost: 120,
        avgDeliveryTime: 30
      }
    ];
    setHistoryList(mockHistory);
  }, []);

  const getDateLabel = (date: string) => {
    const today = dayjs().format('YYYY-MM-DD');
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

    if (date === today) return '今天';
    if (date === yesterday) return '昨天';
    return dayjs(date).format('MM月DD日');
  };

  return (
    <div style={{ padding: '16px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* 顶部导航 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        padding: '8px 0'
      }}>
        <ArrowLeftOutlined
          style={{ fontSize: 20, cursor: 'pointer' }}
          onClick={() => navigate('/mine')}
        />
        <span style={{ fontSize: 18, fontWeight: 'bold' }}>驻店记录</span>
      </div>

      {historyList.length === 0 ? (
        <Card style={{ borderRadius: 8 }}>
          <Empty description="暂无驻店记录" />
        </Card>
      ) : (
        historyList.map((record) => (
          <Card
            key={record.id}
            style={{ marginBottom: 12, borderRadius: 8 }}
            bodyStyle={{ padding: 16 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Tag color="blue" style={{ margin: 0, fontSize: 13 }}>
                {getDateLabel(record.date)}
              </Tag>
              <span style={{ fontSize: 13, color: '#999' }}>
                {record.startTime} - {record.endTime}
              </span>
            </div>

            <div style={{
              background: '#fafafa',
              padding: '12px',
              borderRadius: 8,
              marginBottom: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <TeamOutlined style={{ fontSize: 16, color: '#1890ff' }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>{record.riderName}</span>
                <Tag color={record.platformColor} style={{ margin: 0 }}>
                  {record.platform}
                </Tag>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>完成订单</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#52c41a' }}>
                    {record.completedOrders}
                  </div>
                  <div style={{ fontSize: 11, color: '#999' }}>单</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>费用</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#ff4d4f' }}>
                    {record.cost}
                  </div>
                  <div style={{ fontSize: 11, color: '#999' }}>元</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>平均时长</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#1890ff' }}>
                    {record.avgDeliveryTime}
                  </div>
                  <div style={{ fontSize: 11, color: '#999' }}>分钟</div>
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              background: '#e6f7ff',
              borderRadius: 6
            }}>
              <CheckCircleOutlined style={{ fontSize: 14, color: '#1890ff', marginRight: 6 }} />
              <span style={{ fontSize: 12, color: '#0050b3' }}>
                单均成本 ¥{(record.cost / record.completedOrders).toFixed(1)}
              </span>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
