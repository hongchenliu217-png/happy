import { useState } from 'react';
import { Card, Row, Col, Statistic, Tag, Space, Select, DatePicker, Tabs } from 'antd';
import {
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  StarOutlined
} from '@ant-design/icons';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';

// 平台表现数据接口
interface PlatformMetrics {
  platform: string;
  platformName: string;
  acceptRate: number; // 接单率
  avgDeliveryTime: number; // 平均配送时长(分钟)
  onTimeRate: number; // 准时率
  complaintRate: number; // 投诉率
  avgCost: number; // 平均配送费
  totalOrders: number; // 总订单数
  score: number; // 综合评分
  trend: 'up' | 'down' | 'stable'; // 趋势
}

// 上游平台考核指标
interface UpstreamMetrics {
  platform: string;
  platformName: string;
  responseTime: number; // 响应时长(秒)
  orderAccuracy: number; // 订单准确率
  customerSatisfaction: number; // 客户满意度
  disputeRate: number; // 纠纷率
  refundRate: number; // 退款率
  score: number;
}

const platformNames: Record<string, string> = {
  dada: '达达配送',
  sf: '顺丰同城',
  shansong: '闪送',
  meituan: '美团外卖',
  eleme: '饿了么',
  douyin: '抖音外卖'
};

export default function PlatformPerformance() {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('week');

  // 模拟配送平台数据
  const [deliveryMetrics] = useState<PlatformMetrics[]>([
    {
      platform: 'dada',
      platformName: '达达配送',
      acceptRate: 95,
      avgDeliveryTime: 28,
      onTimeRate: 92,
      complaintRate: 2.1,
      avgCost: 6.5,
      totalOrders: 1250,
      score: 92,
      trend: 'up'
    },
    {
      platform: 'sf',
      platformName: '顺丰同城',
      acceptRate: 88,
      avgDeliveryTime: 25,
      onTimeRate: 96,
      complaintRate: 1.2,
      avgCost: 8.2,
      totalOrders: 980,
      score: 94,
      trend: 'up'
    },
    {
      platform: 'shansong',
      platformName: '闪送',
      acceptRate: 92,
      avgDeliveryTime: 22,
      onTimeRate: 94,
      complaintRate: 1.8,
      avgCost: 9.5,
      totalOrders: 650,
      score: 93,
      trend: 'stable'
    }
  ]);

  // 模拟上游平台数据
  const [upstreamMetrics] = useState<UpstreamMetrics[]>([
    {
      platform: 'meituan',
      platformName: '美团外卖',
      responseTime: 3.2,
      orderAccuracy: 98.5,
      customerSatisfaction: 4.8,
      disputeRate: 1.5,
      refundRate: 2.3,
      score: 96
    },
    {
      platform: 'eleme',
      platformName: '饿了么',
      responseTime: 4.1,
      orderAccuracy: 97.8,
      customerSatisfaction: 4.6,
      disputeRate: 2.1,
      refundRate: 2.8,
      score: 94
    },
    {
      platform: 'douyin',
      platformName: '抖音外卖',
      responseTime: 5.5,
      orderAccuracy: 96.2,
      customerSatisfaction: 4.5,
      disputeRate: 3.2,
      refundRate: 3.5,
      score: 90
    }
  ]);

  // 准备雷达图数据 - 配送平台
  const deliveryRadarData = [
    {
      metric: '接单率',
      达达配送: deliveryMetrics[0].acceptRate,
      顺丰同城: deliveryMetrics[1].acceptRate,
      闪送: deliveryMetrics[2].acceptRate,
      fullMark: 100
    },
    {
      metric: '准时率',
      达达配送: deliveryMetrics[0].onTimeRate,
      顺丰同城: deliveryMetrics[1].onTimeRate,
      闪送: deliveryMetrics[2].onTimeRate,
      fullMark: 100
    },
    {
      metric: '配送速度',
      达达配送: 100 - (deliveryMetrics[0].avgDeliveryTime / 60 * 100),
      顺丰同城: 100 - (deliveryMetrics[1].avgDeliveryTime / 60 * 100),
      闪送: 100 - (deliveryMetrics[2].avgDeliveryTime / 60 * 100),
      fullMark: 100
    },
    {
      metric: '服务质量',
      达达配送: 100 - deliveryMetrics[0].complaintRate * 10,
      顺丰同城: 100 - deliveryMetrics[1].complaintRate * 10,
      闪送: 100 - deliveryMetrics[2].complaintRate * 10,
      fullMark: 100
    },
    {
      metric: '性价比',
      达达配送: 100 - (deliveryMetrics[0].avgCost / 15 * 100),
      顺丰同城: 100 - (deliveryMetrics[1].avgCost / 15 * 100),
      闪送: 100 - (deliveryMetrics[2].avgCost / 15 * 100),
      fullMark: 100
    }
  ];

  // 准备雷达图数据 - 上游平台
  const upstreamRadarData = [
    {
      metric: '订单准确率',
      美团外卖: upstreamMetrics[0].orderAccuracy,
      饿了么: upstreamMetrics[1].orderAccuracy,
      抖音外卖: upstreamMetrics[2].orderAccuracy,
      fullMark: 100
    },
    {
      metric: '客户满意度',
      美团外卖: upstreamMetrics[0].customerSatisfaction * 20,
      饿了么: upstreamMetrics[1].customerSatisfaction * 20,
      抖音外卖: upstreamMetrics[2].customerSatisfaction * 20,
      fullMark: 100
    },
    {
      metric: '响应速度',
      美团外卖: 100 - (upstreamMetrics[0].responseTime / 10 * 100),
      饿了么: 100 - (upstreamMetrics[1].responseTime / 10 * 100),
      抖音外卖: 100 - (upstreamMetrics[2].responseTime / 10 * 100),
      fullMark: 100
    },
    {
      metric: '纠纷处理',
      美团外卖: 100 - upstreamMetrics[0].disputeRate * 10,
      饿了么: 100 - upstreamMetrics[1].disputeRate * 10,
      抖音外卖: 100 - upstreamMetrics[2].disputeRate * 10,
      fullMark: 100
    },
    {
      metric: '退款率',
      美团外卖: 100 - upstreamMetrics[0].refundRate * 10,
      饿了么: 100 - upstreamMetrics[1].refundRate * 10,
      抖音外卖: 100 - upstreamMetrics[2].refundRate * 10,
      fullMark: 100
    }
  ];

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <RiseOutlined style={{ color: '#52c41a' }} />;
    if (trend === 'down') return <FallOutlined style={{ color: '#ff4d4f' }} />;
    return <span style={{ color: '#999' }}>—</span>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#52c41a';
    if (score >= 80) return '#1890ff';
    if (score >= 70) return '#faad14';
    return '#ff4d4f';
  };

  const getScoreTag = (score: number) => {
    if (score >= 90) return <Tag color="success">优秀</Tag>;
    if (score >= 80) return <Tag color="processing">良好</Tag>;
    if (score >= 70) return <Tag color="warning">一般</Tag>;
    return <Tag color="error">待改进</Tag>;
  };

  return (
    <div style={{ padding: '16px', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>平台表现评级</h2>
        <Space>
          <Select
            value={timeRange}
            onChange={setTimeRange}
            style={{ width: 120 }}
            options={[
              { label: '今日', value: 'today' },
              { label: '近7天', value: 'week' },
              { label: '近30天', value: 'month' }
            ]}
          />
        </Space>
      </div>

      <Tabs
        defaultActiveKey="delivery"
        items={[
          {
            key: 'delivery',
            label: (
              <span>
                <TrophyOutlined />
                配送平台表现
              </span>
            ),
            children: (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {/* 配送平台排行 */}
                <Row gutter={16}>
                  {deliveryMetrics
                    .sort((a, b) => b.score - a.score)
                    .map((metric, index) => (
                      <Col span={8} key={metric.platform}>
                        <Card size="small">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Space>
                              {index === 0 && <TrophyOutlined style={{ fontSize: 20, color: '#faad14' }} />}
                              <span style={{ fontSize: 16, fontWeight: 'bold' }}>{metric.platformName}</span>
                            </Space>
                            {getTrendIcon(metric.trend)}
                          </div>
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 32, fontWeight: 'bold', color: getScoreColor(metric.score) }}>
                              {metric.score}
                            </div>
                            <div style={{ fontSize: 12, color: '#999' }}>综合评分</div>
                          </div>
                          <Space size="small">
                            {getScoreTag(metric.score)}
                            <Tag>订单 {metric.totalOrders}</Tag>
                          </Space>
                        </Card>
                      </Col>
                    ))}
                </Row>

                {/* 详细指标 */}
                <Card title="详细指标对比" size="small">
                  <Row gutter={[16, 16]}>
                    {deliveryMetrics.map(metric => (
                      <Col span={8} key={metric.platform}>
                        <Card
                          type="inner"
                          title={metric.platformName}
                          size="small"
                          extra={<StarOutlined style={{ color: '#faad14' }} />}
                        >
                          <Space direction="vertical" style={{ width: '100%' }} size="small">
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#666' }}>接单率</span>
                              <span style={{ fontWeight: 'bold' }}>{metric.acceptRate}%</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#666' }}>准时率</span>
                              <span style={{ fontWeight: 'bold' }}>{metric.onTimeRate}%</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#666' }}>平均时长</span>
                              <span style={{ fontWeight: 'bold' }}>{metric.avgDeliveryTime}分钟</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#666' }}>投诉率</span>
                              <span style={{ fontWeight: 'bold', color: metric.complaintRate > 2 ? '#ff4d4f' : '#52c41a' }}>
                                {metric.complaintRate}%
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#666' }}>平均配送费</span>
                              <span style={{ fontWeight: 'bold' }}>¥{metric.avgCost}</span>
                            </div>
                          </Space>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card>

                {/* 雷达图 */}
                <Card title="综合能力雷达图" size="small">
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={deliveryRadarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar name="达达配送" dataKey="达达配送" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                      <Radar name="顺丰同城" dataKey="顺丰同城" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                      <Radar name="闪送" dataKey="闪送" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
                      <Legend />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </Card>
              </Space>
            )
          },
          {
            key: 'upstream',
            label: (
              <span>
                <CheckCircleOutlined />
                上游平台考核
              </span>
            ),
            children: (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {/* 上游平台排行 */}
                <Row gutter={16}>
                  {upstreamMetrics
                    .sort((a, b) => b.score - a.score)
                    .map((metric, index) => (
                      <Col span={8} key={metric.platform}>
                        <Card size="small">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Space>
                              {index === 0 && <TrophyOutlined style={{ fontSize: 20, color: '#faad14' }} />}
                              <span style={{ fontSize: 16, fontWeight: 'bold' }}>{metric.platformName}</span>
                            </Space>
                          </div>
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 32, fontWeight: 'bold', color: getScoreColor(metric.score) }}>
                              {metric.score}
                            </div>
                            <div style={{ fontSize: 12, color: '#999' }}>综合评分</div>
                          </div>
                          {getScoreTag(metric.score)}
                        </Card>
                      </Col>
                    ))}
                </Row>

                {/* 详细指标 */}
                <Card title="平台考核指标" size="small">
                  <Row gutter={[16, 16]}>
                    {upstreamMetrics.map(metric => (
                      <Col span={8} key={metric.platform}>
                        <Card
                          type="inner"
                          title={metric.platformName}
                          size="small"
                          extra={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                        >
                          <Space direction="vertical" style={{ width: '100%' }} size="small">
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#666' }}>响应时长</span>
                              <span style={{ fontWeight: 'bold' }}>{metric.responseTime}秒</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#666' }}>订单准确率</span>
                              <span style={{ fontWeight: 'bold' }}>{metric.orderAccuracy}%</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#666' }}>客户满意度</span>
                              <span style={{ fontWeight: 'bold' }}>{metric.customerSatisfaction}分</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#666' }}>纠纷率</span>
                              <span style={{ fontWeight: 'bold', color: metric.disputeRate > 2 ? '#ff4d4f' : '#52c41a' }}>
                                {metric.disputeRate}%
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#666' }}>退款率</span>
                              <span style={{ fontWeight: 'bold', color: metric.refundRate > 3 ? '#ff4d4f' : '#52c41a' }}>
                                {metric.refundRate}%
                              </span>
                            </div>
                          </Space>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card>

                {/* 雷达图 */}
                <Card title="平台能力雷达图" size="small">
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={upstreamRadarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar name="美团外卖" dataKey="美团外卖" stroke="#ffc107" fill="#ffc107" fillOpacity={0.6} />
                      <Radar name="饿了么" dataKey="饿了么" stroke="#2196f3" fill="#2196f3" fillOpacity={0.6} />
                      <Radar name="抖音外卖" dataKey="抖音外卖" stroke="#000000" fill="#000000" fillOpacity={0.6} />
                      <Legend />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </Card>

                {/* 运营建议 */}
                <Card title="运营建议" size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ padding: 12, background: '#f0f7ff', borderRadius: 4, borderLeft: '3px solid #1890ff' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: 4 }}>💡 美团外卖表现优秀</div>
                      <div style={{ fontSize: 13, color: '#666' }}>
                        订单准确率和客户满意度领先，建议加大在美团平台的运营投入
                      </div>
                    </div>
                    <div style={{ padding: 12, background: '#fff7e6', borderRadius: 4, borderLeft: '3px solid #faad14' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: 4 }}>⚠️ 抖音外卖需要关注</div>
                      <div style={{ fontSize: 13, color: '#666' }}>
                        纠纷率和退款率偏高，建议优化商品描述和服务流程
                      </div>
                    </div>
                  </Space>
                </Card>
              </Space>
            )
          }
        ]}
      />
    </div>
  );
}
