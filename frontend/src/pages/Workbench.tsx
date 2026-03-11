import { useEffect, useState } from 'react';
import { Button, Card, Tag, Space, message, Modal, Badge, Radio } from 'antd';
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

    // 生成各平台报价
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

      // 更新订单状态为呼叫运力中
      await ordersApi.updateOrderStatus(selectedOrder.id, 'delivery_calling');
      message.info(`正在呼叫${platform?.name}...`);

      setDispatchModalVisible(false);
      setSelectedPlatform('');
      loadOrders();

      // 模拟运力接单（2秒后）
      setTimeout(async () => {
        await ordersApi.dispatchOrder(selectedOrder.id, selectedPlatform);
        await ordersApi.updateOrderStatus(selectedOrder.id, 'delivery_accepted');
        message.success(`${platform?.name}已接单`);
        loadOrders();
      }, 2000);
    } catch (error) {
      message.error('呼叫运力失败');
    }
  };

  const handleMealReady = async (order: Order) => {
    try {
      await ordersApi.setMealReady(order.id);
      message.success('出餐完成，骑手可以取餐了');
      loadOrders();

      // 模拟骑手取餐和配送流程
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

  return (
    <div style={{ padding: '12px', background: '#f5f5f5', minHeight: '100vh' }}>
      {orders.length === 0 && (
        <Card style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ color: '#999', fontSize: 14 }}>暂无订单</p>
          <p style={{ color: '#999', fontSize: 12 }}>订单将自动从上游平台进入</p>
        </Card>
      )}

      {orders.map(order => (
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
                color: statusMap[order.status]?.color === 'success' ? '#52c41a' :
                       statusMap[order.status]?.color === 'processing' ? '#1890ff' :
                       statusMap[order.status]?.color === 'warning' ? '#faad14' : '#666'
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
            {/* 新订单 - 开始制作 */}
            {order.status === 'pending' && (
              <Button
                type="primary"
                block
                size="large"
                onClick={() => handleStartPreparing(order)}
              >
                开始制作
              </Button>
            )}

            {/* 制作中 - 发起配送 */}
            {order.status === 'preparing' && (
              <Button
                type="primary"
                icon={<RocketOutlined />}
                block
                size="large"
                onClick={() => handleCallDelivery(order)}
                style={{ background: '#1890ff', borderColor: '#1890ff' }}
              >
                发起配送
              </Button>
            )}

            {/* 呼叫运力中 */}
            {order.status === 'delivery_calling' && (
              <div style={{ textAlign: 'center', padding: '12px', background: '#e6f7ff', borderRadius: 4 }}>
                <span style={{ color: '#1890ff', fontSize: 13 }}>⏳ 正在呼叫运力平台...</span>
              </div>
            )}

            {/* 运力已接单 - 出餐 */}
            {order.status === 'delivery_accepted' && (
              <Button
                type="primary"
                icon={<CheckOutlined />}
                block
                size="large"
                onClick={() => handleMealReady(order)}
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
              >
                出餐
              </Button>
            )}

            {/* 配送中的状态显示 */}
            {['ready', 'picked_up', 'delivering'].includes(order.status) && (
              <div style={{ textAlign: 'center', padding: '12px', background: '#f6ffed', borderRadius: 4 }}>
                <span style={{ color: '#52c41a', fontSize: 13 }}>✓ {statusMap[order.status]?.text}</span>
              </div>
            )}

            {/* 已完成 */}
            {order.status === 'delivered' && (
              <div style={{ textAlign: 'center', padding: '12px', background: '#f6ffed', borderRadius: 4 }}>
                <span style={{ color: '#52c41a', fontSize: 14, fontWeight: 'bold' }}>✓ 订单已完成</span>
              </div>
            )}
          </Space>
        </Card>
      ))}

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
