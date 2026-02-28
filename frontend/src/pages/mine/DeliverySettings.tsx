import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Card,
  Switch,
  InputNumber,
  Button,
  Space,
  message,
  Select,
  Row,
  Col,
  TimePicker,
  Input,
  Tag
} from 'antd';
import {
  ThunderboltOutlined,
  DollarOutlined,
  SettingOutlined,
  SaveOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  DeleteOutlined,
  FieldTimeOutlined,
  RocketOutlined,
  CheckCircleFilled,
  SwapOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

interface DistanceBasedPlatform {
  id: string;
  minDistance: number;
  maxDistance: number;
  platform: string;
}

interface TimeBasedStrategy {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  strategy: 'low-price' | 'fastest';
  enabled: boolean;
}

interface OrderAmountTier {
  id: string;
  minAmount: number;
  maxAmount: number;
  strategy: 'low-price' | 'fastest' | 'custom-platform';
  platformPreference?: string;
}

interface RetryStrategy {
  enabled: boolean;
  maxRetries: number;
  retryInterval: number;
  autoSwitchPlatform: boolean;
  fallbackToSelfDelivery: boolean;
}

interface NoRiderEscalation {
  enabled: boolean;
  waitPerPlatform: number;
  postExhaustionWait: number;
  autoTipEnabled: boolean;
  tipAmount: number;
  maxTipAmount: number;
  tipIncrementRounds: number;
}

interface DeliverySettings {
  dispatchStrategy: 'low-price' | 'fastest' | 'balanced' | 'custom';
  platformPriority: string[];
  distanceBasedPlatforms: DistanceBasedPlatform[];
  timeBasedStrategies: TimeBasedStrategy[];
  enableTimeBasedStrategy: boolean;
  orderAmountTiers: OrderAmountTier[];
  enableOrderAmountTier: boolean;
  strategyPriority: 'time-based' | 'amount-based';
  concurrentPricing: boolean;
  concurrentPricingTimeout: number;
  retryStrategy: RetryStrategy;
  prioritySelfDelivery: boolean;
  selfDeliveryAutoFallback: boolean;
  selfDeliveryMaxOrders: number;
  maxDeliveryFee: number;
  lowPriceDispatch: boolean;
  budgetAlertThreshold: number;
  maxDeliveryDistance: number;
  enableAreaRestriction: boolean;
  deliveryTimeoutAlert: boolean;
  timeoutMinutes: number;
  autoCancelTimeout: boolean;
  smartDispatch: boolean;
  peakHourBoost: boolean;
  noRiderEscalation: NoRiderEscalation;
}

// --- 可复用子组件 ---

const cardStyle = {
  background: '#fff',
  border: 'none',
  borderRadius: 12,
  boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
};

const SectionTitle = ({ icon, title, tag }: { icon: React.ReactNode; title: string; tag?: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
    <span style={{ fontSize: 16, color: '#4A90E2', display: 'flex' }}>{icon}</span>
    <span style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>{title}</span>
    {tag && <Tag color="blue" style={{ marginLeft: 4, fontSize: 11, lineHeight: '18px', borderRadius: 10 }}>{tag}</Tag>}
  </div>
);

const SettingRow = ({ title, desc, children, noBorder }: {
  title: string; desc: string; children: React.ReactNode; noBorder?: boolean;
}) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 0',
    borderBottom: noBorder ? 'none' : '1px solid #f5f5f5',
  }}>
    <div style={{ flex: 1, marginRight: 16 }}>
      <div style={{ fontSize: 14, color: '#262626', fontWeight: 500 }}>{title}</div>
      <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{desc}</div>
    </div>
    {children}
  </div>
);

