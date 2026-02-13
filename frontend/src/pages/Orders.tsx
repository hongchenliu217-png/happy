import { useState, useEffect } from 'react';
import { Tabs, Button, Card, Tag, Space, message, Modal, Badge, Radio, Row, Col, Statistic, Empty } from 'antd';
import {
  CheckOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  ShoppingOutlined,
  DollarOutlined,
  TruckOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { ordersApi, Order } from '../api/orders';
import client from '../api/client';
import dayjs from 'dayjs';

const statusMap: Record<string, { text: string; color: string }> = {
  pending: { text: '新订单', color: 'default' },
  preparing: { text: '制作中', color: 'processing' },
  delivery_pending: { text: '待呼叫运力', color: 'warning' },
  delivery_calling: { text: '呼叫运力中', color: 'processing' },
  delivery_accepted: { text: '运力已接单', color: 'success' },
  ready: { text: '待出餐', color: 'warning' },
  picked_up: { text: '已取餐', color: 'success' },
  delivering: { text: '配送中', color: 'processing' },
  delivered: { text: '已送达', color: 'success' },
  cancelled: { text: '已取消', color: 'error' }
};

const sourceMap: Record<string, { text: string; color: string }> = {
  meituan: { text: '美团', color: '#FFD100' },
  taobao: { text: '饿了么', color: '#0095FF' },
  douyin: { text: '抖音', color: '#000000' }
};

export default function Orders() {
  const [activeTab, setActiveTab] = useState('new');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dispatchModalVisible, setDispatchModalVisible] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [platformPrices, setPlatformPrices] = useState<any[]>([]);

  useEffect(() => {
    loadOrders();
    loadPlatforms();
    const interval = setInterval(loadOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      const { data } = await ordersApi.getOrders();
      setOrders(data.orders);
    } catch (error) {
      // 静默失败
    }
  };

  const loadPlatforms = async () => {
    try {
      const { data } = await client.get('/platforms?type=downstream');
      setPlatforms(data);
    } catch (error) {
      console.error('加载平台失败:', error);
    }
  };

  // 计算统计数据
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    delivering: orders.filter(o => ['picked_up', 'delivering'].includes(o.status)).length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    totalAmount: orders.reduce((sum, o) => sum + parseFloat(o.totalAmount || '0'), 0).toFixed(2)
  };

  const simulateOrder = async () => {
    setLoading(true);
    try {
      const sources = ['meituan', 'taobao', 'douyin'];
      const randomSource = sources[Math.floor(Math.random() * sources.length)];

      const mockOrder = {
        source: randomSource,
        status: 'pending',
        deliveryType: 'third_party',
        totalAmount: (Math.random() * 50 + 20).toFixed(2),
        deliveryFee: (Math.random() * 5 + 3).toFixed(2),
        customerName: `客户${Math.floor(Math.random() * 1000)}`,
        customerPhone: '138****' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
        deliveryAddress: `测试路${Math.floor(Math.random() * 100)}号${Math.floor(Math.random() * 20) + 1}栋`,
        latitude: 22.5 + Math.random() * 0.1,
        longitude: 113.9 + Math.random() * 0.1,
        items: [
          { name: '宫保鸡丁', quantity: 1, price: 28 },
          { name: '米饭', quantity: 2, price: 2 }
        ]
      };

      await ordersApi.createOrder(mockOrder);
      message.success(`${sourceMap[randomSource].text}订单自动进入`);
      loadOrders();
    } catch (error) {
      message.error('模拟订单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStartPreparing = async (order: Order) => {
    try {
      await ordersApi.updateOrderStatus(order.id, 'preparing');
      message.success('开始制作');
      loadOrders();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleCallDelivery = (order: Order) => {
    setSelectedOrder(order);

    const prices = platforms.map(p => ({
      ...p,
      price: (Math.random() * 3 + 6).toFixed(1),
      estimatedTime: Math.floor(Math.random() * 10 + 20),
      distance: (Math.random() * 2 + 1).toFixed(1)
    }));

    setPlatformPrices(prices);
    setDispatchModalVisible(true);
  };

  const confirmDispatch = async () => {
    if (!selectedOrder || !selectedPlatform) {
      message.warning('请选择运力平台');
      return;
    }

    try {
      const platform = platformPrices.find(p => p.code === selectedPlatform);

      await ordersApi.updateOrderStatus(selectedOrder.id, 'delivery_calling');
      message.info(`正在呼叫${platform?.name}，等待骑手接单...`);

      setDispatchModalVisible(false);
      setSelectedPlatform('');
      loadOrders();

      setTimeout(async () => {
        await ordersApi.dispatchOrder(selectedOrder.id, selectedPlatform);
        await ordersApi.updateOrderStatus(selectedOrder.id, 'delivery_accepted');
        message.success(`${platform?.name}骑手已接单`);
        loadOrders();
      }, 5000);
    } catch (error) {
      message.error('呼叫运力失败');
    }
  };

  const handleMealReady = async (order: Order) => {
    try {
      await ordersApi.setMealReady(order.id);
      message.success('出餐完成，骑手可以取餐了');
      loadOrders();

      setTimeout(async () => {
        await ordersApi.updateOrderStatus(order.id, 'picked_up');
        message.info('骑手已取餐');
        loadOrders();
      }, 3000);

      setTimeout(async () => {
        await ordersApi.updateOrderStatus(order.id, 'delivering');
        message.info('配送中');
        loadOrders();
      }, 8000);

      setTimeout(async () => {
        await ordersApi.updateOrderStatus(order.id, 'delivered');
        message.success('订单已送达');
        loadOrders();
      }, 18000);
    } catch (error) {
      message.error('操作失败');
    }
  };

  const filterOrdersByTab = (tab: string) => {
    switch (tab) {
      case 'new':
        return orders.filter(o => o.status === 'pending');
      case 'pre':
        return orders.filter(o => o.status === 'confirmed');
      case 'waiting':
        return orders.filter(o => ['delivery_calling'].includes(o.status));
      case 'pickup':
        return orders.filter(o => o.status === 'delivery_accepted');
      case 'delivering':
        return orders.filter(o => ['picked_up', 'delivering'].includes(o.status));
      case 'exception':
        return orders.filter(o => o.status === 'cancelled');
      case 'refund':
        return [];
      default:
        return orders;
    }
  };

  const renderOrderCard = (order: Order) => (
    <Card
      key={order.id}
      style={{
        marginBottom: 12,
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid #f0f0f0'
      }}
      bodyStyle={{ padding: 16 }}
    >
      {/* 订单头部 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Space size={8}>
          <Tag
            color={sourceMap[order.source]?.color || 'default'}
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 'bold',
              padding: '4px 12px',
              borderRadius: 6
            }}
          >
            {sourceMap[order.source]?.text || order.source}
          </Tag>
          <span style={{ fontSize: 11, color: '#999', fontFamily: 'monospace' }}>
            #{order.orderNo?.slice(-8)}
          </span>
        </Space>
        <Badge
          status={
            statusMap[order.status]?.color === 'success' ? 'success' :
            statusMap[order.status]?.color === 'processing' ? 'processing' :
            statusMap[order.status]?.color === 'warning' ? 'warning' :
            'default'
          }
          text={
            <span style={{
              fontSize: 13,
              fontWeight: 600,
              color: statusMap[order.status]?.color === 'success' ? '#52c41a' :
                     statusMap[order.status]?.color === 'processing' ? '#1890ff' :
                     statusMap[order.status]?.color === 'warning' ? '#faad14' : '#666'
            }}>
              {statusMap[order.status]?.text}
            </span>
          }
        />
      </div>

      {/* 客户信息 */}
      <div style={{
        padding: '12px',
        background: '#fafafa',
        borderRadius: 8,
        marginBottom: 12
      }}>
        <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center' }}>
          <strong style={{ fontSize: 14, marginRight: 8 }}>{order.customerName}</strong>
          <span style={{ color: '#999', fontSize: 12 }}>{order.customerPhone}</span>
        </div>
        <div style={{ color: '#666', fontSize: 13, display: 'flex', alignItems: 'flex-start' }}>
          <span style={{ marginRight: 4 }}>📍</span>
          <span>{order.deliveryAddress}</span>
        </div>
      </div>

      {/* 订单信息 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0',
        borderTop: '1px solid #f0f0f0',
        borderBottom: '1px solid #f0f0f0',
        marginBottom: 12
      }}>
        <Space size={16}>
          <span style={{ fontSize: 12, color: '#999' }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            {dayjs(order.createdAt).format('HH:mm:ss')}
          </span>
        </Space>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 20, fontWeight: 'bold', color: '#ff4d4f' }}>
            ¥{order.totalAmount}
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <Space style={{ width: '100%' }} direction="vertical" size={8}>
        {order.status === 'pending' && (
          <Row gutter={8}>
            <Col span={12}>
              <Button
                type="primary"
                icon={<RocketOutlined />}
                block
                size="large"
                onClick={() => handleCallDelivery(order)}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  height: 44,
                  borderRadius: 8,
                  fontWeight: 'bold'
                }}
              >
                发起配送
              </Button>
            </Col>
            <Col span={12}>
              <Button
                icon={<CheckOutlined />}
                block
                size="large"
                onClick={() => handleMealReady(order)}
                style={{
                  height: 44,
                  borderRadius: 8,
                  borderColor: '#d9d9d9',
                  color: '#666'
                }}
              >
                出餐
              </Button>
            </Col>
          </Row>
        )}

        {order.status === 'delivery_calling' && (
          <>
            <div style={{
              textAlign: 'center',
              padding: '12px',
              background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
              borderRadius: 8,
              marginBottom: 4
            }}>
              <span style={{ color: '#1890ff', fontSize: 13, fontWeight: 'bold' }}>
                ⏳ 等待骑手接单...
              </span>
            </div>
            <Button
              icon={<CheckOutlined />}
              block
              size="large"
              onClick={() => handleMealReady(order)}
              style={{
                height: 44,
                borderRadius: 8,
                borderColor: '#d9d9d9',
                color: '#666'
              }}
            >
              出餐
            </Button>
          </>
        )}

        {order.status === 'delivery_accepted' && (
          <>
            <div style={{
              textAlign: 'center',
              padding: '12px',
              background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
              borderRadius: 8,
              marginBottom: 4
            }}>
              <span style={{ color: '#52c41a', fontSize: 13, fontWeight: 'bold' }}>
                ✓ 骑手已接单
              </span>
            </div>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              block
              size="large"
              onClick={() => handleMealReady(order)}
              style={{
                background: '#52c41a',
                borderColor: '#52c41a',
                height: 44,
                borderRadius: 8,
                fontWeight: 'bold'
              }}
            >
              出餐
            </Button>
          </>
        )}

        {['ready', 'picked_up', 'delivering'].includes(order.status) && (
          <div style={{
            textAlign: 'center',
            padding: '12px',
            background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
            borderRadius: 8
          }}>
            <span style={{ color: '#52c41a', fontSize: 13, fontWeight: 'bold' }}>
              ✓ {statusMap[order.status]?.text}
            </span>
          </div>
        )}

        {order.status === 'delivered' && (
          <div style={{
            textAlign: 'center',
            padding: '16px',
            background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
            borderRadius: 8
          }}>
            <span style={{ color: '#52c41a', fontSize: 15, fontWeight: 'bold' }}>
              ✓ 订单已完成
            </span>
          </div>
        )}
      </Space>
    </Card>
  );

  const tabItems = [
    { key: 'new', label: <Badge count={stats.pending} offset={[10, 0]}><span>新订单</span></Badge> },
    { key: 'pre', label: '预订单' },
    { key: 'waiting', label: '待抢单' },
    { key: 'pickup', label: '待取货' },
    { key: 'delivering', label: <Badge count={stats.delivering} offset={[10, 0]}><span>配送中</span></Badge> },
    { key: 'exception', label: '异常' },
    { key: 'refund', label: '退款' }
  ];

  const filteredOrders = filterOrdersByTab(activeTab);

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', paddingBottom: 20 }}>
      {/* 数据概览卡片 */}
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px 16px' }}>
        <Row gutter={[12, 12]}>
          <Col span={6}>
            <Card
              size="small"
              style={{
                borderRadius: 12,
                border: 'none',
                background: 'rgba(255,255,255,0.95)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              bodyStyle={{ padding: '16px 12px' }}
            >
              <Statistic
                title={<span style={{ fontSize: 12, color: '#666' }}>今日订单</span>}
                value={stats.total}
                prefix={<ShoppingOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card
              size="small"
              style={{
                borderRadius: 12,
                border: 'none',
                background: 'rgba(255,255,255,0.95)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              bodyStyle={{ padding: '16px 12px' }}
            >
              <Statistic
                title={<span style={{ fontSize: 12, color: '#666' }}>待处理</span>}
                value={stats.pending}
                prefix={<WarningOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card
              size="small"
              style={{
                borderRadius: 12,
                border: 'none',
                background: 'rgba(255,255,255,0.95)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              bodyStyle={{ padding: '16px 12px' }}
            >
              <Statistic
                title={<span style={{ fontSize: 12, color: '#666' }}>配送中</span>}
                value={stats.delivering}
                prefix={<TruckOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card
              size="small"
              style={{
                borderRadius: 12,
                border: 'none',
                background: 'rgba(255,255,255,0.95)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              bodyStyle={{ padding: '16px 12px' }}
            >
              <Statistic
                title={<span style={{ fontSize: 12, color: '#666' }}>今日营收</span>}
                value={stats.totalAmount}
                prefix={<DollarOutlined style={{ color: '#ff4d4f' }} />}
                valueStyle={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f' }}
                precision={2}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* 标签页 */}
      <div style={{ background: '#fff', position: 'sticky', top: 64, zIndex: 999, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          style={{ margin: 0 }}
          tabBarStyle={{ margin: '0 16px', paddingTop: 8 }}
        />
      </div>

      {/* 订单列表 */}
      <div style={{ padding: '16px' }}>
        {/* 快捷操作按钮 */}
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={simulateOrder}
            loading={loading}
            block
            size="large"
            style={{
              height: 52,
              fontSize: 16,
              fontWeight: 'bold',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
            }}
          >
            模拟上游订单自动进入
          </Button>
        </div>

        {/* 订单列表或空状态 */}
        {filteredOrders.length === 0 ? (
          <Card style={{
            textAlign: 'center',
            padding: '60px 20px',
            borderRadius: 12,
            border: '2px dashed #d9d9d9'
          }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <p style={{ color: '#999', fontSize: 15, marginBottom: 8 }}>暂无订单</p>
                  <p style={{ color: '#bfbfbf', fontSize: 13 }}>
                    点击上方按钮模拟订单自动进入
                  </p>
                </div>
              }
            />
          </Card>
        ) : (
          filteredOrders.map(renderOrderCard)
        )}
      </div>

      {/* 派单弹窗 */}
      <Modal
        title={
          <div style={{ fontSize: 18, fontWeight: 'bold' }}>
            <RocketOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            选择运力平台
          </div>
        }
        open={dispatchModalVisible}
        onCancel={() => {
          setDispatchModalVisible(false);
          setSelectedOrder(null);
          setSelectedPlatform('');
        }}
        footer={
          <Button
            type="primary"
            size="large"
            block
            onClick={confirmDispatch}
            disabled={!selectedPlatform}
            style={{
              height: 48,
              fontSize: 16,
              fontWeight: 'bold',
              borderRadius: 8,
              background: selectedPlatform ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : undefined,
              border: 'none'
            }}
          >
            确认派单
          </Button>
        }
        width="90%"
        style={{ maxWidth: 500 }}
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ marginBottom: 16, color: '#666', fontSize: 14, fontWeight: 'bold' }}>
            各平台实时报价：
          </p>

          <Radio.Group
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              {platformPrices.map(platform => (
                <Radio.Button
                  key={platform.id}
                  value={platform.code}
                  style={{
                    width: '100%',
                    height: 'auto',
                    padding: 16,
                    borderRadius: 8,
                    border: selectedPlatform === platform.code ? '2px solid #1890ff' : '1px solid #d9d9d9',
                    background: selectedPlatform === platform.code ? '#e6f7ff' : 'white'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
                        {platform.name}
                      </div>
                      <Space size={16}>
                        <span style={{ fontSize: 12, color: '#999' }}>
                          预计 {platform.estimatedTime} 分钟
                        </span>
                        <span style={{ fontSize: 12, color: '#999' }}>
                          {platform.distance} 公里
                        </span>
                      </Space>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f' }}>
                        ¥{platform.price}
                      </div>
                    </div>
                  </div>
                </Radio.Button>
              ))}
            </Space>
          </Radio.Group>
        </div>
      </Modal>
    </div>
  );
}
