import { useState, useEffect } from 'react';
import { Card, Button, Radio, TimePicker, InputNumber, message, Tag, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined, ThunderboltOutlined, BulbOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

export default function StationCreate() {
  const navigate = useNavigate();
  const [selectedPlatform, setSelectedPlatform] = useState<string>('shansong');
  const [timeSlot, setTimeSlot] = useState<string>('');
  const [customStartTime, setCustomStartTime] = useState<any>(dayjs('11:00', 'HH:mm'));
  const [customEndTime, setCustomEndTime] = useState<any>(dayjs('13:00', 'HH:mm'));
  const [riderCount, setRiderCount] = useState<number>(0);
  const [recommendedCount, setRecommendedCount] = useState<number>(0);
  const [historicalData, setHistoricalData] = useState<any>(null);
  const [showRecommendation, setShowRecommendation] = useState<boolean>(false);

  useEffect(() => {
    if (timeSlot) {
      loadHistoricalData();
    }
  }, [timeSlot]);

  const loadHistoricalData = () => {
    // TODO: 从后端加载历史订单数据
    // 根据选择的时段分析历史数据
    const mockData = {
      lunch: {
        avgOrdersPerHour: 8,
        peakOrders: 12,
        recommendedRiders: 2,
        reason: '午高峰平均每小时8单，高峰时段达12单'
      },
      dinner: {
        avgOrdersPerHour: 6,
        peakOrders: 9,
        recommendedRiders: 1,
        reason: '晚高峰平均每小时6单，高峰时段达9单'
      },
      custom: {
        avgOrdersPerHour: 5,
        peakOrders: 7,
        recommendedRiders: 1,
        reason: '该时段平均每小时5单'
      }
    };

    const data = mockData[timeSlot as keyof typeof mockData] || mockData.custom;
    setHistoricalData(data);
    setRecommendedCount(data.recommendedRiders);
    setRiderCount(data.recommendedRiders);
    setShowRecommendation(true);
  };

  const timeSlots = [
    { value: 'lunch', label: '午高峰', time: '11:00-13:00', hours: 2 },
    { value: 'dinner', label: '晚高峰', time: '17:00-19:00', hours: 2 },
    { value: 'custom', label: '自定义时段', time: '', hours: 0 }
  ];

  const calculateCost = () => {
    const pricePerHour = 60; // 闪送驻店价格

    let hours = 2;
    if (timeSlot === 'custom') {
      const diff = customEndTime.diff(customStartTime, 'hour', true);
      hours = Math.max(0.5, diff);
    } else {
      const slot = timeSlots.find(s => s.value === timeSlot);
      hours = slot?.hours || 2;
    }

    return (pricePerHour * hours * riderCount).toFixed(0);
  };

  const getEstimatedOrders = () => {
    let hours = 2;
    if (timeSlot === 'custom') {
      const diff = customEndTime.diff(customStartTime, 'hour', true);
      hours = Math.max(0.5, diff);
    }
    const ordersPerHour = 5;
    const min = Math.floor(ordersPerHour * hours * riderCount * 0.8);
    const max = Math.ceil(ordersPerHour * hours * riderCount * 1.2);
    return `${min}-${max}`;
  };

  const handleSubmit = () => {
    if (!selectedPlatform) {
      message.warning('请选择运力平台');
      return;
    }

    message.loading('正在发起驻店请求...', 2);
    setTimeout(() => {
      message.success('驻店请求已发送，等待平台派驻骑手');
      navigate('/mine');
      // TODO: 调用后端API发起驻店
    }, 2000);
  };

  return (
    <div style={{ padding: '16px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* 顶部导航 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        padding: '8px 0'
      }}>
        <ArrowLeftOutlined
          style={{ fontSize: 20, cursor: 'pointer' }}
          onClick={() => navigate('/mine')}
        />
        <span style={{ fontSize: 18, fontWeight: 'bold' }}>发起驻店</span>
      </div>

      {/* 选择运力平台 */}
      <Card
        title={<span style={{ fontSize: 16, fontWeight: 'bold' }}>运力平台</span>}
        style={{ marginBottom: 16, borderRadius: 8 }}
      >
        <div style={{
          padding: '16px',
          background: 'linear-gradient(135deg, #fff7e6 0%, #fff 100%)',
          borderRadius: 8,
          border: '2px solid #FF6B00',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4, color: '#FF6B00' }}>
              闪送
            </div>
            <div style={{ fontSize: 12, color: '#999' }}>
              唯一支持驻店服务的运力平台
            </div>
          </div>
          <Tag color="#FF6B00" style={{ margin: 0, fontSize: 13, padding: '4px 12px' }}>
            ¥60/小时
          </Tag>
        </div>
      </Card>

      {/* 选择驻店时段 */}
      <Card
        title={<span style={{ fontSize: 16, fontWeight: 'bold' }}>选择驻店时段</span>}
        style={{ marginBottom: 16, borderRadius: 8 }}
      >
        <Radio.Group
          value={timeSlot}
          onChange={(e) => setTimeSlot(e.target.value)}
          style={{ width: '100%' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {timeSlots.map(slot => (
              <Radio.Button
                key={slot.value}
                value={slot.value}
                style={{
                  height: 'auto',
                  padding: '12px 16px',
                  textAlign: 'left',
                  borderRadius: 8
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 15, fontWeight: 'bold' }}>{slot.label}</span>
                  {slot.time && <span style={{ fontSize: 13, color: '#999' }}>{slot.time}</span>}
                </div>
              </Radio.Button>
            ))}
          </div>
        </Radio.Group>

        {timeSlot === 'custom' && (
          <div style={{ marginTop: 16, padding: '12px', background: '#fafafa', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 14, color: '#666', minWidth: 60 }}>开始时间</span>
              <TimePicker
                value={customStartTime}
                onChange={setCustomStartTime}
                format="HH:mm"
                style={{ flex: 1 }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 14, color: '#666', minWidth: 60 }}>结束时间</span>
              <TimePicker
                value={customEndTime}
                onChange={setCustomEndTime}
                format="HH:mm"
                style={{ flex: 1 }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* 选择驻店人数 */}
      {showRecommendation && (
        <Card
          title={<span style={{ fontSize: 16, fontWeight: 'bold' }}>驻店人数建议</span>}
          style={{ marginBottom: 16, borderRadius: 8 }}
        >
          <Alert
            message={
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <BulbOutlined style={{ color: '#faad14', fontSize: 16 }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  智能推荐：{recommendedCount}人
                </span>
              </div>
            }
            description={
              <div style={{ fontSize: 13, color: '#666', marginTop: 8, lineHeight: 1.6 }}>
                {historicalData?.reason}，建议配置 <strong>{recommendedCount}</strong> 名骑手
              </div>
            }
            type="warning"
            showIcon={false}
            style={{ marginBottom: 16, borderRadius: 8, border: '2px solid #faad14' }}
          />

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>
              您可以接受建议或自行调整人数：
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Button
                type="primary"
                size="large"
                onClick={() => setRiderCount(recommendedCount)}
                style={{
                  flex: 1,
                  height: 48,
                  fontSize: 15,
                  fontWeight: 'bold',
                  background: riderCount === recommendedCount ? '#faad14' : undefined,
                  borderColor: riderCount === recommendedCount ? '#faad14' : undefined
                }}
              >
                接受建议 {recommendedCount}
              </Button>
            </div>
          </div>

          <div style={{
            padding: '16px',
            background: '#fafafa',
            borderRadius: 8,
            marginBottom: 12
          }}>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
              或手动调整人数：
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Button
                size="large"
                onClick={() => setRiderCount(Math.max(1, riderCount - 1))}
                disabled={riderCount <= 1}
                style={{
                  width: 48,
                  height: 48,
                  fontSize: 20,
                  flexShrink: 0
                }}
              >
                -
              </Button>
              <div style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 28,
                fontWeight: 'bold',
                color: '#1890ff',
                minWidth: 80,
                padding: '8px 0'
              }}>
                {riderCount}
              </div>
              <Button
                size="large"
                onClick={() => setRiderCount(Math.min(5, riderCount + 1))}
                disabled={riderCount >= 5}
                style={{
                  width: 48,
                  height: 48,
                  fontSize: 20,
                  flexShrink: 0
                }}
              >
                +
              </Button>
            </div>
            <div style={{
              textAlign: 'center',
              fontSize: 12,
              color: '#999',
              marginTop: 8
            }}>
              可配置 1-5 人
            </div>
          </div>

          {riderCount !== recommendedCount && (
            <Alert
              message={
                riderCount > recommendedCount
                  ? `增加 ${riderCount - recommendedCount} 人可能导致骑手空闲，增加成本`
                  : `减少 ${recommendedCount - riderCount} 人可能导致配送压力增大`
              }
              type={riderCount > recommendedCount ? 'warning' : 'info'}
              showIcon
              style={{ fontSize: 12, borderRadius: 8 }}
            />
          )}
        </Card>
      )}

      {/* 费用预估 */}
      {showRecommendation && riderCount > 0 && (
        <Card
          title={<span style={{ fontSize: 16, fontWeight: 'bold' }}>费用预估</span>}
          style={{ marginBottom: 16, borderRadius: 8 }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #e6f7ff 0%, #fff 100%)',
            padding: '16px',
            borderRadius: 8,
            border: '1px solid #91d5ff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 14, color: '#666' }}>驻店时长</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                {timeSlot === 'custom'
                  ? `${customEndTime.diff(customStartTime, 'hour', true).toFixed(1)}小时`
                  : timeSlots.find(s => s.value === timeSlot)?.hours + '小时'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 14, color: '#666' }}>驻店人数</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{riderCount}人</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 14, color: '#666' }}>预计完成</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{getEstimatedOrders()}单</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: 12,
              borderTop: '1px dashed #91d5ff'
            }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>预估费用</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#ff4d4f' }}>
                ¥{calculateCost()}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* 确认按钮 */}
      {showRecommendation && riderCount > 0 && (
        <Button
          type="primary"
          size="large"
          block
          icon={<ThunderboltOutlined />}
          onClick={handleSubmit}
          style={{ height: 48, fontSize: 16, fontWeight: 'bold' }}
        >
          确认发起驻店
        </Button>
      )}
    </div>
  );
}
