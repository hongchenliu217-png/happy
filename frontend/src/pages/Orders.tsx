import { useState, useEffect } from 'react';
import { Tabs, Button, Card, Tag, Space, message, Modal, Badge, Radio } from 'antd';
import { CheckOutlined, PlusOutlined, ClockCircleOutlined, ThunderboltOutlined, RocketOutlined } from '@ant-design/icons';
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

      // 更新订单状态为呼叫运力中（待抢单）
      await ordersApi.updateOrderStatus(selectedOrder.id, 'delivery_calling');
      message.info(`正在呼叫${platform?.name}，等待骑手接单...`);

      setDispatchModalVisible(false);
      setSelectedPlatform('');
      loadOrders();

      // 模拟运力接单（5秒后）
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
      style={{ marginBottom: 12, borderRadius: 8 }}
      bodyStyle={{ padding: 12 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Space>
          <Tag color={sourceMap[order.source]?.color || 'default'} style={{ margin: 0, fontSize: 13, fontWeight: 'bold' }}>
            {sourceMap[order.source]?.text || order.source}
          </Tag>
          <span style={{ fontSize: 11, color: '#999' }}>{order.orderNo?.slice(-8)}</span>
        </Space>
        <Badge
          status={
            statusMap[order.status]?.color === 'success' ? 'success' :
            statusMap[order.status]?.color === 'processing' ? 'processing' :
            statusMap[order.status]?.color === 'warning' ? 'warning' :
            'default'
          }
          text={<span style={{
            fontSize: 12,
            fontWeight: 'bold',
            color: statusMap[order.status]?.color === 'success' ? '#5AB572' :
                   statusMap[order.status]?.color === 'processing' ? '#4A90E2' :
                   statusMap[order.status]?.color === 'warning' ? '#F5A623' : '#666'
          }}>
            {statusMap[order.status]?.text}
          </span>}
        />
      </div>

      <div style={{ fontSize: 13, color: '#333', marginBottom: 8 }}>
        <div style={{ marginBottom: 4 }}>
          <strong>{order.customerName}</strong> <span style={{ color: '#999', fontSize: 12 }}>{order.customerPhone}</span>
        </div>
        <div style={{ color: '#666', fontSize: 12 }}>
          📍 {order.deliveryAddress}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '8px 0', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
        <span style={{ fontSize: 12, color: '#666' }}>
          <ClockCircleOutlined /> {dayjs(order.createdAt).format('HH:mm:ss')}
        </span>
        <span style={{ fontSize: 16, fontWeight: 'bold', color: '#ff4d4f' }}>
          ¥{order.totalAmount}
        </span>
      </div>

      <Space style={{ width: '100%' }} direction="vertical" size={8}>
        {/* 新订单 - 发起配送 + 出餐 */}
        {order.status === 'pending' && (
          <>
            <Button
              type="primary"
              icon={<RocketOutlined />}
              block
              size="large"
              onClick={() => handleCallDelivery(order)}
              style={{ background: '#4A90E2', borderColor: '#4A90E2' }}
            >
              发起配送
            </Button>
            <Button
              icon={<CheckOutlined />}
              block
              size="large"
              onClick={() => handleMealReady(order)}
              style={{ borderColor: '#d9d9d9', color: '#666' }}
            >
              出餐
            </Button>
          </>
        )}

        {/* 待抢单 - 呼叫运力中 + 出餐 */}
        {order.status === 'delivery_calling' && (
          <>
            <div style={{ textAlign: 'center', padding: '12px', background: '#E8F4FD', borderRadius: 4, marginBottom: 8 }}>
              <span style={{ color: '#4A90E2', fontSize: 13 }}>⏳ 等待骑手接单...</span>
            </div>
            <Button
              icon={<CheckOutlined />}
              block
              size="large"
              onClick={() => handleMealReady(order)}
              style={{ borderColor: '#d9d9d9', color: '#666' }}
            >
              出餐
            </Button>
          </>
        )}

        {/* 待取货 - 运力已接单 + 出餐 */}
        {order.status === 'delivery_accepted' && (
          <>
            <div style={{ textAlign: 'center', padding: '12px', background: '#F0F9F4', borderRadius: 4, marginBottom: 8 }}>
              <span style={{ color: '#5AB572', fontSize: 13 }}>✓ 骑手已接单</span>
            </div>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              block
              size="large"
              onClick={() => handleMealReady(order)}
              style={{ background: '#5AB572', borderColor: '#5AB572' }}
            >
              出餐
            </Button>
          </>
        )}

        {/* 配送中的状态显示 */}
        {['ready', 'picked_up', 'delivering'].includes(order.status) && (
          <div style={{ textAlign: 'center', padding: '12px', background: '#F0F9F4', borderRadius: 4 }}>
            <span style={{ color: '#5AB572', fontSize: 13 }}>✓ {statusMap[order.status]?.text}</span>
          </div>
        )}

        {/* 已完成 */}
        {order.status === 'delivered' && (
          <div style={{ textAlign: 'center', padding: '12px', background: '#F0F9F4', borderRadius: 4 }}>
            <span style={{ color: '#5AB572', fontSize: 14, fontWeight: 'bold' }}>✓ 订单已完成</span>
          </div>
        )}
      </Space>
    </Card>
  );

  const tabItems = [
    { key: 'new', label: '新订单' },
    { key: 'pre', label: '预订单' },
    { key: 'waiting', label: '待抢单' },
    { key: 'pickup', label: '待取货' },
    { key: 'delivering', label: '配送中' },
    { key: 'exception', label: '异常' },
    { key: 'refund', label: '退款' }
  ];

  const filteredOrders = filterOrdersByTab(activeTab);

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ background: '#fff', position: 'sticky', top: 64, zIndex: 999 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          style={{ margin: 0 }}
          tabBarStyle={{ margin: '0 12px', paddingTop: 8 }}
        />
      </div>

      <div style={{ padding: '12px' }}>
        <div style={{ marginBottom: 12 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={simulateOrder}
            loading={loading}
            block
            size="large"
            style={{ height: 48, fontSize: 16, fontWeight: 'bold', background: '#4A90E2', borderColor: '#4A90E2' }}
          >
            模拟上游订单自动进入
          </Button>
        </div>

        {filteredOrders.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ color: '#999', fontSize: 14 }}>暂无订单</p>
            <p style={{ color: '#999', fontSize: 12 }}>点击上方按钮模拟上游订单自动进入</p>
          </Card>
        ) : (
          filteredOrders.map(renderOrderCard)
        )}
      </div>

      <Modal
        title="选择运力平台"
        open={dispatchModalVisible}
        onCancel={() => {
          setDispatchModalVisible(false);
          setSelectedOrder(null);
          setSelectedPlatform('');
        }}
        footer={null}
        width="90%"
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ marginBottom: 12, color: '#666', fontSize: 13 }}>各平台实时报价：</p>

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
                    padding: '12px',
                    textAlign: 'left',
                    borderRadius: 8
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 4 }}>
                        {platform.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#999' }}>
                        预计{platform.estimatedTime}分钟 · {platform.distance}km
                      </div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 'bold', color: '#ff4d4f' }}>
                      ¥{platform.price}
                    </div>
                  </div>
                </Radio.Button>
              ))}
            </Space>
          </Radio.Group>
        </div>

        <Button
          type="primary"
          icon={<ThunderboltOutlined />}
          block
          size="large"
          onClick={confirmDispatch}
          disabled={!selectedPlatform}
        >
          呼叫选定平台
        </Button>

        <p style={{ fontSize: 11, color: '#999', marginTop: 12, textAlign: 'center' }}>
          选择运力平台后点击呼叫，等待平台接单
        </p>
      </Modal>
    </div>
  );
}
