import { useState, useEffect } from 'react';
import { Layout as AntLayout } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  UnorderedListOutlined,
  PieChartOutlined,
  BarChartOutlined,
  UserOutlined,
  LogoutOutlined,
  CarOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../store/auth';

const { Header, Footer, Content } = AntLayout;

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { key: '/orders', icon: UnorderedListOutlined, label: '订单' },
    { key: '/dashboard', icon: PieChartOutlined, label: '仪表盘' },
    { key: '/statistics', icon: BarChartOutlined, label: '数据统计' },
    { key: '/mine', icon: UserOutlined, label: '我的' }
  ];

  return (
    <AntLayout style={{ minHeight: '100vh', maxWidth: isMobile ? '100%' : '600px', margin: '0 auto' }}>
      <Header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#4A90E2',
        color: '#fff',
        padding: isMobile ? '0 12px' : '0 16px',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        height: isMobile ? 56 : 64
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CarOutlined style={{ fontSize: isMobile ? 18 : 20 }} />
          <h2 style={{ color: '#fff', margin: 0, fontSize: isMobile ? 16 : 18, fontWeight: 'bold' }}>易送</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
          <span style={{ fontSize: isMobile ? 12 : 13 }}>{user?.username}</span>
          <LogoutOutlined
            style={{ cursor: 'pointer', fontSize: isMobile ? 16 : 18 }}
            onClick={logout}
          />
        </div>
      </Header>
      <Content style={{ background: '#f5f5f5', minHeight: `calc(100vh - ${isMobile ? 110 : 114}px)` }}>
        {children}
      </Content>
      <Footer style={{
        padding: 0,
        background: '#fff',
        borderTop: '1px solid #f0f0f0',
        position: 'sticky',
        bottom: 0,
        zIndex: 1000,
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}>
        <div style={{ display: 'flex', height: isMobile ? 56 : 60 }}>
          {navItems.map(item => {
            const isActive = location.pathname === item.key;
            const IconComp = item.icon;
            return (
              <div
                key={item.key}
                onClick={() => navigate(item.key)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s',
                  userSelect: 'none'
                }}
              >
                {/* 选中指示条 */}
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 24,
                    height: 2,
                    borderRadius: '0 0 2px 2px',
                    background: '#4A90E2'
                  }} />
                )}
                {/* 图标容器 */}
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isActive ? 'rgba(74,144,226,0.1)' : 'transparent',
                  transition: 'all 0.2s'
                }}>
                  <IconComp style={{
                    fontSize: 18,
                    color: isActive ? '#4A90E2' : '#bfbfbf',
                    transition: 'color 0.2s'
                  }} />
                </div>
                {/* 文字 */}
                <span style={{
                  fontSize: 11,
                  lineHeight: 1,
                  color: isActive ? '#4A90E2' : '#bfbfbf',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'all 0.2s'
                }}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </Footer>
    </AntLayout>
  );
}
