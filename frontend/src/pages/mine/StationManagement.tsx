import { useState, useEffect } from 'react';
import { Card, Button, Progress, Tag, Modal, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftOutlined,
  TeamOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';

export default function StationManagement() {
  const navigate = useNavigate();
  const [stationData, setStationData] = useState<any>(null);
  const [extendModalVisible, setExtendModalVisible] = useState(false);

  useEffect(() => {
    // TODO: 从后端加载驻店数据
    const mockData = {
      rider: {
        name: '张三',
        phone: '13812341234',
        platform: '闪送',
        platformColor: '#FF6B00'
      },
      startTime: '11:00',
      endTime: '13:00',
      remainingMinutes: 83,
      totalMinutes: 120,
      completedOrders: 8,
      estimatedCost: 120,
      orderHistory: [
        { time: '11:25', orderNo: '#1234', status: 'completed' },
        { time: '11:32', orderNo: '#1235', status: 'completed' },
        { time: '11:45', orderNo: '#1236', status: 'completed' },
        { time: '11:52', orderNo: '#1237', status: 'completed' },
        { time: '12:05', orderNo: '#1238', status: 'completed' },
        { time: '12:18', orderNo: '#1239', status: 'completed' },
        { time: '12:25', orderNo: '#1240', status: 'completed' },
        { time: '12:32', orderNo: '#1241', status: 'completed' }
      ]
    };
    setStationData(mockData);
  }, []);

  const handleExtend = (minutes: number) => {
    message.success(`已续时${minutes}分钟`);
    setExtendModalVisible(false);
    // TODO: 调用后端API续时
  };

  const handleEnd = () => {
    Modal.confirm({
      title: '确认结束驻店？',
      content: '结束后骑手将离开，未完成的订单需重新呼叫运力',
      okText: '确认结束',
      cancelText: '取消',
      onOk: () => {
        message.success('驻店已结束');
        navigate('/mine');
        // TODO: 调用后端API结束驻店
      }
    });
  };

  if (!stationData) {
    return <div style={{ padding: 16 }}>加载中...</div>;
  }

  const timeProgress = ((stationData.totalMinutes - stationData.remainingMinutes) / stationData.totalMinutes) * 100;

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
        <span style={{ fontSize: 18, fontWeight: 'bold' }}>驻店管理</span>
      </div>

      {/* 当前驻店状态 */}
      <Card
        title={<span style={{ fontSize: 16, fontWeight: 'bold' }}>当前驻店</span>}
        style={{ marginBottom: 16, borderRadius: 8 }}
      >
        <div style={{
          background: 'linear-gradient(135deg, #f6ffed 0%, #fff 100%)',
          padding: '16px',
          borderRadius: 8,
          border: '1px solid #b7eb8f',
          marginBottom: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TeamOutlined style={{ fontSize: 20, color: '#52c41a' }} />
              <span style={{ fontSize: 16, fontWeight: 600 }}>{stationData.rider.name}</span>
              <Tag color={stationData.rider.platformColor}>{stationData.rider.platform}</Tag>
            </div>
            <PhoneOutlined
              style={{ fontSize: 18, color: '#1890ff', cursor: 'pointer' }}
              onClick={() => window.location.href = `tel:${stationData.rider.phone}`}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: '#666' }}>驻店时段</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {stationData.startTime} - {stationData.endTime}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: '#666' }}>剩余时间</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#faad14' }}>
                {Math.floor(stationData.remainingMinutes / 60)}小时{stationData.remainingMinutes % 60}分钟
              </span>
            </div>
          </div>

          <Progress
            percent={timeProgress}
            strokeColor={{
              '0%': '#52c41a',
              '100%': '#73d13d'
            }}
            showInfo={false}
            style={{ marginBottom: 12 }}
          />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px',
            background: '#fff',
            borderRadius: 8,
            border: '1px solid #d9f7be'
          }}>
            <span style={{ fontSize: 13, color: '#666', marginRight: 8 }}>已完成订单</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#52c41a' }}>
              {stationData.completedOrders}
            </span>
            <span style={{ fontSize: 14, color: '#666', marginLeft: 4 }}>单</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            background: '#fff7e6',
            borderRadius: 8,
            border: '1px solid #ffd591',
            marginTop: 8
          }}>
            <span style={{ fontSize: 12, color: '#999', marginRight: 6 }}>预估费用</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#ff4d4f' }}>
              ¥{stationData.estimatedCost}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <Button
            type="primary"
            block
            onClick={() => setExtendModalVisible(true)}
          >
            续时
          </Button>
          <Button
            danger
            block
            onClick={handleEnd}
          >
            结束驻店
          </Button>
        </div>
      </Card>

      {/* 实时订单分配 */}
      <Card
        title={<span style={{ fontSize: 16, fontWeight: 'bold' }}>订单分配记录</span>}
        style={{ borderRadius: 8 }}
      >
        {stationData.orderHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
            暂无订单分配记录
          </div>
        ) : (
          <div>
            {stationData.orderHistory.map((order: any, index: number) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: '#fafafa',
                  borderRadius: 8,
                  marginBottom: 8
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <CheckCircleOutlined style={{ fontSize: 18, color: '#52c41a' }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                      订单 {order.orderNo}
                    </div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      {order.time} 分配给 {stationData.rider.name}
                    </div>
                  </div>
                </div>
                <Tag color="success">已完成</Tag>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 续时弹窗 */}
      <Modal
        title="选择续时时长"
        open={extendModalVisible}
        onCancel={() => setExtendModalVisible(false)}
        footer={null}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Button
            size="large"
            block
            onClick={() => handleExtend(30)}
          >
            续时 30 分钟
          </Button>
          <Button
            size="large"
            block
            onClick={() => handleExtend(60)}
          >
            续时 1 小时
          </Button>
          <Button
            size="large"
            block
            onClick={() => handleExtend(120)}
          >
            续时 2 小时
          </Button>
        </div>
      </Modal>
    </div>
  );
}
