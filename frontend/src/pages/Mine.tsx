import { Card, Button, Badge, Progress } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useState, useEffect } from 'react';
import {
  SearchOutlined,
  PieChartOutlined,
  SyncOutlined,
  ShopOutlined,
  CarOutlined,
  FileTextOutlined,
  SettingOutlined,
  UserOutlined,
  TeamOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  RightOutlined,
  HomeOutlined
} from '@ant-design/icons';

export default function Mine() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stationStatus, setStationStatus] = useState<any>(null); // 驻店状态

  const commonItems = [
    { key: 'order-search', icon: <SearchOutlined />, label: '订单查询', path: '/mine/order-search' },
    { key: 'data-stats', icon: <PieChartOutlined />, label: '数据统计', path: '/mine/data-stats' },
    { key: 'callback-rate', icon: <SyncOutlined />, label: '回传率', path: '/mine/callback-rate' }
  ];

  const systemItems = [
    { key: 'platform-bind', icon: <ShopOutlined />, label: '商流平台绑定', path: '/mine/platform-bind' },
    { key: 'delivery-bind', icon: <CarOutlined />, label: '配送平台绑定', path: '/mine/delivery-bind' },
    { key: 'order-settings', icon: <FileTextOutlined />, label: '订单设置', path: '/mine/order-settings' },
    { key: 'delivery-settings', icon: <SettingOutlined />, label: '配送设置', path: '/mine/delivery-settings' }
  ];

  // 模拟加载驻店状态
  useEffect(() => {
    // TODO: 从后端API加载驻店状态
    // 这里先用mock数据
    const mockStation = {
      active: true,
      rider: {
        name: '张三',
        phone: '138****1234',
        platform: '闪送'
      },
      startTime: '11:00',
      endTime: '13:00',
      remainingMinutes: 83,
      completedOrders: 8
    };
    // setStationStatus(mockStation); // 有驻店时
    setStationStatus(null); // 无驻店时
  }, []);

  // 计算剩余时间百分比
  const getTimeProgress = () => {
    if (!stationStatus) return 0;
    const total = 120; // 假设总时长2小时
    const remaining = stationStatus.remainingMinutes;
    return ((total - remaining) / total) * 100;
  };

  return (
    <div style={{ padding: '16px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* 用户信息卡片 */}
      <Card style={{ marginBottom: 16, borderRadius: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 24
          }}>
            <UserOutlined />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>
              {user?.username || '商家'}
            </div>
            <div style={{ fontSize: 13, color: '#999' }}>
              {user?.companyName || '易送商户'}
            </div>
          </div>
        </div>
      </Card>

      {/* 常用功能 */}
      <Card
        title={<span style={{ fontSize: 16, fontWeight: 'bold' }}>常用功能</span>}
        style={{ marginBottom: 16, borderRadius: 8 }}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px 0'
        }}>
          {commonItems.map(item => (
            <div
              key={item.key}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                padding: '8px 0'
              }}
            >
              <div style={{
                fontSize: 32,
                color: '#4A90E2',
                marginBottom: 8
              }}>
                {item.icon}
              </div>
              <div style={{
                fontSize: 13,
                color: '#333',
                textAlign: 'center',
                whiteSpace: 'nowrap'
              }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 驻店管理 */}
      <Card
        title={<span style={{ fontSize: 16, fontWeight: 'bold' }}>驻店管理</span>}
        style={{ marginBottom: 16, borderRadius: 8 }}
      >
        {stationStatus ? (
          // 有驻店状态
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Badge status="processing" text={
                <span style={{ fontSize: 14, fontWeight: 600, color: '#52c41a' }}>驻店进行中</span>
              } />
              <span style={{ fontSize: 12, color: '#999' }}>
                {stationStatus.startTime} - {stationStatus.endTime}
              </span>
            </div>

            <div style={{ background: '#f6ffed', padding: '12px', borderRadius: 8, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <TeamOutlined style={{ fontSize: 16, color: '#52c41a' }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  {stationStatus.rider.name} ({stationStatus.rider.platform})
                </span>
                <PhoneOutlined
                  style={{ fontSize: 14, color: '#1890ff', marginLeft: 'auto', cursor: 'pointer' }}
                  onClick={() => window.location.href = `tel:${stationStatus.rider.phone}`}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <ClockCircleOutlined style={{ fontSize: 14, color: '#faad14' }} />
                <span style={{ fontSize: 13, color: '#666' }}>
                  剩余时间：{Math.floor(stationStatus.remainingMinutes / 60)}小时{stationStatus.remainingMinutes % 60}分钟
                </span>
              </div>

              <Progress
                percent={getTimeProgress()}
                strokeColor="#52c41a"
                showInfo={false}
                style={{ marginBottom: 8 }}
              />

              <div style={{ fontSize: 13, color: '#666' }}>
                已完成订单：<span style={{ fontSize: 16, fontWeight: 700, color: '#52c41a' }}>{stationStatus.completedOrders}</span> 单
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                type="primary"
                block
                onClick={() => navigate('/mine/station-management')}
              >
                查看详情
              </Button>
              <Button
                block
                onClick={() => navigate('/mine/station-management')}
              >
                续时
              </Button>
            </div>
          </div>
        ) : (
          // 无驻店状态
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 64,
              height: 64,
              margin: '0 auto 12px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <HomeOutlined style={{ fontSize: 32, color: '#1890ff' }} />
            </div>
            <div style={{ fontSize: 14, color: '#999', marginBottom: 16 }}>
              暂无驻店骑手
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                type="primary"
                block
                onClick={() => navigate('/mine/station-create')}
              >
                立即发起驻店
              </Button>
              <Button
                block
                icon={<RightOutlined />}
                onClick={() => navigate('/mine/station-history')}
              >
                查看记录
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 系统管理 */}
      <Card
        title={<span style={{ fontSize: 16, fontWeight: 'bold' }}>系统管理</span>}
        style={{ borderRadius: 8 }}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px 0'
        }}>
          {systemItems.map(item => (
            <div
              key={item.key}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                padding: '8px 0'
              }}
            >
              <div style={{
                fontSize: 32,
                color: '#4A90E2',
                marginBottom: 8
              }}>
                {item.icon}
              </div>
              <div style={{
                fontSize: 13,
                color: '#333',
                textAlign: 'center',
                whiteSpace: 'nowrap'
              }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
