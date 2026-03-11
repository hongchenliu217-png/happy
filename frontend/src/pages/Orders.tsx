import { useState, useEffect, useRef } from 'react';
import { Tabs, Button, Card, Tag, Space, message, Modal, Badge, Radio, Row, Col, Statistic, Empty, Select, Switch } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  CheckOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  ShoppingOutlined,
  DollarOutlined,
  TruckOutlined,
  WarningOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  TeamOutlined
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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('new');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dispatchModalVisible, setDispatchModalVisible] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [platformPrices, setPlatformPrices] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [paused, setPaused] = useState(false);
  const [autoResumeEnabled, setAutoResumeEnabled] = useState(true);
  const [stationStatus, setStationStatus] = useState<any>(null); // 驻店状态
  const [autoResumeMinutes, setAutoResumeMinutes] = useState(30);
  const [pauseTimer, setPauseTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [autoDispatchEnabled, setAutoDispatchEnabled] = useState(false);
  const processedOrderIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  useEffect(() => {
    const init = async () => {
      // 先加载平台数据
      await loadPlatforms();

      // 检查是否启用自动发起配送
      try {
        const saved = localStorage.getItem('deliverySettings');
        if (saved) {
          const settings = JSON.parse(saved);
          setAutoDispatchEnabled(true);
          console.log('✅ 自动发起配送已启用，策略:', settings.dispatchStrategy);
        }
      } catch {}

      // 然后加载订单
      await loadOrders();
      loadStationStatus();
    };

    init();

    const interval = setInterval(() => {
      loadOrders();
      loadStationStatus();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    return () => { if (pauseTimer) clearTimeout(pauseTimer); };
  }, [pauseTimer]);

  const togglePause = () => {
    if (!paused) {
      setPaused(true);
      message.warning('已暂停接单');
      if (autoResumeEnabled) {
        const timer = setTimeout(() => {
          setPaused(false);
          message.success('已自动恢复接单');
        }, autoResumeMinutes * 60 * 1000);
        setPauseTimer(timer);
      }
    } else {
      setPaused(false);
      if (pauseTimer) { clearTimeout(pauseTimer); setPauseTimer(null); }
      message.success('已恢复接单');
    }
  };

  const loadOrders = async () => {
    try {
      const { data } = await ordersApi.getOrders();
      const newOrders = data.orders;

      console.log(`📊 订单轮询: 总数=${newOrders.length}, autoDispatchEnabled=${autoDispatchEnabled}, platforms=${platforms.length}, isFirstLoad=${isFirstLoad.current}`);

      // 检查是否有新的 pending 订单需要自动发起配送
      if (autoDispatchEnabled && platforms.length > 0) {
        const allPendingOrders = newOrders.filter((order: Order) => order.status === 'pending');
        const currentPendingIds = new Set(allPendingOrders.map(o => o.id));

        // 清理已经不是 pending 状态的订单ID
        const oldProcessedIds = Array.from(processedOrderIds.current);
        oldProcessedIds.forEach(id => {
          if (!currentPendingIds.has(id)) {
            processedOrderIds.current.delete(id);
          }
        });

        const newPendingOrders = allPendingOrders.filter((order: Order) => !processedOrderIds.current.has(order.id));

        console.log(`📋 Pending订单: 总数=${allPendingOrders.length}, 新订单=${newPendingOrders.length}, 已处理=${processedOrderIds.current.size}`);

        if (newPendingOrders.length > 0) {
          // 首次加载时，只处理最新的订单，避免处理历史订单
          if (isFirstLoad.current) {
            console.log(`⏭️ 首次加载，跳过 ${newPendingOrders.length} 个历史订单`);
            newPendingOrders.forEach(order => processedOrderIds.current.add(order.id));
            isFirstLoad.current = false;
          } else {
            console.log(`🚀 检测到 ${newPendingOrders.length} 个新订单，准备自动发起配送`);
            autoDispatchOrders(newPendingOrders);
          }
        } else if (isFirstLoad.current) {
          isFirstLoad.current = false;
        }
      }

      setOrders(newOrders);
    } catch (error) {
      console.error('❌ 加载订单失败:', error);
    }
  };

  const loadPlatforms = async () => {
    try {
      const { data } = await client.get('/platforms?type=downstream');
      setPlatforms(data);
      console.log('✅ 运力平台已加载:', data.length, '个');
    } catch (error) {
      console.error('❌ 加载平台失败:', error);
    }
  };

  const loadStationStatus = async () => {
    // TODO: 从后端加载驻店状态
    // 这里先用mock数据模拟
    const mockStation = {
      active: true,
      rider: {
        name: '张三',
        platform: '闪送'
      },
      remainingMinutes: 83,
      completedOrders: 8
    };
    // setStationStatus(mockStation); // 有驻店时
    setStationStatus(null); // 无驻店时
  };

  // 自动发起配送
  const autoDispatchOrders = async (pendingOrders: Order[]) => {
    try {
      const saved = localStorage.getItem('deliverySettings');
      const deliverySettings = saved ? JSON.parse(saved) : null;

      if (!deliverySettings) {
        console.log('❌ 未找到配送设置');
        return;
      }

      console.log('📋 配送策略:', deliverySettings.dispatchStrategy);

      for (const order of pendingOrders) {
        // 标记为已处理
        processedOrderIds.current.add(order.id);

        // 生成模拟报价
        const prices = platforms.map(p => ({
          ...p,
          price: (Math.random() * 3 + 6).toFixed(1),
          estimatedTime: Math.floor(Math.random() * 10 + 20),
          distance: (Math.random() * 2 + 1).toFixed(1)
        }));

        if (prices.length === 0) continue;

        const strategy = deliverySettings.dispatchStrategy;
        let selectedPlatform: string | null = null;

        if (strategy === 'low-price') {
          // 低价优先
          const cheapest = prices.reduce((a, b) => parseFloat(a.price) < parseFloat(b.price) ? a : b);
          selectedPlatform = cheapest.code;
          console.log(`💰 低价优先: 选择 ${cheapest.name} (¥${cheapest.price})`);
        } else if (strategy === 'fastest') {
          // 速度优先
          const fastest = prices.reduce((a, b) => a.estimatedTime < b.estimatedTime ? a : b);
          selectedPlatform = fastest.code;
          console.log(`⚡ 速度优先: 选择 ${fastest.name} (${fastest.estimatedTime}分钟)`);
        } else if (strategy === 'balanced') {
          // 智能化：按时段策略
          const now = new Date();
          const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          const activeStrategy = deliverySettings.timeBasedStrategies?.find((s: any) => {
            if (!s.enabled) return false;
            return currentTime >= s.startTime && currentTime <= s.endTime;
          });
          if (activeStrategy?.strategy === 'low-price') {
            const cheapest = prices.reduce((a, b) => parseFloat(a.price) < parseFloat(b.price) ? a : b);
            selectedPlatform = cheapest.code;
          } else if (activeStrategy?.strategy === 'fastest') {
            const fastest = prices.reduce((a, b) => a.estimatedTime < b.estimatedTime ? a : b);
            selectedPlatform = fastest.code;
          } else {
            const cheapest = prices.reduce((a, b) => parseFloat(a.price) < parseFloat(b.price) ? a : b);
            selectedPlatform = cheapest.code;
          }
        } else if (strategy === 'custom') {
          // 按距离
          const orderDistance = parseFloat((Math.random() * 2 + 1).toFixed(1));
          const rule = deliverySettings.distanceBasedPlatforms?.find((r: any) =>
            orderDistance >= r.minDistance && orderDistance < r.maxDistance
          );
          if (rule) selectedPlatform = rule.platform;
        }

        if (selectedPlatform) {
          const platform = prices.find(p => p.code === selectedPlatform);

          // 自动发起配送
          await ordersApi.updateOrderStatus(order.id, 'delivery_calling');
          message.info(`订单 ${order.orderNo?.slice(-6)} 自动呼叫${platform?.name}`);
          console.log(`📞 订单 ${order.orderNo} 呼叫 ${platform?.name}`);

          // 模拟运力接单
          setTimeout(async () => {
            try {
              await ordersApi.dispatchOrder(order.id, selectedPlatform!);
              await ordersApi.updateOrderStatus(order.id, 'delivery_accepted');
              message.success(`${platform?.name}骑手已接单`);
              loadOrders();
            } catch {}
          }, 5000);
        }
      }
    } catch (error) {
      console.error('❌ 自动发起配送失败:', error);
    }
  };

  // 计算统计数据
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    pickup: orders.filter(o => o.status === 'delivery_accepted').length,
    delivering: orders.filter(o => ['picked_up', 'delivering'].includes(o.status)).length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    totalAmount: orders.reduce((sum, o) => sum + parseFloat(o.totalAmount || '0'), 0).toFixed(2) as string
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

    // 读取配送设置，自动按策略预选平台
    try {
      const saved = localStorage.getItem('deliverySettings');
      const deliverySettings = saved ? JSON.parse(saved) : null;
      if (deliverySettings && prices.length > 0) {
        const strategy = deliverySettings.dispatchStrategy;
        let recommended: string | null = null;

        if (strategy === 'low-price') {
          // 低价优先：选价格最低的
          const cheapest = prices.reduce((a, b) => parseFloat(a.price) < parseFloat(b.price) ? a : b);
          recommended = cheapest.code;
        } else if (strategy === 'fastest') {
          // 速度优先：选预计时间最短的
          const fastest = prices.reduce((a, b) => a.estimatedTime < b.estimatedTime ? a : b);
          recommended = fastest.code;
        } else if (strategy === 'balanced') {
          // 智能化：按时段策略
          const now = new Date();
          const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          const activeStrategy = deliverySettings.timeBasedStrategies?.find((s: any) => {
            if (!s.enabled) return false;
            return currentTime >= s.startTime && currentTime <= s.endTime;
          });
          if (activeStrategy?.strategy === 'low-price') {
            const cheapest = prices.reduce((a, b) => parseFloat(a.price) < parseFloat(b.price) ? a : b);
            recommended = cheapest.code;
          } else if (activeStrategy?.strategy === 'fastest') {
            const fastest = prices.reduce((a, b) => a.estimatedTime < b.estimatedTime ? a : b);
            recommended = fastest.code;
          } else {
            // 无匹配时段，默认低价
            const cheapest = prices.reduce((a, b) => parseFloat(a.price) < parseFloat(b.price) ? a : b);
            recommended = cheapest.code;
          }
        } else if (strategy === 'custom') {
          // 按距离：取第一个匹配的距离规则
          const orderDistance = parseFloat((Math.random() * 2 + 1).toFixed(1));
          const rule = deliverySettings.distanceBasedPlatforms?.find((r: any) =>
            orderDistance >= r.minDistance && orderDistance < r.maxDistance
          );
          if (rule) recommended = rule.platform;
        }

        if (recommended) setSelectedPlatform(recommended);
      }
    } catch {}

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
        marginBottom: isMobile ? 10 : 12,
        borderRadius: isMobile ? 8 : 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid #f0f0f0'
      }}
      bodyStyle={{ padding: isMobile ? 12 : 16 }}
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
                size={isMobile ? 'middle' : 'large'}
                onClick={() => handleCallDelivery(order)}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  height: isMobile ? 40 : 44,
                  borderRadius: 8,
                  fontWeight: 'bold',
                  fontSize: isMobile ? 13 : 14
                }}
              >
                发起配送
              </Button>
            </Col>
            <Col span={12}>
              <Button
                icon={<CheckOutlined />}
                block
                size={isMobile ? 'middle' : 'large'}
                onClick={() => handleMealReady(order)}
                style={{
                  height: isMobile ? 40 : 44,
                  borderRadius: 8,
                  borderColor: '#d9d9d9',
                  color: '#666',
                  fontSize: isMobile ? 13 : 14
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
              padding: isMobile ? '10px' : '12px',
              background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
              borderRadius: 8,
              marginBottom: 4
            }}>
              <span style={{ color: '#1890ff', fontSize: isMobile ? 12 : 13, fontWeight: 'bold' }}>
                ⏳ 等待骑手接单...
              </span>
            </div>
            <Button
              icon={<CheckOutlined />}
              block
              size={isMobile ? 'middle' : 'large'}
              onClick={() => handleMealReady(order)}
              style={{
                height: isMobile ? 40 : 44,
                borderRadius: 8,
                borderColor: '#d9d9d9',
                color: '#666',
                fontSize: isMobile ? 13 : 14
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
              padding: isMobile ? '10px' : '12px',
              background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
              borderRadius: 8,
              marginBottom: 4
            }}>
              <span style={{ color: '#52c41a', fontSize: isMobile ? 12 : 13, fontWeight: 'bold' }}>
                ✓ 骑手已接单
              </span>
            </div>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              block
              size={isMobile ? 'middle' : 'large'}
              onClick={() => handleMealReady(order)}
              style={{
                background: '#52c41a',
                borderColor: '#52c41a',
                height: isMobile ? 40 : 44,
                borderRadius: 8,
                fontWeight: 'bold',
                fontSize: isMobile ? 13 : 14
              }}
            >
              出餐
            </Button>
          </>
        )}

        {['ready', 'picked_up', 'delivering'].includes(order.status) && (
          <div style={{
            textAlign: 'center',
            padding: isMobile ? '10px' : '12px',
            background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
            borderRadius: 8
          }}>
            <span style={{ color: '#52c41a', fontSize: isMobile ? 12 : 13, fontWeight: 'bold' }}>
              ✓ {statusMap[order.status]?.text}
            </span>
          </div>
        )}

        {order.status === 'delivered' && (
          <div style={{
            textAlign: 'center',
            padding: isMobile ? '14px' : '16px',
            background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
            borderRadius: 8
          }}>
            <span style={{ color: '#52c41a', fontSize: isMobile ? 14 : 15, fontWeight: 'bold' }}>
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
    { key: 'pickup', label: <Badge count={stats.pickup} offset={[10, 0]}><span>待取货</span></Badge> },
    { key: 'delivering', label: <Badge count={stats.delivering} offset={[10, 0]}><span>配送中</span></Badge> },
    { key: 'exception', label: '异常' },
    { key: 'refund', label: '退款' }
  ];

  const filteredOrders = filterOrdersByTab(activeTab);

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', paddingBottom: 20 }}>
      {/* 驻店状态悬浮条 */}
      {stationStatus && (
        <div
          onClick={() => navigate('/mine/station-management')}
          style={{
            background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
            padding: '12px 16px',
            borderBottom: '2px solid #b7eb8f',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Badge status="processing" />
            <TeamOutlined style={{ fontSize: 16, color: '#52c41a' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#52c41a' }}>
              驻店中：{stationStatus.rider.name}({stationStatus.rider.platform})
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            剩余{Math.floor(stationStatus.remainingMinutes / 60)}h{stationStatus.remainingMinutes % 60}m · 已完成{stationStatus.completedOrders}单
          </div>
        </div>
      )}

      {/* 数据概览卡片 */}
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: isMobile ? '16px 12px' : '20px 16px' }}>
        <Row gutter={[12, 12]}>
          <Col xs={12} sm={12} md={6}>
            <Card
              size="small"
              style={{
                borderRadius: isMobile ? 8 : 12,
                border: 'none',
                background: 'rgba(255,255,255,0.95)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              bodyStyle={{ padding: isMobile ? '12px 8px' : '16px 12px' }}
            >
              <Statistic
                title={<span style={{ fontSize: isMobile ? 11 : 12, color: '#666' }}>今日订单</span>}
                value={stats.total}
                prefix={<ShoppingOutlined style={{ color: '#1890ff', fontSize: isMobile ? 16 : 20 }} />}
                valueStyle={{ fontSize: isMobile ? 20 : 24, fontWeight: 'bold', color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card
              size="small"
              style={{
                borderRadius: isMobile ? 8 : 12,
                border: 'none',
                background: 'rgba(255,255,255,0.95)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              bodyStyle={{ padding: isMobile ? '12px 8px' : '16px 12px' }}
            >
              <Statistic
                title={<span style={{ fontSize: isMobile ? 11 : 12, color: '#666' }}>待处理</span>}
                value={stats.pending}
                prefix={<WarningOutlined style={{ color: '#faad14', fontSize: isMobile ? 16 : 20 }} />}
                valueStyle={{ fontSize: isMobile ? 20 : 24, fontWeight: 'bold', color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card
              size="small"
              style={{
                borderRadius: isMobile ? 8 : 12,
                border: 'none',
                background: 'rgba(255,255,255,0.95)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              bodyStyle={{ padding: isMobile ? '12px 8px' : '16px 12px' }}
            >
              <Statistic
                title={<span style={{ fontSize: isMobile ? 11 : 12, color: '#666' }}>配送中</span>}
                value={stats.delivering}
                prefix={<TruckOutlined style={{ color: '#52c41a', fontSize: isMobile ? 16 : 20 }} />}
                valueStyle={{ fontSize: isMobile ? 20 : 24, fontWeight: 'bold', color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card
              size="small"
              style={{
                borderRadius: isMobile ? 8 : 12,
                border: 'none',
                background: 'rgba(255,255,255,0.95)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                height: '100%'
              }}
              bodyStyle={{ padding: isMobile ? '12px 8px' : '16px 12px' }}
            >
              <div style={{ fontSize: isMobile ? 11 : 12, color: '#666', marginBottom: 4 }}>今日营收</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <DollarOutlined style={{ color: '#ff4d4f', fontSize: isMobile ? 16 : 20, flexShrink: 0 }} />
                <span style={{
                  fontWeight: 'bold',
                  color: '#ff4d4f',
                  fontSize: isMobile ? 20 : 24,
                  lineHeight: 1.2,
                  transform: parseFloat(stats.totalAmount) >= 10000
                    ? 'scale(0.7)'
                    : parseFloat(stats.totalAmount) >= 1000
                    ? 'scale(0.85)'
                    : 'scale(1)',
                  transformOrigin: 'left center',
                  display: 'inline-block'
                }}>
                  {parseFloat(stats.totalAmount).toFixed(2)}
                </span>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* 标签页 */}
      <div style={{ background: '#fff', position: 'sticky', top: isMobile ? 0 : 64, zIndex: 999, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          style={{ margin: 0 }}
          tabBarStyle={{ margin: isMobile ? '0 8px' : '0 16px', paddingTop: 8, fontSize: isMobile ? 13 : 14 }}
        />
      </div>

      {/* 暂停接单状态栏 */}
      {paused && (
        <div style={{
          margin: '0 12px', padding: '10px 14px', borderRadius: 10,
          background: 'linear-gradient(135deg, #fff1f0 0%, #fff0e6 100%)',
          border: '1px solid #ffccc7',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PauseCircleOutlined style={{ fontSize: 18, color: '#ff4d4f' }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#cf1322' }}>已暂停接单</div>
              <div style={{ fontSize: 11, color: '#999' }}>
                {autoResumeEnabled ? `${autoResumeMinutes}分钟后自动恢复` : '需手动恢复'}
              </div>
            </div>
          </div>
          <Button type="primary" size="small" onClick={togglePause} style={{ borderRadius: 8 }}>
            恢复接单
          </Button>
        </div>
      )}

      {/* 订单列表 */}
      <div style={{ padding: isMobile ? '12px' : '16px' }}>
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
                    订单将自动从上游平台进入
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
          <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 'bold' }}>
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
            size={isMobile ? 'middle' : 'large'}
            block
            onClick={confirmDispatch}
            disabled={!selectedPlatform}
            style={{
              height: isMobile ? 44 : 48,
              fontSize: isMobile ? 15 : 16,
              fontWeight: 'bold',
              borderRadius: 8,
              background: selectedPlatform ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : undefined,
              border: 'none'
            }}
          >
            确认派单
          </Button>
        }
        width={isMobile ? '95%' : '90%'}
        style={{ maxWidth: 500 }}
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ marginBottom: 16, color: '#666', fontSize: isMobile ? 13 : 14, fontWeight: 'bold' }}>
            各平台实时报价：
            {selectedPlatform && (
              <span style={{ fontSize: 11, color: '#52c41a', fontWeight: 'normal', marginLeft: 8 }}>
                ✓ 已按配送策略自动推荐
              </span>
            )}
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
                    padding: isMobile ? 12 : 16,
                    borderRadius: 8,
                    border: selectedPlatform === platform.code ? '2px solid #1890ff' : '1px solid #d9d9d9',
                    background: selectedPlatform === platform.code ? '#e6f7ff' : 'white'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 'bold', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {platform.name}
                        {selectedPlatform === platform.code && (
                          <Tag color="blue" style={{ fontSize: 10, lineHeight: '16px', borderRadius: 8, margin: 0, padding: '0 6px' }}>推荐</Tag>
                        )}
                      </div>
                      <Space size={isMobile ? 12 : 16}>
                        <span style={{ fontSize: isMobile ? 11 : 12, color: '#999' }}>
                          预计 {platform.estimatedTime} 分钟
                        </span>
                        <span style={{ fontSize: isMobile ? 11 : 12, color: '#999' }}>
                          {platform.distance} 公里
                        </span>
                      </Space>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 'bold', color: '#ff4d4f' }}>
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
