import { Card, Progress, DatePicker, Space, Row, Col, Statistic } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { useState } from 'react';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default function CallbackRate() {
  const [dateRange, setDateRange] = useState<any>([dayjs().subtract(7, 'day'), dayjs()]);

  const platformData = [
    { name: '美团', total: 526, success: 498, failed: 28, rate: 94.7, color: '#FFD100' },
    { name: '饿了么', total: 458, success: 441, failed: 17, rate: 96.3, color: '#0095FF' },
    { name: '抖音', total: 274, success: 256, failed: 18, rate: 93.4, color: '#000000' }
  ];

  const deliveryData = [
    { name: '达达', total: 412, success: 398, failed: 14, rate: 96.6, color: '#4A90E2' },
    { name: '顺丰', total: 368, success: 355, failed: 13, rate: 96.5, color: '#5AB572' },
    { name: '闪送', total: 478, success: 442, failed: 36, rate: 92.5, color: '#F5A623' }
  ];

  return (
    <div style={{ padding: '16px', background: '#f5f5f5', minHeight: '100vh' }}>
      <h2 style={{ marginBottom: 16, fontSize: 18 }}>回传率</h2>

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>统计时间</div>
          <RangePicker
            style={{ width: '100%' }}
            size="large"
            value={dateRange}
            onChange={setDateRange}
            placeholder={['开始日期', '结束日期']}
          />
        </Space>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, marginBottom: 16 }}>总体回传率</h3>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Progress
            type="circle"
            percent={95.2}
            strokeColor="#5AB572"
            width={120}
            format={(percent) => (
              <div>
                <div style={{ fontSize: 28, fontWeight: 'bold' }}>{percent}%</div>
                <div style={{ fontSize: 12, color: '#999' }}>回传率</div>
              </div>
            )}
          />
        </div>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="总订单"
              value={1258}
              valueStyle={{ fontSize: 20 }}
              prefix={<SyncOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="成功回传"
              value={1197}
              valueStyle={{ color: '#5AB572', fontSize: 20 }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="回传失败"
              value={61}
              valueStyle={{ color: '#E74C3C', fontSize: 20 }}
              prefix={<CloseCircleOutlined />}
            />
          </Col>
        </Row>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, marginBottom: 16 }}>上游平台回传率</h3>
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          {platformData.map(platform => (
            <Card key={platform.name}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 'bold' }}>{platform.name}</span>
                  <span style={{ fontSize: 18, fontWeight: 'bold', color: platform.rate >= 95 ? '#5AB572' : '#F5A623' }}>
                    {platform.rate}%
                  </span>
                </div>
                <Progress
                  percent={platform.rate}
                  strokeColor={platform.rate >= 95 ? '#5AB572' : '#F5A623'}
                  showInfo={false}
                />
              </div>
              <Row gutter={8}>
                <Col span={8}>
                  <div style={{ fontSize: 12, color: '#999' }}>总订单</div>
                  <div style={{ fontSize: 16, fontWeight: 'bold' }}>{platform.total}</div>
                </Col>
                <Col span={8}>
                  <div style={{ fontSize: 12, color: '#999' }}>成功</div>
                  <div style={{ fontSize: 16, fontWeight: 'bold', color: '#5AB572' }}>{platform.success}</div>
                </Col>
                <Col span={8}>
                  <div style={{ fontSize: 12, color: '#999' }}>失败</div>
                  <div style={{ fontSize: 16, fontWeight: 'bold', color: '#E74C3C' }}>{platform.failed}</div>
                </Col>
              </Row>
            </Card>
          ))}
        </Space>
      </Card>

      <Card>
        <h3 style={{ fontSize: 16, marginBottom: 16 }}>下游配送平台回传率</h3>
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          {deliveryData.map(platform => (
            <Card key={platform.name}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 'bold' }}>{platform.name}</span>
                  <span style={{ fontSize: 18, fontWeight: 'bold', color: platform.rate >= 95 ? '#5AB572' : '#F5A623' }}>
                    {platform.rate}%
                  </span>
                </div>
                <Progress
                  percent={platform.rate}
                  strokeColor={platform.rate >= 95 ? '#5AB572' : '#F5A623'}
                  showInfo={false}
                />
              </div>
              <Row gutter={8}>
                <Col span={8}>
                  <div style={{ fontSize: 12, color: '#999' }}>总订单</div>
                  <div style={{ fontSize: 16, fontWeight: 'bold' }}>{platform.total}</div>
                </Col>
                <Col span={8}>
                  <div style={{ fontSize: 12, color: '#999' }}>成功</div>
                  <div style={{ fontSize: 16, fontWeight: 'bold', color: '#5AB572' }}>{platform.success}</div>
                </Col>
                <Col span={8}>
                  <div style={{ fontSize: 12, color: '#999' }}>失败</div>
                  <div style={{ fontSize: 16, fontWeight: 'bold', color: '#E74C3C' }}>{platform.failed}</div>
                </Col>
              </Row>
            </Card>
          ))}
        </Space>
      </Card>
    </div>
  );
}
