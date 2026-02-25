import { useState, useEffect } from 'react';
import {
  Card,
  Switch,
  Radio,
  InputNumber,
  Slider,
  Button,
  Space,
  Divider,
  message,
  List,
  Tag,
  Select,
  Row,
  Col,
  TimePicker,
  Collapse,
  Input
} from 'antd';
import {
  ThunderboltOutlined,
  DollarOutlined,
  SettingOutlined,
  SaveOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  CarOutlined,
  PlusOutlined,
  DeleteOutlined,
  FieldTimeOutlined,
  SyncOutlined,
  ReloadOutlined,
  RocketOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

interface DistanceBasedPlatform {
  id: string;
  minDistance: number;
  maxDistance: number;
  platform: string;
}

// 分时段配送策略
interface TimeBasedStrategy {
  id: string;
  name: string;
  startTime: string; // HH:mm format
  endTime: string;
  strategy: 'low-price' | 'fastest' | 'balanced';
  enabled: boolean;
}

// 订单金额分级
interface OrderAmountTier {
  id: string;
  minAmount: number;
  maxAmount: number;
  strategy: 'low-price' | 'fastest' | 'balanced' | 'reliable';
  platformPreference?: string; // 可选的平台偏好
}

// 重试策略
interface RetryStrategy {
  enabled: boolean;
  maxRetries: number;
  retryInterval: number; // 秒
  autoSwitchPlatform: boolean;
  fallbackToSelfDelivery: boolean;
}

interface DeliverySettings {
  // 派单策略
  dispatchStrategy: 'low-price' | 'fastest' | 'balanced' | 'custom';

  // 配送平台优先级
  platformPriority: string[]; // ['dada', 'sf', 'shansong']

  // 距离分段配送平台
  distanceBasedPlatforms: DistanceBasedPlatform[];

  // 分时段配送策略
  timeBasedStrategies: TimeBasedStrategy[];
  enableTimeBasedStrategy: boolean;

  // 订单金额分级
  orderAmountTiers: OrderAmountTier[];
  enableOrderAmountTier: boolean;

  // 策略优先级（当时段策略和金额分级同时启用时）
  strategyPriority: 'time-based' | 'amount-based';

  // 多平台并发询价
  concurrentPricing: boolean;
  concurrentPricingTimeout: number; // 秒

  // 重试策略
  retryStrategy: RetryStrategy;

  // 自配送设置
  prioritySelfDelivery: boolean;
  selfDeliveryAutoFallback: boolean;
  selfDeliveryMaxOrders: number;

  // 费用控制
  maxDeliveryFee: number;
  lowPriceDispatch: boolean;
  budgetAlertThreshold: number;

  // 配送范围
  maxDeliveryDistance: number;
  enableAreaRestriction: boolean;

  // 超时设置
  deliveryTimeoutAlert: boolean;
  timeoutMinutes: number;
  autoCancelTimeout: boolean;

  // 其他设置
  smartDispatch: boolean;
  peakHourBoost: boolean;
}

const platformNames: Record<string, string> = {
  dada: '达达配送',
  sf: '顺丰同城',
  shansong: '闪送'
};

export default function DeliverySettings() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [settings, setSettings] = useState<DeliverySettings>({
    dispatchStrategy: 'balanced',
    platformPriority: ['dada', 'sf', 'shansong'],
    distanceBasedPlatforms: [
      { id: '1', minDistance: 0, maxDistance: 3, platform: 'dada' },
      { id: '2', minDistance: 3, maxDistance: 5, platform: 'sf' },
      { id: '3', minDistance: 5, maxDistance: 10, platform: 'shansong' }
    ],
    // 分时段策略
    timeBasedStrategies: [
      { id: '1', name: '早餐时段', startTime: '07:00', endTime: '09:00', strategy: 'fastest', enabled: true },
      { id: '2', name: '午餐高峰', startTime: '11:00', endTime: '13:00', strategy: 'balanced', enabled: true },
      { id: '3', name: '晚餐高峰', startTime: '17:00', endTime: '20:00', strategy: 'balanced', enabled: true },
      { id: '4', name: '夜宵时段', startTime: '21:00', endTime: '23:59', strategy: 'low-price', enabled: false }
    ],
    enableTimeBasedStrategy: false,
    // 订单金额分级
    orderAmountTiers: [
      { id: '1', minAmount: 0, maxAmount: 30, strategy: 'low-price' },
      { id: '2', minAmount: 30, maxAmount: 100, strategy: 'balanced' },
      { id: '3', minAmount: 100, maxAmount: 999999, strategy: 'reliable', platformPreference: 'sf' }
    ],
    enableOrderAmountTier: false,
    // 策略优先级
    strategyPriority: 'amount-based',
    // 并发询价
    concurrentPricing: false,
    concurrentPricingTimeout: 10,
    // 重试策略
    retryStrategy: {
      enabled: true,
      maxRetries: 3,
      retryInterval: 30,
      autoSwitchPlatform: true,
      fallbackToSelfDelivery: false
    },
    prioritySelfDelivery: true,
    selfDeliveryAutoFallback: true,
    selfDeliveryMaxOrders: 10,
    maxDeliveryFee: 15,
    lowPriceDispatch: true,
    budgetAlertThreshold: 1000,
    maxDeliveryDistance: 5,
    enableAreaRestriction: false,
    deliveryTimeoutAlert: true,
    timeoutMinutes: 60,
    autoCancelTimeout: false,
    smartDispatch: true,
    peakHourBoost: false
  });

  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: 调用API保存设置
      await new Promise(resolve => setTimeout(resolve, 500));
      message.success('配送设置已保存');
    } catch (error) {
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = (updates: Partial<DeliverySettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const addDistanceRule = () => {
    const lastRule = settings.distanceBasedPlatforms[settings.distanceBasedPlatforms.length - 1];
    const newRule: DistanceBasedPlatform = {
      id: Date.now().toString(),
      minDistance: lastRule ? lastRule.maxDistance : 0,
      maxDistance: lastRule ? lastRule.maxDistance + 3 : 3,
      platform: 'dada'
    };
    updateSettings({
      distanceBasedPlatforms: [...settings.distanceBasedPlatforms, newRule]
    });
  };

  const removeDistanceRule = (id: string) => {
    updateSettings({
      distanceBasedPlatforms: settings.distanceBasedPlatforms.filter(rule => rule.id !== id)
    });
  };

  const updateDistanceRule = (id: string, updates: Partial<DistanceBasedPlatform>) => {
    updateSettings({
      distanceBasedPlatforms: settings.distanceBasedPlatforms.map(rule =>
        rule.id === id ? { ...rule, ...updates } : rule
      )
    });
  };

  // 时段策略管理
  const addTimeStrategy = () => {
    const newStrategy: TimeBasedStrategy = {
      id: Date.now().toString(),
      name: '新时段',
      startTime: '00:00',
      endTime: '23:59',
      strategy: 'balanced',
      enabled: true
    };
    updateSettings({
      timeBasedStrategies: [...settings.timeBasedStrategies, newStrategy]
    });
  };

  const removeTimeStrategy = (id: string) => {
    updateSettings({
      timeBasedStrategies: settings.timeBasedStrategies.filter(s => s.id !== id)
    });
  };

  const updateTimeStrategy = (id: string, updates: Partial<TimeBasedStrategy>) => {
    updateSettings({
      timeBasedStrategies: settings.timeBasedStrategies.map(s =>
        s.id === id ? { ...s, ...updates } : s
      )
    });
  };

  // 订单金额分级管理
  const addAmountTier = () => {
    const lastTier = settings.orderAmountTiers[settings.orderAmountTiers.length - 1];
    const newTier: OrderAmountTier = {
      id: Date.now().toString(),
      minAmount: lastTier ? lastTier.maxAmount : 0,
      maxAmount: lastTier ? lastTier.maxAmount + 50 : 50,
      strategy: 'balanced'
    };
    updateSettings({
      orderAmountTiers: [...settings.orderAmountTiers, newTier]
    });
  };

  const removeAmountTier = (id: string) => {
    updateSettings({
      orderAmountTiers: settings.orderAmountTiers.filter(t => t.id !== id)
    });
  };

  const updateAmountTier = (id: string, updates: Partial<OrderAmountTier>) => {
    updateSettings({
      orderAmountTiers: settings.orderAmountTiers.map(t =>
        t.id === id ? { ...t, ...updates } : t
      )
    });
  };

  return (
    <div style={{ padding: '16px', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>配送设置</h2>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={loading}
          onClick={handleSave}
        >
          保存设置
        </Button>
      </div>

      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* 策略说明卡片 */}
        <Card
          size="small"
          style={{
            background: '#ffffff',
            border: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
          bodyStyle={{ padding: isMobile ? 16 : 20 }}
        >
          <div style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 16, color: '#262626' }}>
            配送策略说明
          </div>
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12} md={6}>
              <div
                style={{
                  padding: isMobile ? 14 : 16,
                  background: 'linear-gradient(135deg, #fff7e6 0%, #fffbf0 100%)',
                  borderRadius: 8,
                  border: '1px solid #ffe7ba',
                  transition: 'all 0.3s',
                  height: '100%'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(250, 173, 20, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10,
                  boxShadow: '0 2px 4px rgba(250, 173, 20, 0.1)'
                }}>
                  <DollarOutlined style={{ fontSize: 18, color: '#fa8c16' }} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 6, color: '#262626' }}>
                  低价优先
                </div>
                <div style={{ fontSize: 12, color: '#8c8c8c', lineHeight: 1.6 }}>
                  只看价格，选最便宜的<br/>
                  <span style={{ color: '#fa8c16', fontSize: 11 }}>适合非高峰期订单</span>
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div
                style={{
                  padding: isMobile ? 14 : 16,
                  background: 'linear-gradient(135deg, #f6ffed 0%, #fcffe6 100%)',
                  borderRadius: 8,
                  border: '2px solid #52c41a',
                  transition: 'all 0.3s',
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(82, 196, 26, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(82, 196, 26, 0.1)';
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  background: '#52c41a',
                  color: '#fff',
                  fontSize: 10,
                  padding: '2px 8px',
                  borderRadius: 10,
                  fontWeight: 'bold'
                }}>
                  推荐
                </div>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10,
                  boxShadow: '0 2px 4px rgba(82, 196, 26, 0.1)'
                }}>
                  <ThunderboltOutlined style={{ fontSize: 18, color: '#52c41a' }} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 6, color: '#52c41a' }}>
                  平衡模式
                </div>
                <div style={{ fontSize: 12, color: '#8c8c8c', lineHeight: 1.6 }}>
                  价格和速度都考虑，性价比高<br/>
                  <span style={{ color: '#52c41a', fontSize: 11 }}>适合大多数日常订单</span>
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div
                style={{
                  padding: isMobile ? 14 : 16,
                  background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%)',
                  borderRadius: 8,
                  border: '1px solid #91d5ff',
                  transition: 'all 0.3s',
                  height: '100%'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10,
                  boxShadow: '0 2px 4px rgba(24, 144, 255, 0.1)'
                }}>
                  <RocketOutlined style={{ fontSize: 18, color: '#1890ff' }} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 6, color: '#262626' }}>
                  速度优先
                </div>
                <div style={{ fontSize: 12, color: '#8c8c8c', lineHeight: 1.6 }}>
                  只看速度，选最快的<br/>
                  <span style={{ color: '#1890ff', fontSize: 11 }}>适合高峰期订单</span>
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div style={{
                padding: isMobile ? 14 : 16,
                background: 'linear-gradient(135deg, #f9f0ff 0%, #faf5ff 100%)',
                borderRadius: 8,
                border: '1px solid #d3adf7',
                transition: 'all 0.3s',
                cursor: 'pointer',
                height: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(114, 46, 209, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10,
                  boxShadow: '0 2px 4px rgba(114, 46, 209, 0.1)'
                }}>
                  <SafetyOutlined style={{ fontSize: 18, color: '#722ed1' }} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 6, color: '#262626' }}>
                  品质保障
                </div>
                <div style={{ fontSize: 12, color: '#8c8c8c', lineHeight: 1.6 }}>
                  只选零投诉、高评分平台<br/>
                  <span style={{ color: '#722ed1', fontSize: 11 }}>适合贵重物品</span>
                </div>
              </div>
            </Col>
          </Row>
        </Card>

        {/* 派单策略 */}
        <Card
          size="small"
          style={{
            background: '#ffffff',
            border: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
          bodyStyle={{ padding: isMobile ? 16 : 20 }}
        >
          <div style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 16, color: '#262626' }}>
            <ThunderboltOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            派单策略
          </div>
          <div style={{ marginBottom: 12, color: '#8c8c8c', fontSize: 13 }}>
            选择派单优先策略
          </div>

          <Row gutter={[12, 12]}>
            {/* 低价优先 */}
            <Col xs={24} sm={12} md={12} lg={12}>
              <div
                onClick={() => updateSettings({ dispatchStrategy: 'low-price' })}
                style={{
                  padding: isMobile ? 14 : 16,
                  background: settings.dispatchStrategy === 'low-price'
                    ? 'linear-gradient(135deg, #fff7e6 0%, #fffbf0 100%)'
                    : '#fafafa',
                  borderRadius: 8,
                  border: settings.dispatchStrategy === 'low-price'
                    ? '2px solid #fa8c16'
                    : '2px solid #e8e8e8',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (settings.dispatchStrategy !== 'low-price') {
                    e.currentTarget.style.borderColor = '#d9d9d9';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (settings.dispatchStrategy !== 'low-price') {
                    e.currentTarget.style.borderColor = '#e8e8e8';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {settings.dispatchStrategy === 'low-price' && (
                  <div style={{
                    position: 'absolute',
                    top: -1,
                    right: -1,
                    width: 0,
                    height: 0,
                    borderStyle: 'solid',
                    borderWidth: '0 32px 32px 0',
                    borderColor: 'transparent #fa8c16 transparent transparent',
                    borderRadius: '0 6px 0 0'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: 2,
                      right: -28,
                      color: '#fff',
                      fontSize: 14
                    }}>✓</div>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: settings.dispatchStrategy === 'low-price' ? '#fff' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                    boxShadow: '0 2px 4px rgba(250, 140, 22, 0.1)'
                  }}>
                    <DollarOutlined style={{ fontSize: 16, color: '#fa8c16' }} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 'bold', color: '#262626' }}>
                    低价优先
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#8c8c8c', lineHeight: 1.6, paddingLeft: 42 }}>
                  自动选择配送费最低的平台
                </div>
              </div>
            </Col>

            {/* 速度优先 */}
            <Col xs={24} sm={12} md={12} lg={12}>
              <div
                onClick={() => updateSettings({ dispatchStrategy: 'fastest' })}
                style={{
                  padding: isMobile ? 14 : 16,
                  background: settings.dispatchStrategy === 'fastest'
                    ? 'linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%)'
                    : '#fafafa',
                  borderRadius: 8,
                  border: settings.dispatchStrategy === 'fastest'
                    ? '2px solid #1890ff'
                    : '2px solid #e8e8e8',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (settings.dispatchStrategy !== 'fastest') {
                    e.currentTarget.style.borderColor = '#d9d9d9';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (settings.dispatchStrategy !== 'fastest') {
                    e.currentTarget.style.borderColor = '#e8e8e8';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {settings.dispatchStrategy === 'fastest' && (
                  <div style={{
                    position: 'absolute',
                    top: -1,
                    right: -1,
                    width: 0,
                    height: 0,
                    borderStyle: 'solid',
                    borderWidth: '0 32px 32px 0',
                    borderColor: 'transparent #1890ff transparent transparent',
                    borderRadius: '0 6px 0 0'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: 2,
                      right: -28,
                      color: '#fff',
                      fontSize: 14
                    }}>✓</div>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                    boxShadow: '0 2px 4px rgba(24, 144, 255, 0.1)'
                  }}>
                    <RocketOutlined style={{ fontSize: 16, color: '#1890ff' }} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 'bold', color: '#262626' }}>
                    速度优先
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#8c8c8c', lineHeight: 1.6, paddingLeft: 42 }}>
                  优先选择配送速度最快的平台
                </div>
              </div>
            </Col>

            {/* 平衡模式 */}
            <Col xs={24} sm={12} md={12} lg={12}>
              <div
                onClick={() => updateSettings({ dispatchStrategy: 'balanced' })}
                style={{
                  padding: isMobile ? 14 : 16,
                  background: settings.dispatchStrategy === 'balanced'
                    ? 'linear-gradient(135deg, #f6ffed 0%, #fcffe6 100%)'
                    : '#fafafa',
                  borderRadius: 8,
                  border: settings.dispatchStrategy === 'balanced'
                    ? '2px solid #52c41a'
                    : '2px solid #e8e8e8',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (settings.dispatchStrategy !== 'balanced') {
                    e.currentTarget.style.borderColor = '#d9d9d9';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (settings.dispatchStrategy !== 'balanced') {
                    e.currentTarget.style.borderColor = '#e8e8e8';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {settings.dispatchStrategy === 'balanced' && (
                  <div style={{
                    position: 'absolute',
                    top: -1,
                    right: -1,
                    width: 0,
                    height: 0,
                    borderStyle: 'solid',
                    borderWidth: '0 32px 32px 0',
                    borderColor: 'transparent #52c41a transparent transparent',
                    borderRadius: '0 6px 0 0'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: 2,
                      right: -28,
                      color: '#fff',
                      fontSize: 14
                    }}>✓</div>
                  </div>
                )}
                <div style={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  background: '#52c41a',
                  color: '#fff',
                  fontSize: 10,
                  padding: '2px 8px',
                  borderRadius: 10,
                  fontWeight: 'bold'
                }}>
                  推荐
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                    boxShadow: '0 2px 4px rgba(82, 196, 26, 0.1)'
                  }}>
                    <ThunderboltOutlined style={{ fontSize: 16, color: '#52c41a' }} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 'bold', color: '#262626' }}>
                    平衡模式
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#8c8c8c', lineHeight: 1.6, paddingLeft: 42 }}>
                  综合考虑价格和速度，自动选择性价比最优方案
                </div>
              </div>
            </Col>

            {/* 自定义 */}
            <Col xs={24} sm={12} md={12} lg={12}>
              <div
                onClick={() => updateSettings({ dispatchStrategy: 'custom' })}
                style={{
                  padding: isMobile ? 14 : 16,
                  background: settings.dispatchStrategy === 'custom'
                    ? 'linear-gradient(135deg, #f9f0ff 0%, #faf5ff 100%)'
                    : '#fafafa',
                  borderRadius: 8,
                  border: settings.dispatchStrategy === 'custom'
                    ? '2px solid #722ed1'
                    : '2px solid #e8e8e8',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (settings.dispatchStrategy !== 'custom') {
                    e.currentTarget.style.borderColor = '#d9d9d9';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (settings.dispatchStrategy !== 'custom') {
                    e.currentTarget.style.borderColor = '#e8e8e8';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {settings.dispatchStrategy === 'custom' && (
                  <div style={{
                    position: 'absolute',
                    top: -1,
                    right: -1,
                    width: 0,
                    height: 0,
                    borderStyle: 'solid',
                    borderWidth: '0 32px 32px 0',
                    borderColor: 'transparent #722ed1 transparent transparent',
                    borderRadius: '0 6px 0 0'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: 2,
                      right: -28,
                      color: '#fff',
                      fontSize: 14
                    }}>✓</div>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                    boxShadow: '0 2px 4px rgba(114, 46, 209, 0.1)'
                  }}>
                    <SettingOutlined style={{ fontSize: 16, color: '#722ed1' }} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 'bold', color: '#262626' }}>
                    自定义
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#8c8c8c', lineHeight: 1.6, paddingLeft: 42 }}>
                  根据配送距离自动选择运力平台
                </div>
              </div>
            </Col>
          </Row>
        </Card>

        {/* 距离分段配送平台 */}
        {settings.dispatchStrategy === 'custom' && (
          <Card
            title={
              <Space>
                <EnvironmentOutlined />
                <span>距离分段配送设置</span>
              </Space>
            }
            size="small"
          >
            <div style={{ marginBottom: 12, color: '#666', fontSize: 13 }}>
              根据配送距离选择不同的运力平台，系统将自动匹配最合适的平台
            </div>

            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {settings.distanceBasedPlatforms.map((rule, index) => (
                <div
                  key={rule.id}
                  style={{
                    padding: '12px',
                    background: '#fafafa',
                    borderRadius: 4,
                    border: '1px solid #e8e8e8'
                  }}
                >
                  <Row gutter={8} align="middle">
                    <Col span={10}>
                      <Space size="small">
                        <InputNumber
                          min={0}
                          max={rule.maxDistance - 0.1}
                          step={0.5}
                          value={rule.minDistance}
                          onChange={value => updateDistanceRule(rule.id, { minDistance: value || 0 })}
                          style={{ width: 70 }}
                          size="small"
                        />
                        <span style={{ color: '#999' }}>-</span>
                        <InputNumber
                          min={rule.minDistance + 0.1}
                          max={50}
                          step={0.5}
                          value={rule.maxDistance}
                          onChange={value => updateDistanceRule(rule.id, { maxDistance: value || 1 })}
                          style={{ width: 70 }}
                          size="small"
                        />
                        <span style={{ fontSize: 12, color: '#999' }}>公里</span>
                      </Space>
                    </Col>
                    <Col span={10}>
                      <Select
                        value={rule.platform}
                        onChange={value => updateDistanceRule(rule.id, { platform: value })}
                        style={{ width: '100%' }}
                        size="small"
                        options={[
                          { label: '达达配送', value: 'dada' },
                          { label: '顺丰同城', value: 'sf' },
                          { label: '闪送', value: 'shansong' }
                        ]}
                      />
                    </Col>
                    <Col span={4} style={{ textAlign: 'right' }}>
                      {settings.distanceBasedPlatforms.length > 1 && (
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => removeDistanceRule(rule.id)}
                        />
                      )}
                    </Col>
                  </Row>
                </div>
              ))}
            </Space>

            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={addDistanceRule}
              style={{ width: '100%', marginTop: 12 }}
              size="small"
            >
              添加距离规则
            </Button>

            <div style={{ marginTop: 12, padding: 8, background: '#f0f7ff', borderRadius: 4, fontSize: 12, color: '#666' }}>
              💡 提示：系统会根据订单的配送距离自动选择对应区间的运力平台进行派单
            </div>
          </Card>
        )}

        {/* 分时段配送策略 - 仅在平衡模式下显示 */}
        {settings.dispatchStrategy === 'balanced' && (
          <Card
            size="small"
            style={{
              background: '#ffffff',
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}
            bodyStyle={{ padding: isMobile ? 16 : 20 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 'bold', color: '#262626', marginBottom: 4 }}>
                  <FieldTimeOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                  分时段配送策略
                </div>
                <div style={{ fontSize: 12, color: '#8c8c8c', paddingLeft: 26 }}>
                  根据不同时段自动切换配送策略，提升配送效率
                </div>
              </div>
              <Switch
                checked={settings.enableTimeBasedStrategy}
                onChange={checked => updateSettings({ enableTimeBasedStrategy: checked })}
                style={{
                  background: settings.enableTimeBasedStrategy ? '#52c41a' : undefined
                }}
              />
            </div>

          {settings.enableTimeBasedStrategy && (
            <>
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                {settings.timeBasedStrategies.map(strategy => (
                  <Card
                    key={strategy.id}
                    size="small"
                    style={{
                      background: strategy.enabled ? '#ffffff' : '#fafafa',
                      border: strategy.enabled ? '1px solid #d9d9d9' : '1px solid #e8e8e8',
                      borderRadius: 8,
                      opacity: strategy.enabled ? 1 : 0.7
                    }}
                    bodyStyle={{ padding: isMobile ? 12 : 16 }}
                  >
                    {/* 头部：开关和名称 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Space size={8}>
                        <Switch
                          checked={strategy.enabled}
                          onChange={checked => updateTimeStrategy(strategy.id, { enabled: checked })}
                          size="small"
                        />
                        <Input
                          value={strategy.name}
                          onChange={e => updateTimeStrategy(strategy.id, { name: e.target.value })}
                          bordered={false}
                          style={{
                            fontWeight: 'bold',
                            fontSize: isMobile ? 14 : 15,
                            padding: 0,
                            width: isMobile ? 100 : 120
                          }}
                          placeholder="时段名称"
                        />
                      </Space>
                      {settings.timeBasedStrategies.length > 1 && (
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => removeTimeStrategy(strategy.id)}
                        />
                      )}
                    </div>

                    {/* 时间范围 */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>时间范围</div>
                      <Space size={8}>
                        <input
                          type="time"
                          value={strategy.startTime}
                          onChange={e => updateTimeStrategy(strategy.id, { startTime: e.target.value })}
                          style={{
                            padding: isMobile ? '6px 10px' : '8px 12px',
                            border: '1px solid #d9d9d9',
                            borderRadius: 6,
                            fontSize: isMobile ? 13 : 14,
                            width: isMobile ? 90 : 100
                          }}
                        />
                        <span style={{ color: '#999' }}>至</span>
                        <input
                          type="time"
                          value={strategy.endTime}
                          onChange={e => updateTimeStrategy(strategy.id, { endTime: e.target.value })}
                          style={{
                            padding: isMobile ? '6px 10px' : '8px 12px',
                            border: '1px solid #d9d9d9',
                            borderRadius: 6,
                            fontSize: isMobile ? 13 : 14,
                            width: isMobile ? 90 : 100
                          }}
                        />
                      </Space>
                    </div>

                    {/* 配送策略 */}
                    <div>
                      <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>配送策略</div>
                      <Select
                        value={strategy.strategy}
                        onChange={value => updateTimeStrategy(strategy.id, { strategy: value })}
                        style={{ width: '100%' }}
                        size={isMobile ? 'middle' : 'large'}
                      >
                        <Select.Option value="low-price">💰 低价优先</Select.Option>
                        <Select.Option value="fastest">⚡ 速度优先</Select.Option>
                        <Select.Option value="balanced">
                          <span style={{ color: '#52c41a', fontWeight: 'bold' }}>⚖️ 平衡模式 (推荐)</span>
                        </Select.Option>
                      </Select>
                    </div>
                  </Card>
                ))}
              </Space>

              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addTimeStrategy}
                block
                size={isMobile ? 'middle' : 'large'}
                style={{
                  marginTop: 16,
                  borderRadius: 8,
                  height: isMobile ? 40 : 44
                }}
              >
                添加时段规则
              </Button>
            </>
          )}

          <div style={{ marginTop: 12, padding: 8, background: '#f0f7ff', borderRadius: 4, fontSize: 12, color: '#666' }}>
            💡 提示：系统会根据当前时间自动匹配对应时段的配送策略
            {settings.enableOrderAmountTier && (
              <span style={{ color: '#fa8c16', fontWeight: 'bold' }}>
                {' '}（与订单金额分级同时启用时，按优先级设置执行）
              </span>
            )}
          </div>
        </Card>
        )}

        {/* 订单金额分级配送 - 仅在平衡模式下显示 */}
        {settings.dispatchStrategy === 'balanced' && (
          <Card
          size="small"
          style={{
            background: '#ffffff',
            border: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
          bodyStyle={{ padding: isMobile ? 16 : 20 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 'bold', color: '#262626', marginBottom: 4 }}>
                <DollarOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                订单金额分级配送
              </div>
              <div style={{ fontSize: 12, color: '#8c8c8c', paddingLeft: 26 }}>
                根据订单金额自动选择配送策略，高价值订单优先可靠性
              </div>
            </div>
            <Switch
              checked={settings.enableOrderAmountTier}
              onChange={checked => updateSettings({ enableOrderAmountTier: checked })}
              style={{
                background: settings.enableOrderAmountTier ? '#52c41a' : undefined
              }}
            />
          </div>

          {settings.enableOrderAmountTier && (
            <>
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                {settings.orderAmountTiers.map((tier, index) => (
                  <Card
                    key={tier.id}
                    size="small"
                    style={{
                      background: '#ffffff',
                      border: '1px solid #d9d9d9',
                      borderRadius: 8
                    }}
                    bodyStyle={{ padding: isMobile ? 12 : 16 }}
                  >
                    {/* 头部：档位标题和删除按钮 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ fontWeight: 'bold', fontSize: isMobile ? 14 : 15, color: '#1890ff' }}>
                        档位 {index + 1}
                      </div>
                      {settings.orderAmountTiers.length > 1 && (
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => removeAmountTier(tier.id)}
                        />
                      )}
                    </div>

                    {/* 金额范围 */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>订单金额范围</div>
                      <Space size={8}>
                        <InputNumber
                          min={0}
                          max={tier.maxAmount - 1}
                          value={tier.minAmount}
                          onChange={value => updateAmountTier(tier.id, { minAmount: value || 0 })}
                          style={{ width: isMobile ? 100 : 120 }}
                          size={isMobile ? 'middle' : 'large'}
                          prefix="¥"
                        />
                        <span style={{ color: '#999' }}>至</span>
                        <InputNumber
                          min={tier.minAmount + 1}
                          max={999999}
                          value={tier.maxAmount}
                          onChange={value => updateAmountTier(tier.id, { maxAmount: value || 100 })}
                          style={{ width: isMobile ? 100 : 120 }}
                          size={isMobile ? 'middle' : 'large'}
                          prefix="¥"
                        />
                      </Space>
                    </div>

                    {/* 配送策略 */}
                    <div>
                      <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>配送策略</div>
                      <Select
                        value={tier.strategy}
                        onChange={value => updateAmountTier(tier.id, { strategy: value })}
                        style={{ width: '100%' }}
                        size={isMobile ? 'middle' : 'large'}
                      >
                        <Select.Option value="low-price">💰 低价优先</Select.Option>
                        <Select.Option value="fastest">⚡ 速度优先</Select.Option>
                        <Select.Option value="balanced">
                          <span style={{ color: '#52c41a', fontWeight: 'bold' }}>⚖️ 平衡模式 (推荐)</span>
                        </Select.Option>
                        <Select.Option value="reliable">🛡️ 品质保障</Select.Option>
                      </Select>
                    </div>
                  </Card>
                ))}
              </Space>

              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addAmountTier}
                block
                size={isMobile ? 'middle' : 'large'}
                style={{
                  marginTop: 16,
                  borderRadius: 8,
                  height: isMobile ? 40 : 44
                }}
              >
                添加金额档位
              </Button>
            </>
          )}

          <div style={{ marginTop: 12, padding: 8, background: '#f0f7ff', borderRadius: 4, fontSize: 12, color: '#666' }}>
            💡 提示：贵重物品或VIP客户订单建议选择"品质保障"策略，只选择零投诉、高评分的平台
            {settings.enableTimeBasedStrategy && (
              <span style={{ color: '#fa8c16', fontWeight: 'bold' }}>
                {' '}（与分时段策略同时启用时，按优先级设置执行）
              </span>
            )}
          </div>
        </Card>
        )}

        {/* 策略优先级设置 - 仅在平衡模式下且两个策略都启用时显示 */}
        {settings.dispatchStrategy === 'balanced' && settings.enableTimeBasedStrategy && settings.enableOrderAmountTier && (
          <Card
            size="small"
            style={{
              background: 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)',
              border: '2px solid #ffa940'
            }}
          >
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 'bold', color: '#fa8c16', marginBottom: 8 }}>
                ⚠️ 策略冲突处理
              </div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 12, lineHeight: 1.6 }}>
                当分时段策略和订单金额分级同时启用时，可能会产生冲突。例如：某时段设置为"低价优先"，但该时段内的高价值订单按金额分级应选择"速度优先"。
              </div>
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 8 }}>策略优先级</div>
              <Radio.Group
                value={settings.strategyPriority}
                onChange={e => updateSettings({ strategyPriority: e.target.value })}
                style={{ width: '100%' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Radio value="amount-based">
                    <Space>
                      <span style={{ fontWeight: 'bold' }}>订单金额优先</span>
                      <Tag color="success">推荐</Tag>
                    </Space>
                    <div style={{ fontSize: 11, color: '#666', marginLeft: 24, marginTop: 4 }}>
                      优先按订单金额分级选择策略，高价值订单获得更好的配送服务
                    </div>
                  </Radio>
                  <Radio value="time-based">
                    <span style={{ fontWeight: 'bold' }}>时段策略优先</span>
                    <div style={{ fontSize: 11, color: '#666', marginLeft: 24, marginTop: 4 }}>
                      优先按时段策略选择，适合有明确时段配送需求的场景
                    </div>
                  </Radio>
                </Space>
              </Radio.Group>
            </div>
          </Card>
        )}

        {/* 多平台并发询价 */}
        <Card
          title={
            <Space>
              <SyncOutlined />
              <span>多平台并发询价</span>
            </Space>
          }
          size="small"
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14 }}>启用并发询价</div>
                <div style={{ fontSize: 12, color: '#999' }}>同时向多个平台询价，自动选择最优方案</div>
              </div>
              <Switch
                checked={settings.concurrentPricing}
                onChange={checked => updateSettings({ concurrentPricing: checked })}
              />
            </div>

            {settings.concurrentPricing && (
              <>
                <Divider style={{ margin: '8px 0' }} />
                <div>
                  <div style={{ marginBottom: 8, fontSize: 14 }}>
                    询价超时时间：<span style={{ color: '#1890ff', fontWeight: 'bold' }}>{settings.concurrentPricingTimeout}</span> 秒
                  </div>
                  <Slider
                    min={5}
                    max={30}
                    value={settings.concurrentPricingTimeout}
                    onChange={value => updateSettings({ concurrentPricingTimeout: value })}
                    marks={{ 5: '5s', 10: '10s', 20: '20s', 30: '30s' }}
                  />
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                    超过此时间未响应的平台将被忽略
                  </div>
                </div>
              </>
            )}
          </Space>

          <div style={{ marginTop: 12, padding: 8, background: '#fff7e6', borderRadius: 4, fontSize: 12, color: '#666' }}>
            ⚡ 提示：并发询价可能略微增加响应时间，但能获得更优的配送方案
          </div>
        </Card>

        {/* 失败自动重试策略 */}
        <Card
          title={
            <Space>
              <ReloadOutlined />
              <span>失败自动重试策略</span>
            </Space>
          }
          size="small"
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14 }}>启用自动重试</div>
                <div style={{ fontSize: 12, color: '#999' }}>派单失败后自动重试，提高成功率</div>
              </div>
              <Switch
                checked={settings.retryStrategy.enabled}
                onChange={checked => updateSettings({
                  retryStrategy: { ...settings.retryStrategy, enabled: checked }
                })}
              />
            </div>

            {settings.retryStrategy.enabled && (
              <>
                <Divider style={{ margin: '8px 0' }} />
                <div>
                  <div style={{ marginBottom: 8, fontSize: 14 }}>
                    最大重试次数：<span style={{ color: '#1890ff', fontWeight: 'bold' }}>{settings.retryStrategy.maxRetries}</span> 次
                  </div>
                  <Slider
                    min={1}
                    max={5}
                    value={settings.retryStrategy.maxRetries}
                    onChange={value => updateSettings({
                      retryStrategy: { ...settings.retryStrategy, maxRetries: value }
                    })}
                    marks={{ 1: '1', 2: '2', 3: '3', 4: '4', 5: '5' }}
                  />
                </div>

                <Divider style={{ margin: '8px 0' }} />
                <div>
                  <div style={{ marginBottom: 8, fontSize: 14 }}>
                    重试间隔：<span style={{ color: '#1890ff', fontWeight: 'bold' }}>{settings.retryStrategy.retryInterval}</span> 秒
                  </div>
                  <Slider
                    min={10}
                    max={120}
                    step={10}
                    value={settings.retryStrategy.retryInterval}
                    onChange={value => updateSettings({
                      retryStrategy: { ...settings.retryStrategy, retryInterval: value }
                    })}
                    marks={{ 10: '10s', 30: '30s', 60: '60s', 120: '120s' }}
                  />
                </div>

                <Divider style={{ margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14 }}>自动切换平台</div>
                    <div style={{ fontSize: 12, color: '#999' }}>重试时自动切换到其他平台</div>
                  </div>
                  <Switch
                    checked={settings.retryStrategy.autoSwitchPlatform}
                    onChange={checked => updateSettings({
                      retryStrategy: { ...settings.retryStrategy, autoSwitchPlatform: checked }
                    })}
                  />
                </div>

                <Divider style={{ margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14 }}>最终转自配送</div>
                    <div style={{ fontSize: 12, color: '#999' }}>所有平台都失败后转为自配送</div>
                  </div>
                  <Switch
                    checked={settings.retryStrategy.fallbackToSelfDelivery}
                    onChange={checked => updateSettings({
                      retryStrategy: { ...settings.retryStrategy, fallbackToSelfDelivery: checked }
                    })}
                  />
                </div>
              </>
            )}
          </Space>

          <div style={{ marginTop: 12, padding: 8, background: '#f6ffed', borderRadius: 4, fontSize: 12, color: '#666' }}>
            ✅ 提示：合理的重试策略可以显著提高派单成功率
          </div>
        </Card>

        {/* 费用控制 */}
        <Card
          title={
            <Space>
              <DollarOutlined />
              <span>费用控制</span>
            </Space>
          }
          size="small"
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14 }}>低价发单</div>
                <div style={{ fontSize: 12, color: '#999' }}>自动选择配送费最低的平台</div>
              </div>
              <Switch
                checked={settings.lowPriceDispatch}
                onChange={checked => updateSettings({ lowPriceDispatch: checked })}
              />
            </div>

            <Divider style={{ margin: '8px 0' }} />
            <div>
              <div style={{ marginBottom: 8, fontSize: 14 }}>
                最高配送费限制：<span style={{ color: '#1890ff', fontWeight: 'bold' }}>¥{settings.maxDeliveryFee}</span>
              </div>
              <Slider
                min={5}
                max={50}
                value={settings.maxDeliveryFee}
                onChange={value => updateSettings({ maxDeliveryFee: value })}
                marks={{ 5: '¥5', 15: '¥15', 30: '¥30', 50: '¥50' }}
              />
              <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                超过此金额的配送订单将不会自动派单
              </div>
            </div>

            <Divider style={{ margin: '8px 0' }} />
            <div>
              <div style={{ marginBottom: 8, fontSize: 14 }}>
                每日配送费预算提醒：<span style={{ color: '#1890ff', fontWeight: 'bold' }}>¥{settings.budgetAlertThreshold}</span>
              </div>
              <InputNumber
                min={100}
                max={10000}
                step={100}
                value={settings.budgetAlertThreshold}
                onChange={value => updateSettings({ budgetAlertThreshold: value || 1000 })}
                style={{ width: '100%' }}
                prefix="¥"
              />
              <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                当日配送费用达到此金额时将发送提醒
              </div>
            </div>
          </Space>
        </Card>

        {/* 超时设置 */}
        <Card
          title={
            <Space>
              <ClockCircleOutlined />
              <span>超时设置</span>
            </Space>
          }
          size="small"
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14 }}>配送超时提醒</div>
                <div style={{ fontSize: 12, color: '#999' }}>配送超时后自动发送提醒</div>
              </div>
              <Switch
                checked={settings.deliveryTimeoutAlert}
                onChange={checked => updateSettings({ deliveryTimeoutAlert: checked })}
              />
            </div>

            {settings.deliveryTimeoutAlert && (
              <>
                <Divider style={{ margin: '8px 0' }} />
                <div>
                  <div style={{ marginBottom: 8, fontSize: 14 }}>
                    超时时间：<span style={{ color: '#1890ff', fontWeight: 'bold' }}>{settings.timeoutMinutes}</span> 分钟
                  </div>
                  <Slider
                    min={30}
                    max={180}
                    step={15}
                    value={settings.timeoutMinutes}
                    onChange={value => updateSettings({ timeoutMinutes: value })}
                    marks={{ 30: '30分', 60: '60分', 120: '120分', 180: '180分' }}
                  />
                </div>

                <Divider style={{ margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14 }}>自动取消超时订单</div>
                    <div style={{ fontSize: 12, color: '#999' }}>超时后自动取消订单</div>
                  </div>
                  <Switch
                    checked={settings.autoCancelTimeout}
                    onChange={checked => updateSettings({ autoCancelTimeout: checked })}
                  />
                </div>
              </>
            )}
          </Space>
        </Card>

        {/* 其他设置 */}
        <Card
          title={
            <Space>
              <SettingOutlined />
              <span>其他设置</span>
            </Space>
          }
          size="small"
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14 }}>智能派单</div>
                <div style={{ fontSize: 12, color: '#999' }}>AI智能选择最优配送方案</div>
              </div>
              <Switch
                checked={settings.smartDispatch}
                onChange={checked => updateSettings({ smartDispatch: checked })}
              />
            </div>

            <Divider style={{ margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14 }}>高峰时段加价</div>
                <div style={{ fontSize: 12, color: '#999' }}>高峰期自动提高配送费预算</div>
              </div>
              <Switch
                checked={settings.peakHourBoost}
                onChange={checked => updateSettings({ peakHourBoost: checked })}
              />
            </div>
          </Space>
        </Card>
      </Space>
    </div>
  );
}