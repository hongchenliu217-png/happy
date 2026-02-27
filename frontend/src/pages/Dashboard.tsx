import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Statistic, Tag, Button } from 'antd';
import {
  ShoppingOutlined, CheckCircleOutlined, ClockCircleOutlined,
  DollarOutlined, RightOutlined, ThunderboltOutlined,
  FieldTimeOutlined, SwapOutlined, ArrowUpOutlined, ArrowDownOutlined,
  WarningFilled
} from '@ant-design/icons';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import client from '../api/client';

// ─── 平台配置 ───
const platforms = [
  { key: 'meituan', name: '美团', color: '#FF6B00', bg: '#FFF7E6' },
  { key: 'eleme', name: '饿了么', color: '#0097FF', bg: '#E6F7FF' },
] as const;

type PlatformKey = typeof platforms[number]['key'];

// ─── 各平台数据（2月 vs 1月 mock）───
const platformData: Record<PlatformKey, {
  merchantScore: number;
  lastMonthScore: number;
  dimensions: { dimension: string; score: number; lastMonth: number; fullMark: number }[];
  dimensionDetails: Record<string, {
    color: string; icon: React.ReactNode;
    metrics: { label: string; value: string; prev?: string; status: 'good' | 'warn' | 'bad' }[];
  }>;
  suggestions: { level: 'good' | 'warn' | 'bad'; title: string; desc: string; action: string; settingPath: string }[];
}> = {
  meituan: {
    merchantScore: 4.6,
    lastMonthScore: 4.8,
    dimensions: [
      { dimension: '配送时效', score: 74, lastMonth: 69, fullMark: 100 },
      { dimension: '配送成本', score: 65, lastMonth: 72, fullMark: 100 },
      { dimension: '骑手响应', score: 58, lastMonth: 63, fullMark: 100 },
    ],
    dimensionDetails: {
      '配送时效': {
        color: '#1890ff', icon: <FieldTimeOutlined />,
        metrics: [
          { label: '准时达率', value: '91.2%', prev: '87.6%', status: 'good' },
          { label: '平均配送时长', value: '29分钟', prev: '33分钟', status: 'good' },
          { label: '午高峰超时率', value: '12.8%', prev: '18.5%', status: 'warn' },
        ],
      },
      '配送成本': {
        color: '#52c41a', icon: <DollarOutlined />,
        metrics: [
          { label: '单均配送费', value: '¥6.9', prev: '¥5.4', status: 'bad' },
          { label: '配送费占比', value: '22.1%', prev: '17.8%', status: 'bad' },
          { label: '小费支出占比', value: '11.3%', prev: '6.2%', status: 'bad' },
        ],
      },
      '骑手响应': {
        color: '#fa8c16', icon: <SwapOutlined />,
        metrics: [
          { label: '平均接单耗时', value: '67秒', prev: '42秒', status: 'bad' },
          { label: '首次呼叫成功率', value: '61%', prev: '78%', status: 'bad' },
          { label: '升级触发率', value: '39%', prev: '22%', status: 'bad' },
        ],
      },
    },
    suggestions: [
      { level: 'bad', title: '骑手响应大幅下滑，首次呼叫成功率仅61%',
        desc: '春节后运力未完全恢复，建议缩短单平台等待时间至45秒加快轮询',
        action: '去调整等待时间', settingPath: '/mine/delivery-settings' },
      { level: 'bad', title: '配送成本环比上涨28%，小费支出翻倍',
        desc: '升级触发率从22%升至39%，建议将每轮加价从¥3降至¥2',
        action: '去调整小费配置', settingPath: '/mine/delivery-settings' },
      { level: 'warn', title: '午高峰超时率12.8%，已较1月改善',
        desc: '建议午高峰保持速度优先，平峰切回低价优先节省成本',
        action: '去设置分时段策略', settingPath: '/mine/delivery-settings' },
      { level: 'good', title: '准时达率提升至91.2%，配送时长缩短4分钟',
        desc: '配送时效表现良好，建议维持现有时效相关设置',
        action: '查看配送设置', settingPath: '/mine/delivery-settings' },
    ],
  },
  eleme: {
    merchantScore: 4.5,
    lastMonthScore: 4.3,
    dimensions: [
      { dimension: '配送时效', score: 78, lastMonth: 72, fullMark: 100 },
      { dimension: '配送成本', score: 70, lastMonth: 68, fullMark: 100 },
      { dimension: '骑手响应', score: 62, lastMonth: 55, fullMark: 100 },
    ],
    dimensionDetails: {
      '配送时效': {
        color: '#1890ff', icon: <FieldTimeOutlined />,
        metrics: [
          { label: '准时达率', value: '93.1%', prev: '89.2%', status: 'good' },
          { label: '平均配送时长', value: '27分钟', prev: '31分钟', status: 'good' },
          { label: '午高峰超时率', value: '9.6%', prev: '14.2%', status: 'good' },
        ],
      },
      '配送成本': {
        color: '#52c41a', icon: <DollarOutlined />,
        metrics: [
          { label: '单均配送费', value: '¥5.8', prev: '¥5.5', status: 'warn' },
          { label: '配送费占比', value: '19.3%', prev: '18.6%', status: 'warn' },
          { label: '小费支出占比', value: '7.1%', prev: '5.8%', status: 'warn' },
        ],
      },
      '骑手响应': {
        color: '#fa8c16', icon: <SwapOutlined />,
        metrics: [
          { label: '平均接单耗时', value: '52秒', prev: '68秒', status: 'good' },
          { label: '首次呼叫成功率', value: '72%', prev: '58%', status: 'good' },
          { label: '升级触发率', value: '28%', prev: '42%', status: 'good' },
        ],
      },
    },
    suggestions: [
      { level: 'good', title: '骑手响应显著回升，接单耗时缩短16秒',
        desc: '饿了么运力恢复较快，首次呼叫成功率提升14个百分点',
        action: '查看配送设置', settingPath: '/mine/delivery-settings' },
      { level: 'good', title: '准时达率提升至93.1%，超时率大幅下降',
        desc: '配送时效全面改善，建议维持当前策略',
        action: '查看配送设置', settingPath: '/mine/delivery-settings' },
      { level: 'warn', title: '配送成本小幅上涨，小费占比升至7.1%',
        desc: '成本增幅可控，建议关注小费支出趋势',
        action: '去查看成本', settingPath: '/mine/delivery-settings' },
    ],
  },
};

