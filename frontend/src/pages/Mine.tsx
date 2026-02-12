import { Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import {
  SearchOutlined,
  PieChartOutlined,
  SyncOutlined,
  ShopOutlined,
  CarOutlined,
  FileTextOutlined,
  SettingOutlined,
  UserOutlined
} from '@ant-design/icons';

export default function Mine() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

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
