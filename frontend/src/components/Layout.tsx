import { Layout as AntLayout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppstoreOutlined,
  DashboardOutlined,
  BarChartOutlined,
  ApiOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../store/auth';

const { Header, Footer, Content } = AntLayout;

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const menuItems = [
    { key: '/orders', icon: <AppstoreOutlined />, label: '订单' },
    { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: '/statistics', icon: <BarChartOutlined />, label: '数据统计' },
    { key: '/mine', icon: <ApiOutlined />, label: '我的' }
  ];

  return (
    <AntLayout style={{ minHeight: '100vh', maxWidth: '600px', margin: '0 auto' }}>
      <Header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#4A90E2',
        color: '#fff',
        padding: '0 16px',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AppstoreOutlined style={{ fontSize: 20 }} />
          <h2 style={{ color: '#fff', margin: 0, fontSize: 18, fontWeight: 'bold' }}>易送</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13 }}>{user?.username}</span>
          <LogoutOutlined
            style={{ cursor: 'pointer', fontSize: 18 }}
            onClick={logout}
          />
        </div>
      </Header>
      <Content style={{ background: '#f5f5f5', minHeight: 'calc(100vh - 114px)' }}>
        {children}
      </Content>
      <Footer style={{
        padding: 0,
        background: '#fff',
        borderTop: '1px solid #f0f0f0',
        position: 'sticky',
        bottom: 0,
        zIndex: 1000
      }}>
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems.map(item => ({
            key: item.key,
            style: {
              flex: 1,
              justifyContent: 'center',
              margin: 0,
              padding: '12px 0'
            },
            label: (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                fontSize: 14
              }}>
                <span>{item.label}</span>
              </div>
            )
          }))}
          onClick={({ key }) => navigate(key)}
          style={{
            display: 'flex',
            borderBottom: 'none'
          }}
        />
      </Footer>
    </AntLayout>
  );
}