const levelConfig = {
  bad:  { color: '#ff4d4f', bg: '#fff1f0', border: '#ffccc7', tag: '需关注' },
  warn: { color: '#faad14', bg: '#fffbe6', border: '#ffe58f', tag: '可优化' },
  good: { color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f', tag: '良好' },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [activePlatform, setActivePlatform] = useState<PlatformKey>('meituan');
  const [stats, setStats] = useState({
    todayOrders: 0, completedOrders: 0, pendingOrders: 0, todayRevenue: 0,
  });

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadDashboard = async () => {
    try {
      const { data } = await client.get('/statistics/dashboard');
      setStats(data);
    } catch (error) {
      console.error('加载仪表盘失败:', error);
    }
  };

  // 当前平台数据
  const current = platformData[activePlatform];
  const pCfg = platforms.find(p => p.key === activePlatform)!;
  const scoreDiff = +(current.merchantScore - current.lastMonthScore).toFixed(1);

  // 找出下降最多的维度（主要影响因素）
  const worstDim = current.dimensions.reduce((worst, d) => {
    const diff = d.score - d.lastMonth;
    return diff < worst.diff ? { dim: d.dimension, diff } : worst;
  }, { dim: '', diff: 0 });

  return (
    <div style={{ padding: '16px', background: '#f0f2f5', minHeight: '100vh' }}>
      <h2 style={{ marginBottom: 16, fontSize: 18, fontWeight: 600 }}>今日数据概览</h2>

      {/* 基础数据卡片 */}
      <Row gutter={[12, 12]}>
        <Col span={12}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <Statistic title="今日订单" value={stats.todayOrders}
              prefix={<ShoppingOutlined />} valueStyle={{ color: '#3f8600', fontSize: 22 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <Statistic title="已完成" value={stats.completedOrders}
              prefix={<CheckCircleOutlined />} valueStyle={{ color: '#1890ff', fontSize: 22 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <Statistic title="待处理" value={stats.pendingOrders}
              prefix={<ClockCircleOutlined />} valueStyle={{ color: '#faad14', fontSize: 22 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <Statistic title="今日营收" value={stats.todayRevenue}
              prefix="¥" precision={2} valueStyle={{ color: '#cf1322', fontSize: 22 }} />
          </Card>
        </Col>
      </Row>

      {/* 配送经营雷达 */}
      <Card size="small" style={{
        marginTop: 16, borderRadius: 12, border: 'none',
        boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
      }} styles={{ body: { padding: isMobile ? 16 : 20 } }}>

        {/* 标题 + 平台切换 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ThunderboltOutlined style={{ fontSize: 16, color: '#4A90E2' }} />
            <span style={{ fontSize: 15, fontWeight: 600 }}>配送经营雷达</span>
            <Tag color="blue" style={{ fontSize: 11, lineHeight: '18px', borderRadius: 10 }}>2月</Tag>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {platforms.map(p => (
              <div key={p.key} onClick={() => setActivePlatform(p.key)}
                style={{
                  padding: '4px 12px', borderRadius: 16, fontSize: 12, fontWeight: 500,
                  cursor: 'pointer', transition: 'all 0.2s',
                  background: activePlatform === p.key ? p.color : '#f5f5f5',
                  color: activePlatform === p.key ? '#fff' : '#999',
                }}>
                {p.name}
              </div>
            ))}
          </div>
        </div>

        {/* 平台商户评分 */}
        <div style={{
          padding: '16px', borderRadius: 12, marginBottom: 16,
          background: `linear-gradient(135deg, ${pCfg.bg}, #fff)`,
          border: `1px solid ${pCfg.color}20`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>{pCfg.name}商户评分</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 36, fontWeight: 700, color: pCfg.color }}>
                  {current.merchantScore}
                </span>
                <span style={{ fontSize: 14, color: '#999' }}>/ 5.0</span>
                <span style={{
                  fontSize: 13, fontWeight: 500,
                  color: scoreDiff >= 0 ? '#52c41a' : '#ff4d4f',
                }}>
                  {scoreDiff >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  {' '}{Math.abs(scoreDiff)}
                </span>
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#999', textAlign: 'right' }}>
              <div>1月: {current.lastMonthScore}</div>
              <div style={{ marginTop: 2, color: scoreDiff >= 0 ? '#52c41a' : '#ff4d4f' }}>
                {scoreDiff >= 0 ? '评分上升' : '评分下降'}
              </div>
            </div>
          </div>
        </div>

        {/* 图例 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, fontSize: 12, color: '#999', marginBottom: 4 }}>
          <span><span style={{ display: 'inline-block', width: 16, height: 2, background: '#d9d9d9', verticalAlign: 'middle', marginRight: 4, borderTop: '1px dashed #d9d9d9' }} />1月</span>
          <span><span style={{ display: 'inline-block', width: 16, height: 2, background: pCfg.color, verticalAlign: 'middle', marginRight: 4 }} />2月</span>
        </div>

        {/* 雷达图 — 精简顶点标签，避免重叠 */}
        <div style={{ width: '100%', height: isMobile ? 260 : 300 }}>
          <ResponsiveContainer>
            <RadarChart data={current.dimensions} cx="50%" cy="50%" outerRadius={isMobile ? 65 : 80}>
              <PolarGrid stroke="#e8e8e8" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={(props: any) => {
                  const { x, y, payload, index } = props;
                  const item = current.dimensions.find(d => d.dimension === payload.value);
                  if (!item) return <g />;
                  const diff = item.score - item.lastMonth;
                  const isWorst = worstDim.diff < 0 && payload.value === worstDim.dim;

                  // 3个顶点：index 0=顶部, 1=左下, 2=右下
                  // 标签沿径向推到最外层三角形顶点的外侧
                  let anchor: string = 'middle';
                  let dx = 0;
                  let baseY = 0;
                  if (index === 0) {
                    baseY = -14;
                  } else if (index === 1) {
                    // 配送成本：右底角
                    anchor = 'start'; dx = 36; baseY = 16;
                  } else {
                    // 骑手响应：左底角
                    anchor = 'end'; dx = -36; baseY = 16;
                  }

                  return (
                    <g transform={`translate(${x + dx},${y + baseY})`}>
                      <text textAnchor={anchor} fontSize={12} fontWeight={500} fill="#666" dy={-4}>
                        {payload.value}
                      </text>
                      <text textAnchor={anchor} fontSize={18} fontWeight={700} fill={isWorst ? '#ff4d4f' : pCfg.color} dy={16}>
                        {item.score}
                        <tspan fontSize={12} fill={diff >= 0 ? '#52c41a' : '#ff4d4f'}>
                          {' '}{diff >= 0 ? '↑' : '↓'}{Math.abs(diff)}
                        </tspan>
                      </text>
                    </g>
                  );
                }}
              />
              <Radar name="1月" dataKey="lastMonth" stroke="#d9d9d9" fill="#d9d9d9"
                fillOpacity={0.12} strokeDasharray="4 4" dot={{ r: 3, fill: '#d9d9d9', stroke: '#d9d9d9' }} />
              <Radar name="2月" dataKey="score" stroke={pCfg.color} fill={pCfg.color}
                fillOpacity={0.2} strokeWidth={2} dot={{ r: 4, fill: pCfg.color, stroke: '#fff', strokeWidth: 2 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* 三维度详情 */}
        <div style={{ marginTop: 12 }}>
          {current.dimensions.map(d => {
            const detail = current.dimensionDetails[d.dimension];
            const isWorst = worstDim.diff < 0 && d.dimension === worstDim.dim;
            return (
              <div key={d.dimension} style={{
                padding: '14px 16px', borderRadius: 12, marginBottom: 10,
                background: isWorst ? '#fff1f0' : '#fafafa',
                border: isWorst ? '1px solid #ffccc7' : '1px solid #f0f0f0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ color: detail.color, fontSize: 16, display: 'flex' }}>{detail.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#262626' }}>{d.dimension}</span>
                  {isWorst && (
                    <Tag color="#ff4d4f" style={{ margin: 0, borderRadius: 6, fontSize: 11 }}>
                      <WarningFilled /> 主要影响
                    </Tag>
                  )}
                </div>
                {detail.metrics.map(m => {
                  const cfg = levelConfig[m.status];
                  return (
                    <div key={m.label} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 0', borderBottom: '1px solid #f0f0f0',
                    }}>
                      <span style={{ fontSize: 13, color: '#666' }}>{m.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#262626' }}>{m.value}</span>
                        {m.prev && (
                          <span style={{ fontSize: 12, color: cfg.color }}>
                            {m.status === 'good' ? '↑' : m.status === 'bad' ? '↓' : '→'} {m.prev}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </Card>

      {/* 智能建议 */}
      <Card size="small" style={{
        marginTop: 16, borderRadius: 12, border: 'none',
        boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
      }} styles={{ body: { padding: isMobile ? 16 : 20 } }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <ThunderboltOutlined style={{ fontSize: 16, color: '#faad14' }} />
          <span style={{ fontSize: 15, fontWeight: 600 }}>智能建议</span>
          <Tag color="orange" style={{ fontSize: 11, lineHeight: '18px', borderRadius: 10 }}>
            {pCfg.name} · {current.suggestions.length}条
          </Tag>
        </div>

        {current.suggestions.map((s, i) => {
          const cfg = levelConfig[s.level];
          return (
            <div key={i} style={{
              padding: '12px 14px', borderRadius: 10, marginBottom: 8,
              background: cfg.bg, border: `1px solid ${cfg.border}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Tag color={cfg.color} style={{ margin: 0, borderRadius: 6, fontSize: 11 }}>
                    {cfg.tag}
                  </Tag>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#262626' }}>{s.title}</span>
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>{s.desc}</div>
              </div>
              <Button type="link" size="small"
                onClick={() => navigate(s.settingPath)}
                style={{ padding: 0, fontSize: 12, whiteSpace: 'nowrap' }}>
                {s.action} <RightOutlined />
              </Button>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
