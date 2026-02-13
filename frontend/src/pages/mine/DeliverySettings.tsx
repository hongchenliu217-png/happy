import { useState } from 'react';
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
  Collapse
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
  ReloadOutlined
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
        {/* 派单策略 */}
        <Card
          title={
            <Space>
              <ThunderboltOutlined />
              <span>派单策略</span>
            </Space>
          }
          size="small"
        >
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>选择派单优先策略</div>
            <Radio.Group
              value={settings.dispatchStrategy}
              onChange={e => updateSettings({ dispatchStrategy: e.target.value })}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Radio value="low-price">
                  <Space>
                    <span>低价优先</span>
                    <Tag color="green">推荐</Tag>
                  </Space>
                  <div style={{ fontSize: 12, color: '#999', marginLeft: 24 }}>
                    自动选择配送费最低的平台
                  </div>
                </Radio>
                <Radio value="fastest">
                  <span>速度优先</span>
                  <div style={{ fontSize: 12, color: '#999', marginLeft: 24 }}>
                    优先选择配送速度最快的平台
                  </div>
                </Radio>
                <Radio value="balanced">
                  <span>平衡模式</span>
                  <div style={{ fontSize: 12, color: '#999', marginLeft: 24 }}>
                    综合考虑价格和速度
                  </div>
                </Radio>
                <Radio value="custom">
                  <span>自定义</span>
                  <div style={{ fontSize: 12, color: '#999', marginLeft: 24 }}>
                    根据配送距离自动选择运力平台
                  </div>
                </Radio>
              </Space>
            </Radio.Group>
          </div>
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

        {/* 分时段配送策略 */}
        <Card
          title={
            <Space>
              <FieldTimeOutlined />
              <span>分时段配送策略</span>
              <Switch
                checked={settings.enableTimeBasedStrategy}
                onChange={checked => updateSettings({ enableTimeBasedStrategy: checked })}
                size="small"
              />
            </Space>
          }
          size="small"
        >
          <div style={{ marginBottom: 12, color: '#666', fontSize: 13 }}>
            根据不同时段自动切换配送策略，提升配送效率
          </div>

          {settings.enableTimeBasedStrategy && (
            <>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {settings.timeBasedStrategies.map(strategy => (
                  <div
                    key={strategy.id}
                    style={{
                      padding: '12px',
                      background: strategy.enabled ? '#fafafa' : '#f5f5f5',
                      borderRadius: 4,
                      border: '1px solid #e8e8e8',
                      opacity: strategy.enabled ? 1 : 0.6
                    }}
                  >
                    <Row gutter={8} align="middle">
                      <Col span={1}>
                        <Switch
                          checked={strategy.enabled}
                          onChange={checked => updateTimeStrategy(strategy.id, { enabled: checked })}
                          size="small"
                        />
                      </Col>
                      <Col span={6}>
                        <input
                          type="text"
                          value={strategy.name}
                          onChange={e => updateTimeStrategy(strategy.id, { name: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '4px 8px',
                            border: '1px solid #d9d9d9',
                            borderRadius: 4,
                            fontSize: 13
                          }}
                          placeholder="时段名称"
                        />
                      </Col>
                      <Col span={7}>
                        <Space size="small">
                          <input
                            type="time"
                            value={strategy.startTime}
                            onChange={e => updateTimeStrategy(strategy.id, { startTime: e.target.value })}
                            style={{
                              padding: '4px 8px',
                              border: '1px solid #d9d9d9',
                              borderRadius: 4,
                              fontSize: 12
                            }}
                          />
                          <span>-</span>
                          <input
                            type="time"
                            value={strategy.endTime}
                            onChange={e => updateTimeStrategy(strategy.id, { endTime: e.target.value })}
                            style={{
                              padding: '4px 8px',
                              border: '1px solid #d9d9d9',
                              borderRadius: 4,
                              fontSize: 12
                            }}
                          />
                        </Space>
                      </Col>
                      <Col span={8}>
                        <Select
                          value={strategy.strategy}
                          onChange={value => updateTimeStrategy(strategy.id, { strategy: value })}
                          style={{ width: '100%' }}
                          size="small"
                          options={[
                            { label: '低价优先', value: 'low-price' },
                            { label: '速度优先', value: 'fastest' },
                            { label: '平衡模式', value: 'balanced' }
                          ]}
                        />
                      </Col>
                      <Col span={2} style={{ textAlign: 'right' }}>
                        {settings.timeBasedStrategies.length > 1 && (
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => removeTimeStrategy(strategy.id)}
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
                onClick={addTimeStrategy}
                style={{ width: '100%', marginTop: 12 }}
                size="small"
              >
                添加时段规则
              </Button>
            </>
          )}

          <div style={{ marginTop: 12, padding: 8, background: '#f0f7ff', borderRadius: 4, fontSize: 12, color: '#666' }}>
            💡 提示：系统会根据当前时间自动匹配对应时段的配送策略
          </div>
        </Card>

        {/* 订单金额分级配送 */}
        <Card
          title={
            <Space>
              <DollarOutlined />
              <span>订单金额分级配送</span>
              <Switch
                checked={settings.enableOrderAmountTier}
                onChange={checked => updateSettings({ enableOrderAmountTier: checked })}
                size="small"
              />
            </Space>
          }
          size="small"
        >
          <div style={{ marginBottom: 12, color: '#666', fontSize: 13 }}>
            根据订单金额自动选择配送策略，高价值订单优先可靠性
          </div>

          {settings.enableOrderAmountTier && (
            <>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {settings.orderAmountTiers.map(tier => (
                  <div
                    key={tier.id}
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
                            max={tier.maxAmount - 1}
                            value={tier.minAmount}
                            onChange={value => updateAmountTier(tier.id, { minAmount: value || 0 })}
                            style={{ width: 80 }}
                            size="small"
                            prefix="¥"
                          />
                          <span style={{ color: '#999' }}>-</span>
                          <InputNumber
                            min={tier.minAmount + 1}
                            max={999999}
                            value={tier.maxAmount}
                            onChange={value => updateAmountTier(tier.id, { maxAmount: value || 100 })}
                            style={{ width: 80 }}
                            size="small"
                            prefix="¥"
                          />
                        </Space>
                      </Col>
                      <Col span={10}>
                        <Select
                          value={tier.strategy}
                          onChange={value => updateAmountTier(tier.id, { strategy: value })}
                          style={{ width: '100%' }}
                          size="small"
                          options={[
                            { label: '低价优先', value: 'low-price' },
                            { label: '速度优先', value: 'fastest' },
                            { label: '平衡模式', value: 'balanced' },
                            { label: '可靠优先', value: 'reliable' }
                          ]}
                        />
                      </Col>
                      <Col span={4} style={{ textAlign: 'right' }}>
                        {settings.orderAmountTiers.length > 1 && (
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => removeAmountTier(tier.id)}
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
                onClick={addAmountTier}
                style={{ width: '100%', marginTop: 12 }}
                size="small"
              >
                添加金额档位
              </Button>
            </>
          )}

          <div style={{ marginTop: 12, padding: 8, background: '#f0f7ff', borderRadius: 4, fontSize: 12, color: '#666' }}>
            💡 提示：高价值订单建议选择"可靠优先"策略，确保配送质量
          </div>
        </Card>

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