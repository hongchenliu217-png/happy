import { Card, Row, Col, Statistic, DatePicker, Space } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useState } from 'react';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default function DataStats() {
  const [dateRange, setDateRange] = useState<any>([dayjs().subtract(7, 'day'), dayjs()]);

  return (
    <div style={{ padding: '16px', background: '#f5f5f5', minHeight: '100vh' }}>
      <h2 style={{ marginBottom: 16, fontSize: 18 }}>数据统计</h2>

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
        <h3 style={{ fontSize: 16, marginBottom: 16 }}>订单统计</h3>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card>
              <Statistic
                title="总订单数"
                value={1258}
                valueStyle={{ color: '#4A90E2', fontSize: 24 }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <Statistic
                title="完成订单"
                value={1186}
                valueStyle={{ color: '#5AB572', fontSize: 24 }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <Statistic
                title="取消订单"
                value={72}
                valueStyle={{ color: '#E74C3C', fontSize: 24 }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <Statistic
                title="完成率"
                value={94.3}
                precision={1}
                suffix="%"
                valueStyle={{ color: '#5AB572', fontSize: 24 }}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, marginBottom: 16 }}>交易统计</h3>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card>
              <Statistic
                title="总交易额"
                value={45680}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#4A90E2', fontSize: 24 }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <Statistic
                title="配送费用"
                value={8920}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#F5A623', fontSize: 24 }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <Statistic
                title="平均客单价"
                value={36.3}
                precision={1}
                prefix="¥"
                valueStyle={{ fontSize: 24 }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <Statistic
                title="平均配送费"
                value={7.1}
                precision={1}
                prefix="¥"
                valueStyle={{ fontSize: 24 }}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      <Card>
        <h3 style={{ fontSize: 16, marginBottom: 16 }}>平台分布</h3>
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, color: '#666' }}>美团</div>
                <div style={{ fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>526单</div>
              </div>
              <Statistic
                value={41.8}
                precision={1}
                suffix="%"
                valueStyle={{ color: '#5AB572', fontSize: 18 }}
                prefix={<ArrowUpOutlined />}
              />
            </div>
          </Card>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, color: '#666' }}>饿了么</div>
                <div style={{ fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>458单</div>
              </div>
              <Statistic
                value={36.4}
                precision={1}
                suffix="%"
                valueStyle={{ color: '#5AB572', fontSize: 18 }}
                prefix={<ArrowUpOutlined />}
              />
            </div>
          </Card>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, color: '#666' }}>抖音</div>
                <div style={{ fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>274单</div>
              </div>
              <Statistic
                value={21.8}
                precision={1}
                suffix="%"
                valueStyle={{ color: '#E74C3C', fontSize: 18 }}
                prefix={<ArrowDownOutlined />}
              />
            </div>
          </Card>
        </Space>
      </Card>
    </div>
  );
}