const strategies = [
  { key: 'low-price' as const, label: '低价优先', desc: '自动选择配送费最低的平台', icon: <DollarOutlined />, color: '#fa8c16', bg: '#fff7e6' },
  { key: 'fastest' as const, label: '速度优先', desc: '优先选择配送速度最快的平台', icon: <RocketOutlined />, color: '#1890ff', bg: '#e6f7ff' },
  { key: 'balanced' as const, label: '智能化设置', desc: '分时段或按金额智能匹配最优方案', icon: <ThunderboltOutlined />, color: '#52c41a', bg: '#f6ffed', recommended: true },
  { key: 'custom' as const, label: '按距离派单', desc: '根据配送距离自动选择运力平台', icon: <SettingOutlined />, color: '#722ed1', bg: '#f9f0ff' },
];

// --- 主组件 ---

export default function DeliverySettings() {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [intelligentSubStrategy, setIntelligentSubStrategy] = useState<'time-based' | 'amount-based' | null>(null);
  const timeBasedRef = useRef<HTMLDivElement>(null);
  const escalationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 从 Dashboard 跳转过来时，自动展开对应模块并滚动定位
  useEffect(() => {
    const state = location.state as { section?: string } | null;
    if (!state?.section) return;

    if (state.section === 'time-based') {
      updateSettings({ dispatchStrategy: 'balanced' });
      setIntelligentSubStrategy('time-based');
      setTimeout(() => timeBasedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    } else if (state.section === 'amount-based') {
      updateSettings({ dispatchStrategy: 'balanced' });
      setIntelligentSubStrategy('amount-based');
      setTimeout(() => timeBasedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    } else if (state.section === 'escalation') {
      setTimeout(() => escalationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }

    // 清除 state 避免刷新时重复触发
    window.history.replaceState({}, '');
  }, [location.state]);

  const [settings, setSettings] = useState<DeliverySettings>({
    dispatchStrategy: 'balanced',
    platformPriority: ['dada', 'sf', 'shansong'],
    distanceBasedPlatforms: [
      { id: '1', minDistance: 0, maxDistance: 3, platform: 'dada' },
      { id: '2', minDistance: 3, maxDistance: 5, platform: 'sf' },
      { id: '3', minDistance: 5, maxDistance: 10, platform: 'shansong' }
    ],
    timeBasedStrategies: [
      { id: '1', name: '早餐时段', startTime: '07:00', endTime: '09:00', strategy: 'fastest', enabled: true },
      { id: '2', name: '午餐高峰', startTime: '11:00', endTime: '13:00', strategy: 'fastest', enabled: true },
      { id: '3', name: '晚餐高峰', startTime: '17:00', endTime: '20:00', strategy: 'fastest', enabled: true },
      { id: '4', name: '夜宵时段', startTime: '21:00', endTime: '23:59', strategy: 'low-price', enabled: false }
    ],
    enableTimeBasedStrategy: false,
    orderAmountTiers: [
      { id: '1', minAmount: 0, maxAmount: 30, strategy: 'low-price' },
      { id: '2', minAmount: 30, maxAmount: 100, strategy: 'fastest' },
      { id: '3', minAmount: 100, maxAmount: 999999, strategy: 'custom-platform', platformPreference: 'sf' }
    ],
    enableOrderAmountTier: false,
    strategyPriority: 'amount-based',
    concurrentPricing: false,
    concurrentPricingTimeout: 10,
    retryStrategy: { enabled: true, maxRetries: 3, retryInterval: 30, autoSwitchPlatform: true, fallbackToSelfDelivery: false },
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
    peakHourBoost: false,
    noRiderEscalation: {
      enabled: true,
      waitPerPlatform: 60,
      postExhaustionWait: 120,
      autoTipEnabled: true,
      tipAmount: 3,
      maxTipAmount: 15,
      tipIncrementRounds: 3,
    },
  });

  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      message.success('配送设置已保存');
    } catch {
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = (updates: Partial<DeliverySettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const addDistanceRule = () => {
    const last = settings.distanceBasedPlatforms[settings.distanceBasedPlatforms.length - 1];
    updateSettings({
      distanceBasedPlatforms: [...settings.distanceBasedPlatforms, {
        id: Date.now().toString(),
        minDistance: last ? last.maxDistance : 0,
        maxDistance: last ? last.maxDistance + 3 : 3,
        platform: 'dada'
      }]
    });
  };

  const removeDistanceRule = (id: string) => {
    updateSettings({ distanceBasedPlatforms: settings.distanceBasedPlatforms.filter(r => r.id !== id) });
  };

  const updateDistanceRule = (id: string, updates: Partial<DistanceBasedPlatform>) => {
    updateSettings({ distanceBasedPlatforms: settings.distanceBasedPlatforms.map(r => r.id === id ? { ...r, ...updates } : r) });
  };

  const addTimeStrategy = () => {
    updateSettings({
      timeBasedStrategies: [...settings.timeBasedStrategies, {
        id: Date.now().toString(), name: '新时段', startTime: '00:00', endTime: '23:59', strategy: 'fastest', enabled: true
      }]
    });
  };

  const removeTimeStrategy = (id: string) => {
    updateSettings({ timeBasedStrategies: settings.timeBasedStrategies.filter(s => s.id !== id) });
  };

  const updateTimeStrategy = (id: string, updates: Partial<TimeBasedStrategy>) => {
    updateSettings({ timeBasedStrategies: settings.timeBasedStrategies.map(s => s.id === id ? { ...s, ...updates } : s) });
  };

  const addAmountTier = () => {
    const last = settings.orderAmountTiers[settings.orderAmountTiers.length - 1];
    updateSettings({
      orderAmountTiers: [...settings.orderAmountTiers, {
        id: Date.now().toString(), minAmount: last ? last.maxAmount : 0, maxAmount: last ? last.maxAmount + 50 : 50, strategy: 'fastest'
      }]
    });
  };

  const removeAmountTier = (id: string) => {
    updateSettings({ orderAmountTiers: settings.orderAmountTiers.filter(t => t.id !== id) });
  };

  const updateAmountTier = (id: string, updates: Partial<OrderAmountTier>) => {
    updateSettings({ orderAmountTiers: settings.orderAmountTiers.map(t => t.id === id ? { ...t, ...updates } : t) });
  };

  const pad = isMobile ? 16 : 20;

  return (
    <div style={{ padding: '16px', background: '#f0f2f5', minHeight: '100vh' }}>
      {/* 顶部标题栏 */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>配送设置</h2>
        <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={handleSave}
          style={{ borderRadius: 8, background: '#4A90E2' }}>
          保存设置
        </Button>
      </div>

      <Space direction="vertical" size={16} style={{ width: '100%' }}>

        {/* ===== 派单策略选择 ===== */}
        {/* ===== 派单策略选择 ===== */}
        <Card size="small" style={cardStyle} styles={{ body: { padding: pad } }}>
          <SectionTitle icon={<ThunderboltOutlined />} title="派单策略" />
          <Row gutter={[12, 12]}>
            {strategies.map(s => {
              const active = settings.dispatchStrategy === s.key;
              return (
                <Col xs={12} sm={12} md={12} lg={6} key={s.key}>
                  <div
                    onClick={() => { updateSettings({ dispatchStrategy: s.key }); if (s.key !== 'balanced') setIntelligentSubStrategy(null); }}
                    style={{
                      padding: 14, borderRadius: 10, cursor: 'pointer', position: 'relative',
                      background: active ? s.bg : '#fafafa',
                      border: `2px solid ${active ? s.color : '#eee'}`,
                      transition: 'all 0.25s ease',
                    }}
                  >
                    {s.recommended && (
                      <Tag color="success" style={{ position: 'absolute', top: 6, right: 6, fontSize: 10, lineHeight: '16px', borderRadius: 8, margin: 0, padding: '0 6px' }}>
                        推荐
                      </Tag>
                    )}
                    {active && (
                      <CheckCircleFilled style={{ position: 'absolute', top: 8, left: 8, fontSize: 14, color: s.color }} />
                    )}
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, background: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 10, boxShadow: `0 2px 6px ${s.color}20`,
                    }}>
                      <span style={{ fontSize: 18, color: s.color, display: 'flex' }}>{s.icon}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#262626', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: '#999', lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                </Col>
              );
            })}
          </Row>
        </Card>

        {/* ===== 距离分段配送 ===== */}
        {settings.dispatchStrategy === 'custom' && (
          <Card size="small" style={cardStyle} styles={{ body: { padding: pad } }}>
            <SectionTitle icon={<EnvironmentOutlined />} title="距离分段配送" />
            <div style={{ fontSize: 12, color: '#999', marginBottom: 14 }}>
              根据配送距离自动匹配运力平台
            </div>
            {settings.distanceBasedPlatforms.map((rule, i) => (
              <div key={rule.id} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                background: '#fafafa', borderRadius: 8, marginBottom: 8,
              }}>
                <Tag color="purple" style={{ margin: 0, borderRadius: 6, minWidth: 28, textAlign: 'center' }}>{i + 1}</Tag>
                <InputNumber min={0} max={rule.maxDistance - 0.1} step={0.5} value={rule.minDistance}
                  onChange={v => updateDistanceRule(rule.id, { minDistance: v || 0 })} style={{ width: 68 }} size="small" />
                <span style={{ color: '#bbb' }}>—</span>
                <InputNumber min={rule.minDistance + 0.1} max={50} step={0.5} value={rule.maxDistance}
                  onChange={v => updateDistanceRule(rule.id, { maxDistance: v || 1 })} style={{ width: 68 }} size="small" />
                <span style={{ fontSize: 12, color: '#999' }}>km</span>
                <Select value={rule.platform} onChange={v => updateDistanceRule(rule.id, { platform: v })}
                  size="small" style={{ flex: 1, minWidth: 90 }}
                  options={[{ label: '达达配送', value: 'dada' }, { label: '顺丰同城', value: 'sf' }, { label: '闪送', value: 'shansong' }]} />
                {settings.distanceBasedPlatforms.length > 1 && (
                  <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => removeDistanceRule(rule.id)} />
                )}
              </div>
            ))}
            <Button type="dashed" icon={<PlusOutlined />} onClick={addDistanceRule} block size="small"
              style={{ marginTop: 4, borderRadius: 8, height: 36, color: '#722ed1', borderColor: '#d3adf7' }}>
              添加距离规则
            </Button>
          </Card>
        )}

        {/* ===== 智能化子策略选择 ===== */}
        {settings.dispatchStrategy === 'balanced' && (
          <Card size="small" style={cardStyle} styles={{ body: { padding: pad } }}>
            <SectionTitle icon={<ThunderboltOutlined />} title="选择智能策略" tag="二选一" />
            <Row gutter={[12, 12]}>
              {[
                { key: 'time-based' as const, label: '分时段配送', desc: '按早/午/晚等时段自动切换策略', icon: <FieldTimeOutlined />, color: '#1890ff', bg: '#e6f7ff' },
                { key: 'amount-based' as const, label: '按订单金额分级', desc: '根据订单金额高低选择不同策略', icon: <DollarOutlined />, color: '#fa8c16', bg: '#fff7e6' },
              ].map(s => {
                const active = intelligentSubStrategy === s.key;
                return (
                  <Col xs={12} sm={12} key={s.key}>
                    <div onClick={() => setIntelligentSubStrategy(s.key)} style={{
                      padding: 14, borderRadius: 10, cursor: 'pointer', position: 'relative',
                      background: active ? s.bg : '#fafafa',
                      border: `2px solid ${active ? s.color : '#eee'}`,
                      transition: 'all 0.25s ease',
                    }}>
                      {active && <CheckCircleFilled style={{ position: 'absolute', top: 8, right: 8, fontSize: 14, color: s.color }} />}
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, background: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 8, boxShadow: `0 2px 6px ${s.color}20`,
                      }}>
                        <span style={{ fontSize: 16, color: s.color, display: 'flex' }}>{s.icon}</span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#262626', marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: '#999', lineHeight: 1.5 }}>{s.desc}</div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </Card>
        )}

        {/* ===== 分时段配送策略 ===== */}
        {settings.dispatchStrategy === 'balanced' && intelligentSubStrategy === 'time-based' && (
          <div ref={timeBasedRef}>
          <Card size="small" style={cardStyle} styles={{ body: { padding: pad } }}>
            <SectionTitle icon={<FieldTimeOutlined />} title="分时段配送策略" />
            {settings.timeBasedStrategies.map((s, i) => (
              <div key={s.id} style={{
                padding: 12, background: s.enabled ? '#fafafa' : '#fafafa80', borderRadius: 10, marginBottom: 8,
                opacity: s.enabled ? 1 : 0.55, transition: 'opacity 0.2s',
                border: '1px solid #f0f0f0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isMobile ? 10 : 0, flexWrap: 'wrap' }}>
                  <Switch checked={s.enabled} onChange={v => updateTimeStrategy(s.id, { enabled: v })} size="small" />
                  <Input value={s.name} onChange={e => updateTimeStrategy(s.id, { name: e.target.value })}
                    size="small" style={{ width: isMobile ? '100%' : 100, borderRadius: 6 }} placeholder="时段名称" />
                  <TimePicker.RangePicker
                    value={[s.startTime ? dayjs(s.startTime, 'HH:mm') : null, s.endTime ? dayjs(s.endTime, 'HH:mm') : null]}
                    format="HH:mm" minuteStep={15} size="small"
                    style={{ width: isMobile ? '100%' : 160, borderRadius: 6 }}
                    onChange={t => { if (t) updateTimeStrategy(s.id, { startTime: t[0]?.format('HH:mm') ?? '', endTime: t[1]?.format('HH:mm') ?? '' }); }}
                  />
                  <Select value={s.strategy} onChange={v => updateTimeStrategy(s.id, { strategy: v })}
                    size="small" style={{ width: isMobile ? '100%' : 120, borderRadius: 6 }}>
                    <Select.Option value="low-price">💰 低价优先</Select.Option>
                    <Select.Option value="fastest">⚡ 速度优先</Select.Option>
                  </Select>
                  {settings.timeBasedStrategies.length > 1 && (
                    <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => removeTimeStrategy(s.id)} />
                  )}
                </div>
              </div>
            ))}
            <Button type="dashed" icon={<PlusOutlined />} onClick={addTimeStrategy} block size="small"
              style={{ marginTop: 4, borderRadius: 8, height: 36, color: '#1890ff', borderColor: '#91caff' }}>
              添加时段规则
            </Button>
            <div style={{ marginTop: 10, padding: '8px 12px', background: '#f0f7ff', borderRadius: 8, fontSize: 12, color: '#666' }}>
              💡 系统会根据当前时间自动匹配对应时段的配送策略
            </div>
          </Card>
          </div>
        )}

        {/* ===== 订单金额分级 ===== */}
        {settings.dispatchStrategy === 'balanced' && intelligentSubStrategy === 'amount-based' && (
          <Card size="small" style={cardStyle} styles={{ body: { padding: pad } }}>
            <SectionTitle icon={<DollarOutlined />} title="按订单金额分级配送" />
            {settings.orderAmountTiers.map((tier, i) => (
              <div key={tier.id} style={{
                padding: 12, background: '#fafafa', borderRadius: 10, marginBottom: 8,
                border: '1px solid #f0f0f0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Tag color="orange" style={{ margin: 0, borderRadius: 6, fontWeight: 600 }}>档位{i + 1}</Tag>
                  <InputNumber min={0} max={tier.maxAmount - 1} value={tier.minAmount}
                    onChange={v => updateAmountTier(tier.id, { minAmount: v || 0 })}
                    style={{ width: isMobile ? 80 : 100 }} size="small" prefix="¥" />
                  <span style={{ color: '#bbb', fontSize: 12 }}>至</span>
                  <InputNumber min={tier.minAmount + 1} max={999999} value={tier.maxAmount}
                    onChange={v => updateAmountTier(tier.id, { maxAmount: v || 100 })}
                    style={{ width: isMobile ? 80 : 100 }} size="small" prefix="¥" />
                  <Select value={tier.strategy} onChange={v => updateAmountTier(tier.id, { strategy: v })}
                    size="small" style={{ width: isMobile ? '100%' : 120, borderRadius: 6 }}>
                    <Select.Option value="low-price">💰 低价优先</Select.Option>
                    <Select.Option value="fastest">⚡ 速度优先</Select.Option>
                    <Select.Option value="custom-platform">🚚 指定运力</Select.Option>
                  </Select>
                  {tier.strategy === 'custom-platform' && (
                    <Select value={tier.platformPreference} onChange={v => updateAmountTier(tier.id, { platformPreference: v })}
                      placeholder="选择平台" size="small" style={{ width: isMobile ? '100%' : 110, borderRadius: 6 }}>
                      <Select.Option value="dada">达达配送</Select.Option>
                      <Select.Option value="sf">顺丰同城</Select.Option>
                      <Select.Option value="shansong">闪送</Select.Option>
                    </Select>
                  )}
                  {settings.orderAmountTiers.length > 1 && (
                    <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => removeAmountTier(tier.id)} />
                  )}
                </div>
              </div>
            ))}
            <Button type="dashed" icon={<PlusOutlined />} onClick={addAmountTier} block size="small"
              style={{ marginTop: 4, borderRadius: 8, height: 36, color: '#fa8c16', borderColor: '#ffd591' }}>
              添加金额档位
            </Button>
            <div style={{ marginTop: 10, padding: '8px 12px', background: '#fff7e6', borderRadius: 8, fontSize: 12, color: '#666' }}>
              💡 高价订单建议选择品质更高的运力平台
            </div>
          </Card>
        )}
        {/* ===== 无人接单自动升级 ===== */}
        <div ref={escalationRef}>
        <Card size="small" style={cardStyle} styles={{ body: { padding: pad } }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <SectionTitle icon={<SwapOutlined />} title="无人接单自动升级" tag="智能" />
            <Switch checked={settings.noRiderEscalation.enabled}
              onChange={v => updateSettings({ noRiderEscalation: { ...settings.noRiderEscalation, enabled: v } })} />
          </div>

          {settings.noRiderEscalation.enabled && (
            <>
              {/* 每平台等待时间 */}
              <SettingRow title="单平台等待时间" desc="每个平台呼叫后等待骑手接单的时间">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <InputNumber
                    min={15} max={300} step={15}
                    value={settings.noRiderEscalation.waitPerPlatform}
                    onChange={v => updateSettings({ noRiderEscalation: { ...settings.noRiderEscalation, waitPerPlatform: v || 60 } })}
                    style={{ width: 80 }} size="small"
                  />
                  <span style={{ fontSize: 12, color: '#999' }}>秒</span>
                </div>
              </SettingRow>

              {/* 全部用完后等待时间 */}
              <SettingRow title="全部无人接单后等待" desc="所有平台轮询完毕后，等待多久开始加小费">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <InputNumber
                    min={30} max={600} step={30}
                    value={settings.noRiderEscalation.postExhaustionWait}
                    onChange={v => updateSettings({ noRiderEscalation: { ...settings.noRiderEscalation, postExhaustionWait: v || 120 } })}
                    style={{ width: 80 }} size="small"
                  />
                  <span style={{ fontSize: 12, color: '#999' }}>秒</span>
                </div>
              </SettingRow>

              {/* 自动加小费开关 */}
              <SettingRow title="自动加小费" desc="全部平台无人接单后自动加价吸引骑手">
                <Switch checked={settings.noRiderEscalation.autoTipEnabled}
                  onChange={v => updateSettings({ noRiderEscalation: { ...settings.noRiderEscalation, autoTipEnabled: v } })} />
              </SettingRow>

              {/* 小费详细配置 */}
              {settings.noRiderEscalation.autoTipEnabled && (
                <div style={{
                  padding: 14, background: '#fafafa', borderRadius: 10, marginTop: 4,
                  border: '1px solid #f0f0f0',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#262626', marginBottom: 12 }}>
                    💰 小费配置
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 13, color: '#262626' }}>每轮加价金额</div>
                        <div style={{ fontSize: 11, color: '#999' }}>每次自动加价的金额</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <InputNumber
                          min={1} max={50} step={1} prefix="¥"
                          value={settings.noRiderEscalation.tipAmount}
                          onChange={v => updateSettings({ noRiderEscalation: { ...settings.noRiderEscalation, tipAmount: v || 3 } })}
                          style={{ width: 90 }} size="small"
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 13, color: '#262626' }}>小费上限</div>
                        <div style={{ fontSize: 11, color: '#999' }}>累计小费不超过此金额</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <InputNumber
                          min={1} max={100} step={5} prefix="¥"
                          value={settings.noRiderEscalation.maxTipAmount}
                          onChange={v => updateSettings({ noRiderEscalation: { ...settings.noRiderEscalation, maxTipAmount: v || 15 } })}
                          style={{ width: 90 }} size="small"
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 13, color: '#262626' }}>最多加价轮数</div>
                        <div style={{ fontSize: 11, color: '#999' }}>达到轮数后停止自动加价</div>
                      </div>
                      <InputNumber
                        min={1} max={10} step={1}
                        value={settings.noRiderEscalation.tipIncrementRounds}
                        onChange={v => updateSettings({ noRiderEscalation: { ...settings.noRiderEscalation, tipIncrementRounds: v || 3 } })}
                        style={{ width: 90 }} size="small"
                        addonAfter="轮"
                      />
                    </div>
                  </div>

                  {/* 费用预估提示 */}
                  <div style={{
                    marginTop: 12, padding: '8px 12px', background: '#fff7e6',
                    borderRadius: 8, fontSize: 12, color: '#ad6800',
                  }}>
                    💡 按当前配置，最高可能加价 ¥{Math.min(
                      settings.noRiderEscalation.tipAmount * settings.noRiderEscalation.tipIncrementRounds,
                      settings.noRiderEscalation.maxTipAmount
                    )}（{Math.min(
                      settings.noRiderEscalation.tipIncrementRounds,
                      Math.ceil(settings.noRiderEscalation.maxTipAmount / settings.noRiderEscalation.tipAmount)
                    )} 轮 × ¥{settings.noRiderEscalation.tipAmount}/轮，上限 ¥{settings.noRiderEscalation.maxTipAmount}）
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
        </div>

        {/* ===== 其他设置 ===== */}
        <Card size="small" style={cardStyle} styles={{ body: { padding: pad } }}>
          <SectionTitle icon={<SettingOutlined />} title="其他设置" />
          <SettingRow title="智能派单" desc="AI 智能选择最优配送方案">
            <Switch checked={settings.smartDispatch} onChange={v => updateSettings({ smartDispatch: v })} />
          </SettingRow>
          <SettingRow title="高峰时段加价" desc="高峰期自动提高配送费预算" noBorder>
            <Switch checked={settings.peakHourBoost} onChange={v => updateSettings({ peakHourBoost: v })} />
          </SettingRow>
        </Card>

      </Space>
    </div>
  );
}
