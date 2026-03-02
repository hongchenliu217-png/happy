import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Statistic, Tag, Button, Modal } from 'antd';
import {
  ShoppingOutlined, CheckCircleOutlined, ClockCircleOutlined,
  DollarOutlined, RightOutlined, ThunderboltOutlined,
  FieldTimeOutlined, SwapOutlined, ArrowUpOutlined, ArrowDownOutlined,
  WarningFilled, EyeOutlined, StarOutlined, FileDoneOutlined
} from '@ant-design/icons';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import client from '../api/client';

// ─── 平台配置 ───
const platforms = [
  { key: 'meituan', name: '美团', color: '#FF6B00', bg: '#FFF7E6' },
  { key: 'eleme', name: '饿了么', color: '#0097FF', bg: '#E6F7FF' },
] as const;

type PlatformKey = typeof platforms[number]['key'];

// ─── 指标方向定义（用于动态判断好坏）───
const metricDirection: Record<string, 'higher-better' | 'lower-better'> = {
  // 平台评分维度
  '好评率': 'higher-better',
  '差评率': 'lower-better',
  '平均评分': 'higher-better',
  '准时达率': 'higher-better',
  '平均配送时长': 'lower-better',
  '整体超时率': 'lower-better',
  '订单完成率': 'higher-better',
  '取消率': 'lower-better',
  '拒单率': 'lower-better',
  // 经营效率维度
  '单均配送费': 'lower-better',
  '配送费占比': 'lower-better',
  '小费支出占比': 'lower-better',
  '平均接单耗时': 'lower-better',
  '首次呼叫成功率': 'higher-better',
  '升级触发率': 'lower-better',
};

// 动态计算指标状态
const getMetricStatus = (label: string, current: string, prev: string): 'good' | 'warn' | 'bad' => {
  const direction = metricDirection[label];
  if (!direction || !prev) return 'good';

  const currNum = parseFloat(current.replace(/[^0-9.]/g, ''));
  const prevNum = parseFloat(prev.replace(/[^0-9.]/g, ''));
  const diff = currNum - prevNum;

  if (Math.abs(diff) < 0.01) return 'good'; // 基本无变化

  if (direction === 'higher-better') {
    // 越高越好的指标（准时达率、成功率等）
    if (diff > 0) return 'good'; // 上升是好事
    if (diff < -2) return 'bad';  // 下降超过2就是坏事
    return 'warn';
  } else {
    // 越低越好的指标（配送时长、超时率、成本等）
    if (diff < 0) return 'good'; // 下降是好事
    if (diff > 2) return 'bad';   // 上升超过2就是坏事
    return 'warn';
  }
};

// ─── 各平台数据（6月 vs 5月 mock — 正常经营月份对比）───
const platformData: Record<PlatformKey, {
  merchantScore: number;
  lastMonthScore: number;
  dimensions: { dimension: string; score: number; lastMonth: number; fullMark: number }[];
  dimensionDetails: Record<string, {
    color: string; icon: React.ReactNode;
    metrics: { label: string; value: string; prev?: string }[];
  }>;
  timeoutDetails?: { period: string; rate: string; prev: string; time: string }[];
  fulfillmentDetails?: {
    platforms: { name: string; code: string; completionRate: string; prevCompletionRate: string; cancelRate: string; prevCancelRate: string; rejectRate: string; prevRejectRate: string; avgTime: string; reliability: 'high' | 'medium' | 'low' }[];
    suggestions: { text: string; action: string; navSection: string }[];
  };
  reviewDetails?: {
    platforms: { name: string; code: string; positiveRate: string; prevPositiveRate: string; negativeRate: string; prevNegativeRate: string; avgScore: string; prevAvgScore: string; reliability: 'high' | 'medium' | 'low' }[];
    suggestions: { text: string; action: string; navSection: string }[];
  };
  deliveryTimeDetails?: {
    platforms: { name: string; code: string; onTimeRate: string; prevOnTimeRate: string; avgTime: string; prevAvgTime: string; timeoutRate: string; prevTimeoutRate: string; reliability: 'high' | 'medium' | 'low' }[];
    suggestions: { text: string; action: string; navSection: string }[];
  };
  costDetails?: {
    platforms: { name: string; code: string; avgFee: string; prevAvgFee: string; feeRatio: string; prevFeeRatio: string; tipRatio: string; prevTipRatio: string; reliability: 'high' | 'medium' | 'low' }[];
    suggestions: { text: string; action: string; navSection: string }[];
  };
  suggestions: { level: 'good' | 'warn' | 'bad'; title: string; desc: string; action: string; settingPath: string; navSection?: string }[];
}> = {
  meituan: {
    merchantScore: 4.5,
    lastMonthScore: 4.6,
    dimensions: [
      { dimension: '顾客评价', score: 70, lastMonth: 74, fullMark: 100 },
      { dimension: '配送时效', score: 72, lastMonth: 75, fullMark: 100 },
      { dimension: '订单履约', score: 68, lastMonth: 72, fullMark: 100 },
    ],
    dimensionDetails: {
      '顾客评价': {
        color: '#faad14', icon: <StarOutlined />,
        metrics: [
          { label: '好评率', value: '89.2%', prev: '92.1%' },
          { label: '差评率', value: '3.8%', prev: '2.5%' },
          { label: '平均评分', value: '4.5', prev: '4.6' },
        ],
      },
      '配送时效': {
        color: '#1890ff', icon: <FieldTimeOutlined />,
        metrics: [
          { label: '准时达率', value: '88.5%', prev: '91.2%' },
          { label: '平均配送时长', value: '32分钟', prev: '29分钟' },
          { label: '整体超时率', value: '15.3%', prev: '12.1%' },
          { label: '平均接单耗时', value: '58秒', prev: '51秒' },
          { label: '首次呼叫成功率', value: '68%', prev: '73%' },
          { label: '升级触发率', value: '32%', prev: '27%' },
        ],
      },
      '订单履约': {
        color: '#52c41a', icon: <FileDoneOutlined />,
        metrics: [
          { label: '订单完成率', value: '95.2%', prev: '97.1%' },
          { label: '取消率', value: '3.1%', prev: '1.8%' },
          { label: '拒单率', value: '1.7%', prev: '1.1%' },
        ],
      },
      '配送成本': {
        color: '#722ed1', icon: <DollarOutlined />,
        metrics: [
          { label: '单均配送费', value: '¥6.2', prev: '¥5.8' },
          { label: '配送费占比', value: '20.5%', prev: '19.1%' },
          { label: '小费支出占比', value: '8.7%', prev: '7.2%' },
        ],
      },
    },
    timeoutDetails: [
      { period: '早高峰', rate: '18.5%', prev: '15.2%', time: '07:00-09:00' },
      { period: '午高峰', rate: '22.3%', prev: '18.8%', time: '11:00-13:00' },
      { period: '晚高峰', rate: '15.8%', prev: '13.5%', time: '17:00-19:00' },
      { period: '平峰时段', rate: '8.2%', prev: '7.1%', time: '其他时段' },
    ],
    fulfillmentDetails: {
      platforms: [
        { name: '闪送', code: 'shansong', completionRate: '99.1%', prevCompletionRate: '98.8%', cancelRate: '0.5%', prevCancelRate: '0.7%', rejectRate: '0.4%', prevRejectRate: '0.5%', avgTime: '25分钟', reliability: 'high' },
        { name: '顺丰同城', code: 'sf', completionRate: '96.5%', prevCompletionRate: '97.2%', cancelRate: '2.1%', prevCancelRate: '1.6%', rejectRate: '1.4%', prevRejectRate: '1.2%', avgTime: '30分钟', reliability: 'medium' },
        { name: '达达配送', code: 'dada', completionRate: '91.8%', prevCompletionRate: '95.3%', cancelRate: '5.2%', prevCancelRate: '2.8%', rejectRate: '3.0%', prevRejectRate: '1.9%', avgTime: '35分钟', reliability: 'low' },
      ],
      suggestions: [
        { text: '午高峰(11:00-13:00)达达取消率高达8.1%，建议该时段切换为闪送优先', action: '去设置分时段策略', navSection: 'time-based' },
        { text: '高价订单(¥100+)建议指定顺丰或闪送，履约更有保障', action: '去设置金额分级', navSection: 'amount-based' },
        { text: '达达近期履约波动大，建议降低其派单优先级', action: '去调整派单策略', navSection: 'time-based' },
      ],
    },
    reviewDetails: {
      platforms: [
        { name: '闪送', code: 'shansong', positiveRate: '96.5%', prevPositiveRate: '96.2%', negativeRate: '1.2%', prevNegativeRate: '1.5%', avgScore: '4.8', prevAvgScore: '4.7', reliability: 'high' },
        { name: '顺丰同城', code: 'sf', positiveRate: '92.8%', prevPositiveRate: '93.5%', negativeRate: '2.5%', prevNegativeRate: '2.1%', avgScore: '4.6', prevAvgScore: '4.7', reliability: 'medium' },
        { name: '达达配送', code: 'dada', positiveRate: '82.1%', prevPositiveRate: '87.8%', negativeRate: '6.5%', prevNegativeRate: '3.8%', avgScore: '4.1', prevAvgScore: '4.4', reliability: 'low' },
      ],
      suggestions: [
        { text: '达达配送差评率飙升至6.5%，主因是配送超时和服务态度，建议降低其派单比例', action: '去调整派单策略', navSection: 'time-based' },
        { text: '闪送好评率最高(96.5%)，高价值订单建议优先指定', action: '去设置金额分级', navSection: 'amount-based' },
        { text: '顺丰同城评分小幅下滑，关注其服务质量变化', action: '查看配送设置', navSection: 'time-based' },
      ],
    },
    deliveryTimeDetails: {
      platforms: [
        { name: '闪送', code: 'shansong', onTimeRate: '95.8%', prevOnTimeRate: '95.2%', avgTime: '25分钟', prevAvgTime: '26分钟', timeoutRate: '4.2%', prevTimeoutRate: '4.8%', reliability: 'high' },
        { name: '顺丰同城', code: 'sf', onTimeRate: '90.5%', prevOnTimeRate: '92.1%', avgTime: '30分钟', prevAvgTime: '28分钟', timeoutRate: '9.5%', prevTimeoutRate: '7.9%', reliability: 'medium' },
        { name: '达达配送', code: 'dada', onTimeRate: '79.2%', prevOnTimeRate: '86.5%', avgTime: '38分钟', prevAvgTime: '32分钟', timeoutRate: '20.8%', prevTimeoutRate: '13.5%', reliability: 'low' },
      ],
      suggestions: [
        { text: '达达配送超时率飙升至20.8%，午高峰尤为严重，建议该时段切换为闪送', action: '去设置分时段策略', navSection: 'time-based' },
        { text: '顺丰同城配送时长增加2分钟，关注其运力紧张情况', action: '查看配送设置', navSection: 'time-based' },
        { text: '闪送准时达率最高(95.8%)，时效敏感订单建议优先指定', action: '去设置金额分级', navSection: 'amount-based' },
      ],
    },
    costDetails: {
      platforms: [
        { name: '闪送', code: 'shansong', avgFee: '¥7.2', prevAvgFee: '¥6.8', feeRatio: '22.5%', prevFeeRatio: '21.2%', tipRatio: '10.2%', prevTipRatio: '8.5%', reliability: 'medium' },
        { name: '顺丰同城', code: 'sf', avgFee: '¥6.5', prevAvgFee: '¥6.2', feeRatio: '20.8%', prevFeeRatio: '20.1%', tipRatio: '8.5%', prevTipRatio: '7.8%', reliability: 'medium' },
        { name: '达达配送', code: 'dada', avgFee: '¥4.8', prevAvgFee: '¥4.5', feeRatio: '18.2%', prevFeeRatio: '17.5%', tipRatio: '7.1%', prevTipRatio: '6.2%', reliability: 'high' },
      ],
      suggestions: [
        { text: '闪送配送费最高但履约最稳定，建议高价值订单使用', action: '去设置金额分级', navSection: 'amount-based' },
        { text: '达达配送成本最低，但近期履约波动大，建议谨慎使用', action: '去调整派单策略', navSection: 'time-based' },
        { text: '小费支出整体上涨，建议优化等待时间和升级策略', action: '去调整等待时间', navSection: 'escalation' },
      ],
    },
    suggestions: [
      { level: 'bad', title: '顾客好评率下降至89.2%，差评率上升',
        desc: '差评率环比上升1.3%，配送超时是主因，建议优化高峰时段派单策略',
        action: '去优化派单策略', settingPath: '/mine/delivery-settings', navSection: 'time-based' },
      { level: 'bad', title: '订单履约率下滑，取消率升至3.1%',
        desc: '无人接单导致取消增多，建议调整等待时间和升级策略',
        action: '去调整等待时间', settingPath: '/mine/delivery-settings', navSection: 'escalation' },
      { level: 'warn', title: '配送时效持续下滑，准时达率降至88.5%',
        desc: '午高峰超时率上升3.2%，建议高峰时段优先选择速度快的平台',
        action: '去优化派单策略', settingPath: '/mine/delivery-settings', navSection: 'time-based' },
    ],
  },
  eleme: {
    merchantScore: 4.7,
    lastMonthScore: 4.6,
    dimensions: [
      { dimension: '顾客评价', score: 80, lastMonth: 76, fullMark: 100 },
      { dimension: '配送时效', score: 78, lastMonth: 75, fullMark: 100 },
      { dimension: '订单履约', score: 76, lastMonth: 73, fullMark: 100 },
    ],
    dimensionDetails: {
      '顾客评价': {
        color: '#faad14', icon: <StarOutlined />,
        metrics: [
          { label: '好评率', value: '94.5%', prev: '93.1%' },
          { label: '差评率', value: '1.8%', prev: '2.2%' },
          { label: '平均评分', value: '4.7', prev: '4.6' },
        ],
      },
      '配送时效': {
        color: '#1890ff', icon: <FieldTimeOutlined />,
        metrics: [
          { label: '准时达率', value: '92.8%', prev: '91.5%' },
          { label: '平均配送时长', value: '28分钟', prev: '30分钟' },
          { label: '整体超时率', value: '10.2%', prev: '11.8%' },
          { label: '平均接单耗时', value: '48秒', prev: '52秒' },
          { label: '首次呼叫成功率', value: '76%', prev: '72%' },
          { label: '升级触发率', value: '24%', prev: '28%' },
        ],
      },
      '订单履约': {
        color: '#52c41a', icon: <FileDoneOutlined />,
        metrics: [
          { label: '订单完成率', value: '98.1%', prev: '97.5%' },
          { label: '取消率', value: '1.2%', prev: '1.5%' },
          { label: '拒单率', value: '0.7%', prev: '1.0%' },
        ],
      },
      '配送成本': {
        color: '#722ed1', icon: <DollarOutlined />,
        metrics: [
          { label: '单均配送费', value: '¥5.9', prev: '¥5.6' },
          { label: '配送费占比', value: '19.6%', prev: '18.9%' },
          { label: '小费支出占比', value: '7.8%', prev: '7.1%' },
        ],
      },
    },
    timeoutDetails: [
      { period: '早高峰', rate: '12.5%', prev: '14.2%', time: '07:00-09:00' },
      { period: '午高峰', rate: '14.8%', prev: '16.5%', time: '11:00-13:00' },
      { period: '晚高峰', rate: '10.3%', prev: '12.1%', time: '17:00-19:00' },
      { period: '平峰时段', rate: '6.1%', prev: '7.8%', time: '其他时段' },
    ],
    fulfillmentDetails: {
      platforms: [
        { name: '闪送', code: 'shansong', completionRate: '99.5%', prevCompletionRate: '99.2%', cancelRate: '0.3%', prevCancelRate: '0.5%', rejectRate: '0.2%', prevRejectRate: '0.3%', avgTime: '23分钟', reliability: 'high' },
        { name: '顺丰同城', code: 'sf', completionRate: '98.2%', prevCompletionRate: '97.8%', cancelRate: '1.0%', prevCancelRate: '1.3%', rejectRate: '0.8%', prevRejectRate: '0.9%', avgTime: '27分钟', reliability: 'high' },
        { name: '达达配送', code: 'dada', completionRate: '96.1%', prevCompletionRate: '95.5%', cancelRate: '2.5%', prevCancelRate: '2.8%', rejectRate: '1.4%', prevRejectRate: '1.7%', avgTime: '31分钟', reliability: 'medium' },
      ],
      suggestions: [
        { text: '各平台履约表现均有提升，当前策略运行良好', action: '查看配送设置', navSection: 'time-based' },
        { text: '闪送履约率最高(99.5%)，高价订单可优先指定', action: '去设置金额分级', navSection: 'amount-based' },
      ],
    },
    reviewDetails: {
      platforms: [
        { name: '闪送', code: 'shansong', positiveRate: '97.8%', prevPositiveRate: '97.2%', negativeRate: '0.8%', prevNegativeRate: '1.1%', avgScore: '4.9', prevAvgScore: '4.8', reliability: 'high' },
        { name: '顺丰同城', code: 'sf', positiveRate: '95.2%', prevPositiveRate: '94.8%', negativeRate: '1.5%', prevNegativeRate: '1.8%', avgScore: '4.8', prevAvgScore: '4.7', reliability: 'high' },
        { name: '达达配送', code: 'dada', positiveRate: '90.5%', prevPositiveRate: '89.1%', negativeRate: '2.8%', prevNegativeRate: '3.5%', avgScore: '4.5', prevAvgScore: '4.4', reliability: 'medium' },
      ],
      suggestions: [
        { text: '各平台好评率均有提升，闪送表现最佳(97.8%)', action: '查看配送设置', navSection: 'time-based' },
        { text: '达达配送好评率提升明显，可适当增加其派单比例', action: '去调整派单策略', navSection: 'time-based' },
      ],
    },
    deliveryTimeDetails: {
      platforms: [
        { name: '闪送', code: 'shansong', onTimeRate: '97.2%', prevOnTimeRate: '96.8%', avgTime: '23分钟', prevAvgTime: '24分钟', timeoutRate: '2.8%', prevTimeoutRate: '3.2%', reliability: 'high' },
        { name: '顺丰同城', code: 'sf', onTimeRate: '94.5%', prevOnTimeRate: '93.8%', avgTime: '27分钟', prevAvgTime: '28分钟', timeoutRate: '5.5%', prevTimeoutRate: '6.2%', reliability: 'high' },
        { name: '达达配送', code: 'dada', onTimeRate: '88.1%', prevOnTimeRate: '86.5%', avgTime: '31分钟', prevAvgTime: '33分钟', timeoutRate: '11.9%', prevTimeoutRate: '13.5%', reliability: 'medium' },
      ],
      suggestions: [
        { text: '各平台时效均有改善，闪送准时达率最高(97.2%)', action: '查看配送设置', navSection: 'time-based' },
        { text: '达达配送时长缩短2分钟，时效提升明显', action: '查看配送设置', navSection: 'time-based' },
      ],
    },
    costDetails: {
      platforms: [
        { name: '闪送', code: 'shansong', avgFee: '¥6.8', prevAvgFee: '¥6.5', feeRatio: '21.2%', prevFeeRatio: '20.5%', tipRatio: '9.1%', prevTipRatio: '8.2%', reliability: 'medium' },
        { name: '顺丰同城', code: 'sf', avgFee: '¥6.2', prevAvgFee: '¥5.9', feeRatio: '19.8%', prevFeeRatio: '19.2%', tipRatio: '7.9%', prevTipRatio: '7.3%', reliability: 'medium' },
        { name: '达达配送', code: 'dada', avgFee: '¥4.5', prevAvgFee: '¥4.3', feeRatio: '17.5%', prevFeeRatio: '17.1%', tipRatio: '6.5%', prevTipRatio: '6.1%', reliability: 'high' },
      ],
      suggestions: [
        { text: '各平台成本均小幅上涨，整体可控', action: '查看配送设置', navSection: 'time-based' },
        { text: '达达配送成本最低，可适当增加派单比例', action: '去调整派单策略', navSection: 'time-based' },
      ],
    },
    suggestions: [
      { level: 'good', title: '顾客好评率提升至94.5%，评分稳步上升',
        desc: '饿了么整体表现优秀，配送时长缩短2分钟，建议维持当前策略',
        action: '查看配送设置', settingPath: '/mine/delivery-settings', navSection: 'time-based' },
      { level: 'good', title: '订单履约率持续优化，完成率达98.1%',
        desc: '取消率和拒单率均下降，运力稳定',
        action: '查看配送设置', settingPath: '/mine/delivery-settings', navSection: 'escalation' },
      { level: 'warn', title: '配送成本小幅上涨，小费占比增加0.7%',
        desc: '成本增幅可控，建议关注小费支出趋势，避免进一步上升',
        action: '去查看成本', settingPath: '/mine/delivery-settings', navSection: 'escalation' },
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
  const [timeoutModalVisible, setTimeoutModalVisible] = useState(false);
  const [fulfillmentModalVisible, setFulfillmentModalVisible] = useState(false);
  const [fulfillmentHighlight, setFulfillmentHighlight] = useState<string>('');
  const [dimensionModalVisible, setDimensionModalVisible] = useState(false);
  const [selectedDimension, setSelectedDimension] = useState<string>('');
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewHighlight, setReviewHighlight] = useState<string>('');
  const [deliveryTimeModalVisible, setDeliveryTimeModalVisible] = useState(false);
  const [deliveryTimeHighlight, setDeliveryTimeHighlight] = useState<string>('');
  const [costModalVisible, setCostModalVisible] = useState(false);
  const [costHighlight, setCostHighlight] = useState<string>('');
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
            <Tag color="blue" style={{ fontSize: 11, lineHeight: '18px', borderRadius: 10 }}>6月</Tag>
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
              <div>5月: {current.lastMonthScore}</div>
              <div style={{ marginTop: 2, color: scoreDiff >= 0 ? '#52c41a' : '#ff4d4f' }}>
                {scoreDiff >= 0 ? '评分上升' : '评分下降'}
              </div>
            </div>
          </div>
        </div>

        {/* 图例 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, fontSize: 12, color: '#999', marginBottom: 4 }}>
          <span><span style={{ display: 'inline-block', width: 16, height: 2, background: '#d9d9d9', verticalAlign: 'middle', marginRight: 4, borderTop: '1px dashed #d9d9d9' }} />5月</span>
          <span><span style={{ display: 'inline-block', width: 16, height: 2, background: pCfg.color, verticalAlign: 'middle', marginRight: 4 }} />6月</span>
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
                  let anchor: 'start' | 'middle' | 'end' = 'middle';
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

        {/* 三维度快捷入口按钮 */}
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          {current.dimensions.map(d => {
            const detail = current.dimensionDetails[d.dimension];
            const isWorst = worstDim.diff < 0 && d.dimension === worstDim.dim;
            const diff = d.score - d.lastMonth;
            return (
              <Button
                key={d.dimension}
                size="large"
                style={{
                  flex: 1,
                  height: 'auto',
                  padding: '12px 8px',
                  borderRadius: 12,
                  border: isWorst ? '2px solid #ff4d4f' : '1px solid #e8e8e8',
                  background: isWorst ? '#fff1f0' : '#fafafa',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}
                onClick={() => {
                  setSelectedDimension(d.dimension);
                  setDimensionModalVisible(true);
                }}
              >
                <div style={{ color: detail.color, fontSize: 18, display: 'flex' }}>
                  {detail.icon}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#262626' }}>
                  {d.dimension}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: isWorst ? '#ff4d4f' : pCfg.color }}>
                    {d.score}
                  </span>
                  <span style={{ fontSize: 11, color: diff >= 0 ? '#52c41a' : '#ff4d4f' }}>
                    {diff >= 0 ? '↑' : '↓'}{Math.abs(diff)}
                  </span>
                </div>
                {isWorst && (
                  <Tag color="#ff4d4f" style={{ margin: 0, fontSize: 10, padding: '0 4px', lineHeight: '16px' }}>
                    主要影响
                  </Tag>
                )}
              </Button>
            );
          })}
        </div>
      </Card>

      {/* 配送成本 */}
      <Card size="small" style={{
        marginTop: 16, borderRadius: 12, border: 'none',
        boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
      }} styles={{ body: { padding: isMobile ? 16 : 20 } }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <DollarOutlined style={{ fontSize: 16, color: '#722ed1' }} />
          <span style={{ fontSize: 15, fontWeight: 600 }}>配送成本</span>
          <Tag color="purple" style={{ fontSize: 11, lineHeight: '18px', borderRadius: 10 }}>6月</Tag>
        </div>
        {current.dimensionDetails['配送成本']?.metrics.map(m => {
          const status = getMetricStatus(m.label, m.value, m.prev || '');
          const isBad = status === 'bad';

          let changeText = '';
          let changePercent = 0;
          if (m.prev) {
            const currNum = parseFloat(m.value.replace(/[^0-9.]/g, ''));
            const prevNum = parseFloat(m.prev.replace(/[^0-9.]/g, ''));
            const diff = currNum - prevNum;
            changePercent = prevNum !== 0 ? (diff / prevNum) * 100 : 0;
            const isPercent = m.value.includes('%');
            const unit = isPercent ? '%' : m.value.includes('¥') ? '' : '';
            changeText = m.value.includes('¥')
              ? `${diff >= 0 ? '+' : ''}¥${Math.abs(diff).toFixed(1)}`
              : `${diff >= 0 ? '+' : ''}${diff.toFixed(isPercent ? 1 : 0)}${unit}`;
          }

          return (
            <div key={m.label} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px',
              background: isBad
                ? 'linear-gradient(135deg, #fff1f0 0%, #ffe7e6 100%)'
                : 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
              borderRadius: 10,
              marginBottom: 8,
              border: isBad ? '2px solid #ff4d4f' : '1px solid #e8e8e8',
              boxShadow: isBad ? '0 2px 8px rgba(255, 77, 79, 0.15)' : '0 1px 4px rgba(0,0,0,0.04)',
              transition: 'all 0.2s',
              cursor: 'pointer',
            }}
            onClick={() => {
              setCostHighlight(m.label);
              setCostModalVisible(true);
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isBad && (
                  <div style={{
                    width: 4, height: 24, background: '#ff4d4f',
                    borderRadius: 2, marginRight: 4,
                    boxShadow: '0 0 8px rgba(255, 77, 79, 0.4)'
                  }} />
                )}
                <span style={{
                  fontSize: 14,
                  color: '#1a1a1a',
                  fontWeight: 600,
                  letterSpacing: '0.3px'
                }}>
                  {m.label}
                </span>
                <EyeOutlined style={{ fontSize: 14, color: '#1890ff', marginLeft: 4 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {m.prev && (
                  <>
                    <span style={{
                      fontSize: 15,
                      color: '#595959',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      padding: '4px 10px',
                      background: '#f5f5f5',
                      borderRadius: 6,
                      border: '1px solid #e8e8e8',
                      width: '80px',
                      textAlign: 'center',
                      display: 'inline-block'
                    }}>
                      {m.prev}
                    </span>
                    <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
                      <path d="M3 8 L13 8 M10 5 L13 8 L10 11" stroke="#bfbfbf" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
                )}
                <span style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: isBad ? '#ff4d4f' : '#1a1a1a',
                  fontFamily: 'monospace',
                  letterSpacing: '0.5px',
                  width: '80px',
                  textAlign: 'center',
                  display: 'inline-block',
                  padding: '4px 10px',
                  background: isBad ? 'rgba(255, 77, 79, 0.08)' : 'rgba(0, 0, 0, 0.02)',
                  borderRadius: 6,
                  border: isBad ? '1px solid rgba(255, 77, 79, 0.2)' : '1px solid rgba(0, 0, 0, 0.06)'
                }}>
                  {m.value}
                </span>
                {changeText && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3,
                    padding: '4px 10px',
                    borderRadius: 14,
                    minWidth: '100px',
                    background: status === 'good'
                      ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)'
                      : status === 'bad'
                      ? 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)'
                      : 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)',
                    boxShadow: status === 'good'
                      ? '0 2px 10px rgba(82, 196, 26, 0.35)'
                      : status === 'bad'
                      ? '0 2px 10px rgba(255, 77, 79, 0.35)'
                      : '0 2px 10px rgba(250, 173, 20, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#fff',
                      fontFamily: 'monospace',
                      textShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }}>
                      {changeText}
                    </span>
                    {Math.abs(changePercent) > 1 && (
                      <span style={{
                        fontSize: 10,
                        color: '#fff',
                        opacity: 0.95,
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        textShadow: '0 1px 2px rgba(0,0,0,0.15)'
                      }}>
                        ({changePercent > 0 ? '+' : ''}{changePercent.toFixed(0)}%)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
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
                onClick={() => navigate(s.settingPath, { state: { section: s.navSection } })}
                style={{ padding: 0, fontSize: 12, whiteSpace: 'nowrap' }}>
                {s.action} <RightOutlined />
              </Button>
            </div>
          );
        })}
      </Card>

      {/* 时段超时率详情弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FieldTimeOutlined style={{ color: '#1890ff' }} />
            <span>分时段超时率详情</span>
            <Tag color="blue" style={{ fontSize: 11 }}>6月</Tag>
          </div>
        }
        open={timeoutModalVisible}
        onCancel={() => setTimeoutModalVisible(false)}
        footer={null}
        width={600}
      >
        <div style={{ marginTop: 16 }}>
          {current.timeoutDetails?.map((item, idx) => {
            const currRate = parseFloat(item.rate);
            const prevRate = parseFloat(item.prev);
            const diff = currRate - prevRate;
            const isBad = diff > 1;

            return (
              <div key={idx} style={{
                padding: '14px 16px',
                background: isBad ? 'linear-gradient(135deg, #fff1f0 0%, #ffe7e6 100%)' : '#fafafa',
                borderRadius: 10,
                marginBottom: 10,
                border: isBad ? '2px solid #ff4d4f' : '1px solid #e8e8e8',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>{item.period}</span>
                    <span style={{ fontSize: 12, color: '#999', marginLeft: 8 }}>{item.time}</span>
                  </div>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => {
                      setTimeoutModalVisible(false);
                      navigate('/mine/delivery-settings', { state: { section: 'time-based' } });
                    }}
                    style={{ padding: 0 }}
                  >
                    去优化策略 <RightOutlined />
                  </Button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, color: '#8c8c8c', fontFamily: 'monospace' }}>
                    {item.prev}
                  </span>
                  <span style={{ fontSize: 14, color: '#bfbfbf' }}>→</span>
                  <span style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: isBad ? '#ff4d4f' : '#1a1a1a',
                    fontFamily: 'monospace'
                  }}>
                    {item.rate}
                  </span>
                  <div style={{
                    padding: '2px 8px',
                    borderRadius: 10,
                    background: diff > 0 ? '#ff4d4f' : '#52c41a',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 600,
                  }}>
                    {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}
          <div style={{
            marginTop: 16,
            padding: '12px',
            background: '#e6f7ff',
            borderRadius: 8,
            border: '1px solid #91d5ff',
          }}>
            <div style={{ fontSize: 12, color: '#0050b3', lineHeight: '20px' }}>
              💡 提示：点击"去优化策略"可跳转到配送设置中的分时段策略，针对性调整高峰时段的派单策略（速度优先/低价优先）
            </div>
          </div>
        </div>
      </Modal>

      {/* 维度详情弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {selectedDimension && current.dimensionDetails[selectedDimension] && (
              <>
                <span style={{ color: current.dimensionDetails[selectedDimension].color, fontSize: 18, display: 'flex' }}>
                  {current.dimensionDetails[selectedDimension].icon}
                </span>
                <span>{selectedDimension}</span>
                <Tag color="blue" style={{ fontSize: 11 }}>6月</Tag>
              </>
            )}
          </div>
        }
        open={dimensionModalVisible}
        onCancel={() => { setDimensionModalVisible(false); setSelectedDimension(''); }}
        footer={null}
        width={600}
      >
        {selectedDimension && current.dimensionDetails[selectedDimension] && (
          <div style={{ marginTop: 16 }}>
            {current.dimensionDetails[selectedDimension].metrics.map(m => {
              const status = getMetricStatus(m.label, m.value, m.prev || '');
              const isBad = status === 'bad';

              // 计算增幅
              let changeText = '';
              let changePercent = 0;
              if (m.prev) {
                const currNum = parseFloat(m.value.replace(/[^0-9.]/g, ''));
                const prevNum = parseFloat(m.prev.replace(/[^0-9.]/g, ''));
                const diff = currNum - prevNum;
                changePercent = prevNum !== 0 ? (diff / prevNum) * 100 : 0;
                const isPercent = m.value.includes('%');
                const unit = isPercent ? '%' : m.value.includes('分钟') ? '分钟' : m.value.includes('秒') ? '秒' : '';
                changeText = `${diff >= 0 ? '+' : ''}${diff.toFixed(isPercent ? 1 : 0)}${unit}`;
              }

              const isTimeoutMetric = m.label === '整体超时率';
              const isFulfillmentMetric = m.label === '订单完成率' || m.label === '取消率' || m.label === '拒单率';
              const isReviewMetric = m.label === '好评率' || m.label === '差评率' || m.label === '平均评分';
              const isDeliveryTimeMetric = m.label === '准时达率' || m.label === '平均配送时长' || m.label === '平均接单耗时' || m.label === '首次呼叫成功率' || m.label === '升级触发率';
              const isCostMetric = m.label === '单均配送费' || m.label === '配送费占比' || m.label === '小费支出占比';
              const isClickable = isTimeoutMetric || isFulfillmentMetric || isReviewMetric || isDeliveryTimeMetric || isCostMetric;

              return (
                <div key={m.label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: isBad
                    ? 'linear-gradient(135deg, #fff1f0 0%, #ffe7e6 100%)'
                    : 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                  borderRadius: 10,
                  marginBottom: 8,
                  border: isBad ? '2px solid #ff4d4f' : '1px solid #e8e8e8',
                  boxShadow: isBad ? '0 2px 8px rgba(255, 77, 79, 0.15)' : '0 1px 4px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s',
                  cursor: isClickable ? 'pointer' : 'default',
                }}
                onClick={() => {
                  if (isTimeoutMetric) {
                    setDimensionModalVisible(false);
                    setTimeoutModalVisible(true);
                  }
                  if (isFulfillmentMetric) {
                    setDimensionModalVisible(false);
                    setFulfillmentHighlight(m.label);
                    setFulfillmentModalVisible(true);
                  }
                  if (isReviewMetric) {
                    setDimensionModalVisible(false);
                    setReviewHighlight(m.label);
                    setReviewModalVisible(true);
                  }
                  if (isDeliveryTimeMetric) {
                    setDimensionModalVisible(false);
                    setDeliveryTimeHighlight(m.label);
                    setDeliveryTimeModalVisible(true);
                  }
                  if (isCostMetric) {
                    setDimensionModalVisible(false);
                    setCostHighlight(m.label);
                    setCostModalVisible(true);
                  }
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isBad && (
                      <div style={{
                        width: 4, height: 24, background: '#ff4d4f',
                        borderRadius: 2, marginRight: 4,
                        boxShadow: '0 0 8px rgba(255, 77, 79, 0.4)'
                      }} />
                    )}
                    <span style={{
                      fontSize: 14,
                      color: '#1a1a1a',
                      fontWeight: 600,
                      letterSpacing: '0.3px'
                    }}>
                      {m.label}
                    </span>
                    {isClickable && (
                      <EyeOutlined style={{ fontSize: 14, color: '#1890ff', marginLeft: 4 }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {m.prev && (
                      <>
                        <span style={{
                          fontSize: 15,
                          color: '#595959',
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          padding: '4px 10px',
                          background: '#f5f5f5',
                          borderRadius: 6,
                          border: '1px solid #e8e8e8',
                          width: '80px',
                          textAlign: 'center',
                          display: 'inline-block'
                        }}>
                          {m.prev}
                        </span>
                        <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
                          <path d="M3 8 L13 8 M10 5 L13 8 L10 11" stroke="#bfbfbf" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </>
                    )}
                    <span style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: isBad ? '#ff4d4f' : '#1a1a1a',
                      fontFamily: 'monospace',
                      letterSpacing: '0.5px',
                      width: '80px',
                      textAlign: 'center',
                      display: 'inline-block',
                      padding: '4px 10px',
                      background: isBad ? 'rgba(255, 77, 79, 0.08)' : 'rgba(0, 0, 0, 0.02)',
                      borderRadius: 6,
                      border: isBad ? '1px solid rgba(255, 77, 79, 0.2)' : '1px solid rgba(0, 0, 0, 0.06)'
                    }}>
                      {m.value}
                    </span>
                    {changeText && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 3,
                        padding: '4px 10px',
                        borderRadius: 14,
                        minWidth: '100px',
                        background: status === 'good'
                          ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)'
                          : status === 'bad'
                          ? 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)'
                          : 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)',
                        boxShadow: status === 'good'
                          ? '0 2px 10px rgba(82, 196, 26, 0.35)'
                          : status === 'bad'
                          ? '0 2px 10px rgba(255, 77, 79, 0.35)'
                          : '0 2px 10px rgba(250, 173, 20, 0.35)',
                        border: '1px solid rgba(255, 255, 255, 0.3)'
                      }}>
                        <span style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#fff',
                          fontFamily: 'monospace',
                          textShadow: '0 1px 3px rgba(0,0,0,0.2)'
                        }}>
                          {changeText}
                        </span>
                        {Math.abs(changePercent) > 1 && (
                          <span style={{
                            fontSize: 10,
                            color: '#fff',
                            opacity: 0.95,
                            fontFamily: 'monospace',
                            fontWeight: 600,
                            textShadow: '0 1px 2px rgba(0,0,0,0.15)'
                          }}>
                            ({changePercent > 0 ? '+' : ''}{changePercent.toFixed(0)}%)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      {/* 运力平台履约详情弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileDoneOutlined style={{ color: '#52c41a' }} />
            <span>运力平台履约详情</span>
            <Tag color="green" style={{ fontSize: 11 }}>6月</Tag>
          </div>
        }
        open={fulfillmentModalVisible}
        onCancel={() => { setFulfillmentModalVisible(false); setFulfillmentHighlight(''); }}
        footer={null}
        width={640}
      >
        <div style={{ marginTop: 16 }}>
          {current.fulfillmentDetails?.platforms.map((p, idx) => {
            const completionDiff = parseFloat(p.completionRate) - parseFloat(p.prevCompletionRate);
            const cancelDiff = parseFloat(p.cancelRate) - parseFloat(p.prevCancelRate);
            const reliabilityConfig = {
              high: { color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f', label: '优秀' },
              medium: { color: '#faad14', bg: '#fffbe6', border: '#ffe58f', label: '一般' },
              low: { color: '#ff4d4f', bg: '#fff1f0', border: '#ffccc7', label: '较差' },
            }[p.reliability];

            return (
              <div key={idx} style={{
                padding: '16px', borderRadius: 12, marginBottom: 12,
                background: p.reliability === 'low' ? 'linear-gradient(135deg, #fff1f0 0%, #ffe7e6 100%)' : '#fafafa',
                border: p.reliability === 'low' ? '2px solid #ffccc7' : '1px solid #f0f0f0',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{p.name}</span>
                    <Tag color={reliabilityConfig.color} style={{ margin: 0, borderRadius: 6, fontSize: 11 }}>
                      {reliabilityConfig.label}
                    </Tag>
                  </div>
                  <span style={{ fontSize: 12, color: '#999' }}>平均 {p.avgTime}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: '完成率', value: p.completionRate, prev: p.prevCompletionRate, diff: completionDiff, good: completionDiff >= 0 },
                    { label: '取消率', value: p.cancelRate, prev: p.prevCancelRate, diff: cancelDiff, good: cancelDiff <= 0 },
                    { label: '拒单率', value: p.rejectRate, prev: p.prevRejectRate, diff: parseFloat(p.rejectRate) - parseFloat(p.prevRejectRate), good: parseFloat(p.rejectRate) - parseFloat(p.prevRejectRate) <= 0 },
                  ].map(metric => {
                    const isHighlighted = fulfillmentHighlight === metric.label
                      || (fulfillmentHighlight === '订单完成率' && metric.label === '完成率');
                    const valueColor = metric.label === '完成率'
                      ? (parseFloat(metric.value) >= 98 ? '#52c41a' : parseFloat(metric.value) >= 95 ? '#faad14' : '#ff4d4f')
                      : (parseFloat(metric.value) <= 1 ? '#52c41a' : parseFloat(metric.value) <= 3 ? '#faad14' : '#ff4d4f');
                    const changeText = `${metric.diff >= 0 ? '+' : ''}${metric.diff.toFixed(1)}%`;
                    const badgeBg = metric.good
                      ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)'
                      : 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)';
                    const badgeShadow = metric.good
                      ? '0 2px 8px rgba(82, 196, 26, 0.3)'
                      : '0 2px 8px rgba(255, 77, 79, 0.3)';

                    return (
                      <div key={metric.label} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', background: isHighlighted ? '#e6f7ff' : '#fff', borderRadius: 10,
                        border: isHighlighted ? '2px solid #1890ff' : !metric.good ? '1px solid #ffccc7' : '1px solid #f0f0f0',
                        boxShadow: isHighlighted ? '0 2px 8px rgba(24, 144, 255, 0.15)' : 'none',
                        transition: 'all 0.2s',
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', minWidth: 50 }}>
                          {metric.label}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {/* 上月值 */}
                          <span style={{
                            fontSize: 14, color: '#8c8c8c', fontFamily: 'monospace', fontWeight: 600,
                            padding: '3px 0', background: '#f5f5f5', borderRadius: 6,
                            border: '1px solid #e8e8e8', width: 72, textAlign: 'center',
                            display: 'inline-block', boxSizing: 'border-box',
                          }}>
                            {metric.prev}
                          </span>
                          {/* 箭头 */}
                          <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
                            <path d="M3 8 L13 8 M10 5 L13 8 L10 11" stroke="#bfbfbf" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          {/* 本月值 */}
                          <span style={{
                            fontSize: 15, fontWeight: 700, fontFamily: 'monospace', color: valueColor,
                            padding: '3px 0', borderRadius: 6, width: 72, textAlign: 'center',
                            display: 'inline-block', boxSizing: 'border-box',
                            background: !metric.good ? 'rgba(255, 77, 79, 0.06)' : 'rgba(82, 196, 26, 0.06)',
                            border: !metric.good ? '1px solid rgba(255, 77, 79, 0.15)' : '1px solid rgba(82, 196, 26, 0.15)',
                          }}>
                            {metric.value}
                          </span>
                          {/* 变化徽章 */}
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            padding: '3px 0', borderRadius: 12, width: 64,
                            background: badgeBg, boxShadow: badgeShadow,
                            border: '1px solid rgba(255,255,255,0.3)', boxSizing: 'border-box',
                          }}>
                            <span style={{
                              fontSize: 12, fontWeight: 700, color: '#fff',
                              fontFamily: 'monospace', textShadow: '0 1px 2px rgba(0,0,0,0.15)',
                            }}>
                              {changeText}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* 平台切换建议 */}
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#262626', marginBottom: 10 }}>
              📋 优化建议
            </div>
            {current.fulfillmentDetails?.suggestions.map((s, idx) => (
              <div key={idx} style={{
                padding: '12px 14px', borderRadius: 10, marginBottom: 8,
                background: '#e6f7ff', border: '1px solid #91d5ff',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 12, color: '#0050b3', flex: 1 }}>{s.text}</span>
                <Button type="link" size="small"
                  onClick={() => {
                    setFulfillmentModalVisible(false);
                    navigate('/mine/delivery-settings', { state: { section: s.navSection } });
                  }}
                  style={{ padding: 0, fontSize: 12, whiteSpace: 'nowrap' }}>
                  {s.action} <RightOutlined />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* 顾客评价运力平台详情弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StarOutlined style={{ color: '#faad14' }} />
            <span>运力平台顾客评价详情</span>
            <Tag color="orange" style={{ fontSize: 11 }}>6月</Tag>
          </div>
        }
        open={reviewModalVisible}
        onCancel={() => { setReviewModalVisible(false); setReviewHighlight(''); }}
        footer={null}
        width={640}
      >
        <div style={{ marginTop: 16 }}>
          {current.reviewDetails?.platforms.map((p, idx) => {
            const positiveRateDiff = parseFloat(p.positiveRate) - parseFloat(p.prevPositiveRate);
            const negativeRateDiff = parseFloat(p.negativeRate) - parseFloat(p.prevNegativeRate);
            const reliabilityConfig = {
              high: { color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f', label: '优秀' },
              medium: { color: '#faad14', bg: '#fffbe6', border: '#ffe58f', label: '一般' },
              low: { color: '#ff4d4f', bg: '#fff1f0', border: '#ffccc7', label: '较差' },
            }[p.reliability];

            return (
              <div key={idx} style={{
                padding: '16px', borderRadius: 12, marginBottom: 12,
                background: p.reliability === 'low' ? 'linear-gradient(135deg, #fff1f0 0%, #ffe7e6 100%)' : '#fafafa',
                border: p.reliability === 'low' ? '2px solid #ffccc7' : '1px solid #f0f0f0',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{p.name}</span>
                    <Tag color={reliabilityConfig.color} style={{ margin: 0, borderRadius: 6, fontSize: 11 }}>
                      {reliabilityConfig.label}
                    </Tag>
                  </div>
                  <span style={{ fontSize: 12, color: '#999' }}>平均评分 {p.avgScore}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: '好评率', value: p.positiveRate, prev: p.prevPositiveRate, diff: positiveRateDiff, good: positiveRateDiff >= 0 },
                    { label: '差评率', value: p.negativeRate, prev: p.prevNegativeRate, diff: negativeRateDiff, good: negativeRateDiff <= 0 },
                    { label: '平均评分', value: p.avgScore, prev: p.prevAvgScore, diff: parseFloat(p.avgScore) - parseFloat(p.prevAvgScore), good: parseFloat(p.avgScore) - parseFloat(p.prevAvgScore) >= 0 },
                  ].map(metric => {
                    const isHighlighted = reviewHighlight === metric.label;
                    const valueColor = metric.label === '好评率'
                      ? (parseFloat(metric.value) >= 95 ? '#52c41a' : parseFloat(metric.value) >= 90 ? '#faad14' : '#ff4d4f')
                      : metric.label === '差评率'
                      ? (parseFloat(metric.value) <= 2 ? '#52c41a' : parseFloat(metric.value) <= 5 ? '#faad14' : '#ff4d4f')
                      : (parseFloat(metric.value) >= 4.7 ? '#52c41a' : parseFloat(metric.value) >= 4.5 ? '#faad14' : '#ff4d4f');
                    const changeText = `${metric.diff >= 0 ? '+' : ''}${metric.diff.toFixed(1)}${metric.label.includes('率') ? '%' : ''}`;
                    const badgeBg = metric.good
                      ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)'
                      : 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)';
                    const badgeShadow = metric.good
                      ? '0 2px 8px rgba(82, 196, 26, 0.3)'
                      : '0 2px 8px rgba(255, 77, 79, 0.3)';

                    return (
                      <div key={metric.label} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', background: isHighlighted ? '#e6f7ff' : '#fff', borderRadius: 10,
                        border: isHighlighted ? '2px solid #1890ff' : !metric.good ? '1px solid #ffccc7' : '1px solid #f0f0f0',
                        boxShadow: isHighlighted ? '0 2px 8px rgba(24, 144, 255, 0.15)' : 'none',
                        transition: 'all 0.2s',
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', minWidth: 60 }}>
                          {metric.label}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontSize: 14, color: '#8c8c8c', fontFamily: 'monospace', fontWeight: 600,
                            padding: '3px 0', background: '#f5f5f5', borderRadius: 6,
                            border: '1px solid #e8e8e8', width: 72, textAlign: 'center',
                            display: 'inline-block', boxSizing: 'border-box',
                          }}>
                            {metric.prev}
                          </span>
                          <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
                            <path d="M3 8 L13 8 M10 5 L13 8 L10 11" stroke="#bfbfbf" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span style={{
                            fontSize: 15, fontWeight: 700, fontFamily: 'monospace', color: valueColor,
                            padding: '3px 0', borderRadius: 6, width: 72, textAlign: 'center',
                            display: 'inline-block', boxSizing: 'border-box',
                            background: !metric.good ? 'rgba(255, 77, 79, 0.06)' : 'rgba(82, 196, 26, 0.06)',
                            border: !metric.good ? '1px solid rgba(255, 77, 79, 0.15)' : '1px solid rgba(82, 196, 26, 0.15)',
                          }}>
                            {metric.value}
                          </span>
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            padding: '3px 0', borderRadius: 12, width: 64,
                            background: badgeBg, boxShadow: badgeShadow,
                            border: '1px solid rgba(255,255,255,0.3)', boxSizing: 'border-box',
                          }}>
                            <span style={{
                              fontSize: 12, fontWeight: 700, color: '#fff',
                              fontFamily: 'monospace', textShadow: '0 1px 2px rgba(0,0,0,0.15)',
                            }}>
                              {changeText}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#262626', marginBottom: 10 }}>
              📋 优化建议
            </div>
            {current.reviewDetails?.suggestions.map((s, idx) => (
              <div key={idx} style={{
                padding: '12px 14px', borderRadius: 10, marginBottom: 8,
                background: '#e6f7ff', border: '1px solid #91d5ff',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 12, color: '#0050b3', flex: 1 }}>{s.text}</span>
                <Button type="link" size="small"
                  onClick={() => {
                    setReviewModalVisible(false);
                    navigate('/mine/delivery-settings', { state: { section: s.navSection } });
                  }}
                  style={{ padding: 0, fontSize: 12, whiteSpace: 'nowrap' }}>
                  {s.action} <RightOutlined />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* 配送时效运力平台详情弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FieldTimeOutlined style={{ color: '#1890ff' }} />
            <span>运力平台配送时效详情</span>
            <Tag color="blue" style={{ fontSize: 11 }}>6月</Tag>
          </div>
        }
        open={deliveryTimeModalVisible}
        onCancel={() => { setDeliveryTimeModalVisible(false); setDeliveryTimeHighlight(''); }}
        footer={null}
        width={640}
      >
        <div style={{ marginTop: 16 }}>
          {current.deliveryTimeDetails?.platforms.map((p, idx) => {
            const onTimeRateDiff = parseFloat(p.onTimeRate) - parseFloat(p.prevOnTimeRate);
            const timeoutRateDiff = parseFloat(p.timeoutRate) - parseFloat(p.prevTimeoutRate);
            const reliabilityConfig = {
              high: { color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f', label: '优秀' },
              medium: { color: '#faad14', bg: '#fffbe6', border: '#ffe58f', label: '一般' },
              low: { color: '#ff4d4f', bg: '#fff1f0', border: '#ffccc7', label: '较差' },
            }[p.reliability];

            return (
              <div key={idx} style={{
                padding: '16px', borderRadius: 12, marginBottom: 12,
                background: p.reliability === 'low' ? 'linear-gradient(135deg, #fff1f0 0%, #ffe7e6 100%)' : '#fafafa',
                border: p.reliability === 'low' ? '2px solid #ffccc7' : '1px solid #f0f0f0',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{p.name}</span>
                    <Tag color={reliabilityConfig.color} style={{ margin: 0, borderRadius: 6, fontSize: 11 }}>
                      {reliabilityConfig.label}
                    </Tag>
                  </div>
                  <span style={{ fontSize: 12, color: '#999' }}>平均 {p.avgTime}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: '准时达率', value: p.onTimeRate, prev: p.prevOnTimeRate, diff: onTimeRateDiff, good: onTimeRateDiff >= 0 },
                    { label: '平均配送时长', value: p.avgTime, prev: p.prevAvgTime, diff: parseInt(p.avgTime) - parseInt(p.prevAvgTime), good: parseInt(p.avgTime) - parseInt(p.prevAvgTime) <= 0 },
                    { label: '超时率', value: p.timeoutRate, prev: p.prevTimeoutRate, diff: timeoutRateDiff, good: timeoutRateDiff <= 0 },
                  ].map(metric => {
                    const isHighlighted = deliveryTimeHighlight === metric.label || (deliveryTimeHighlight === '整体超时率' && metric.label === '超时率');
                    const valueColor = metric.label === '准时达率'
                      ? (parseFloat(metric.value) >= 95 ? '#52c41a' : parseFloat(metric.value) >= 90 ? '#faad14' : '#ff4d4f')
                      : metric.label === '超时率'
                      ? (parseFloat(metric.value) <= 5 ? '#52c41a' : parseFloat(metric.value) <= 10 ? '#faad14' : '#ff4d4f')
                      : (parseInt(metric.value) <= 25 ? '#52c41a' : parseInt(metric.value) <= 30 ? '#faad14' : '#ff4d4f');
                    const changeText = metric.label === '平均配送时长'
                      ? `${metric.diff >= 0 ? '+' : ''}${metric.diff}分钟`
                      : `${metric.diff >= 0 ? '+' : ''}${metric.diff.toFixed(1)}%`;
                    const badgeBg = metric.good
                      ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)'
                      : 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)';
                    const badgeShadow = metric.good
                      ? '0 2px 8px rgba(82, 196, 26, 0.3)'
                      : '0 2px 8px rgba(255, 77, 79, 0.3)';

                    return (
                      <div key={metric.label} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', background: isHighlighted ? '#e6f7ff' : '#fff', borderRadius: 10,
                        border: isHighlighted ? '2px solid #1890ff' : !metric.good ? '1px solid #ffccc7' : '1px solid #f0f0f0',
                        boxShadow: isHighlighted ? '0 2px 8px rgba(24, 144, 255, 0.15)' : 'none',
                        transition: 'all 0.2s',
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', minWidth: 80 }}>
                          {metric.label}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontSize: 14, color: '#8c8c8c', fontFamily: 'monospace', fontWeight: 600,
                            padding: '3px 0', background: '#f5f5f5', borderRadius: 6,
                            border: '1px solid #e8e8e8', width: 72, textAlign: 'center',
                            display: 'inline-block', boxSizing: 'border-box',
                          }}>
                            {metric.prev}
                          </span>
                          <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
                            <path d="M3 8 L13 8 M10 5 L13 8 L10 11" stroke="#bfbfbf" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span style={{
                            fontSize: 15, fontWeight: 700, fontFamily: 'monospace', color: valueColor,
                            padding: '3px 0', borderRadius: 6, width: 72, textAlign: 'center',
                            display: 'inline-block', boxSizing: 'border-box',
                            background: !metric.good ? 'rgba(255, 77, 79, 0.06)' : 'rgba(82, 196, 26, 0.06)',
                            border: !metric.good ? '1px solid rgba(255, 77, 79, 0.15)' : '1px solid rgba(82, 196, 26, 0.15)',
                          }}>
                            {metric.value}
                          </span>
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            padding: '3px 0', borderRadius: 12, width: 72,
                            background: badgeBg, boxShadow: badgeShadow,
                            border: '1px solid rgba(255,255,255,0.3)', boxSizing: 'border-box',
                          }}>
                            <span style={{
                              fontSize: 12, fontWeight: 700, color: '#fff',
                              fontFamily: 'monospace', textShadow: '0 1px 2px rgba(0,0,0,0.15)',
                            }}>
                              {changeText}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#262626', marginBottom: 10 }}>
              📋 优化建议
            </div>
            {current.deliveryTimeDetails?.suggestions.map((s, idx) => (
              <div key={idx} style={{
                padding: '12px 14px', borderRadius: 10, marginBottom: 8,
                background: '#e6f7ff', border: '1px solid #91d5ff',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 12, color: '#0050b3', flex: 1 }}>{s.text}</span>
                <Button type="link" size="small"
                  onClick={() => {
                    setDeliveryTimeModalVisible(false);
                    navigate('/mine/delivery-settings', { state: { section: s.navSection } });
                  }}
                  style={{ padding: 0, fontSize: 12, whiteSpace: 'nowrap' }}>
                  {s.action} <RightOutlined />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* 配送成本运力平台详情弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DollarOutlined style={{ color: '#722ed1' }} />
            <span>运力平台配送成本详情</span>
            <Tag color="purple" style={{ fontSize: 11 }}>6月</Tag>
          </div>
        }
        open={costModalVisible}
        onCancel={() => { setCostModalVisible(false); setCostHighlight(''); }}
        footer={null}
        width={640}
      >
        <div style={{ marginTop: 16 }}>
          {current.costDetails?.platforms.map((p, idx) => {
            const avgFeeDiff = parseFloat(p.avgFee.replace('¥', '')) - parseFloat(p.prevAvgFee.replace('¥', ''));
            const feeRatioDiff = parseFloat(p.feeRatio) - parseFloat(p.prevFeeRatio);
            const reliabilityConfig = {
              high: { color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f', label: '优秀' },
              medium: { color: '#faad14', bg: '#fffbe6', border: '#ffe58f', label: '一般' },
              low: { color: '#ff4d4f', bg: '#fff1f0', border: '#ffccc7', label: '较差' },
            }[p.reliability];

            return (
              <div key={idx} style={{
                padding: '16px', borderRadius: 12, marginBottom: 12,
                background: p.reliability === 'low' ? 'linear-gradient(135deg, #fff1f0 0%, #ffe7e6 100%)' : '#fafafa',
                border: p.reliability === 'low' ? '2px solid #ffccc7' : '1px solid #f0f0f0',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{p.name}</span>
                    <Tag color={reliabilityConfig.color} style={{ margin: 0, borderRadius: 6, fontSize: 11 }}>
                      {reliabilityConfig.label}
                    </Tag>
                  </div>
                  <span style={{ fontSize: 12, color: '#999' }}>单均 {p.avgFee}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: '单均配送费', value: p.avgFee, prev: p.prevAvgFee, diff: avgFeeDiff, good: avgFeeDiff <= 0 },
                    { label: '配送费占比', value: p.feeRatio, prev: p.prevFeeRatio, diff: feeRatioDiff, good: feeRatioDiff <= 0 },
                    { label: '小费支出占比', value: p.tipRatio, prev: p.prevTipRatio, diff: parseFloat(p.tipRatio) - parseFloat(p.prevTipRatio), good: parseFloat(p.tipRatio) - parseFloat(p.prevTipRatio) <= 0 },
                  ].map(metric => {
                    const isHighlighted = costHighlight === metric.label;
                    const valueColor = metric.label === '单均配送费'
                      ? (parseFloat(metric.value.replace('¥', '')) <= 5 ? '#52c41a' : parseFloat(metric.value.replace('¥', '')) <= 6 ? '#faad14' : '#ff4d4f')
                      : (parseFloat(metric.value) <= 18 ? '#52c41a' : parseFloat(metric.value) <= 20 ? '#faad14' : '#ff4d4f');
                    const changeText = metric.label === '单均配送费'
                      ? `${metric.diff >= 0 ? '+' : ''}¥${Math.abs(metric.diff).toFixed(1)}`
                      : `${metric.diff >= 0 ? '+' : ''}${metric.diff.toFixed(1)}%`;
                    const badgeBg = metric.good
                      ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)'
                      : 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)';
                    const badgeShadow = metric.good
                      ? '0 2px 8px rgba(82, 196, 26, 0.3)'
                      : '0 2px 8px rgba(255, 77, 79, 0.3)';

                    return (
                      <div key={metric.label} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', background: isHighlighted ? '#e6f7ff' : '#fff', borderRadius: 10,
                        border: isHighlighted ? '2px solid #1890ff' : !metric.good ? '1px solid #ffccc7' : '1px solid #f0f0f0',
                        boxShadow: isHighlighted ? '0 2px 8px rgba(24, 144, 255, 0.15)' : 'none',
                        transition: 'all 0.2s',
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', minWidth: 80 }}>
                          {metric.label}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontSize: 14, color: '#8c8c8c', fontFamily: 'monospace', fontWeight: 600,
                            padding: '3px 0', background: '#f5f5f5', borderRadius: 6,
                            border: '1px solid #e8e8e8', width: 72, textAlign: 'center',
                            display: 'inline-block', boxSizing: 'border-box',
                          }}>
                            {metric.prev}
                          </span>
                          <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
                            <path d="M3 8 L13 8 M10 5 L13 8 L10 11" stroke="#bfbfbf" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span style={{
                            fontSize: 15, fontWeight: 700, fontFamily: 'monospace', color: valueColor,
                            padding: '3px 0', borderRadius: 6, width: 72, textAlign: 'center',
                            display: 'inline-block', boxSizing: 'border-box',
                            background: !metric.good ? 'rgba(255, 77, 79, 0.06)' : 'rgba(82, 196, 26, 0.06)',
                            border: !metric.good ? '1px solid rgba(255, 77, 79, 0.15)' : '1px solid rgba(82, 196, 26, 0.15)',
                          }}>
                            {metric.value}
                          </span>
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            padding: '3px 0', borderRadius: 12, width: 72,
                            background: badgeBg, boxShadow: badgeShadow,
                            border: '1px solid rgba(255,255,255,0.3)', boxSizing: 'border-box',
                          }}>
                            <span style={{
                              fontSize: 12, fontWeight: 700, color: '#fff',
                              fontFamily: 'monospace', textShadow: '0 1px 2px rgba(0,0,0,0.15)',
                            }}>
                              {changeText}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#262626', marginBottom: 10 }}>
              📋 优化建议
            </div>
            {current.costDetails?.suggestions.map((s, idx) => (
              <div key={idx} style={{
                padding: '12px 14px', borderRadius: 10, marginBottom: 8,
                background: '#e6f7ff', border: '1px solid #91d5ff',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 12, color: '#0050b3', flex: 1 }}>{s.text}</span>
                <Button type="link" size="small"
                  onClick={() => {
                    setCostModalVisible(false);
                    navigate('/mine/delivery-settings', { state: { section: s.navSection } });
                  }}
                  style={{ padding: 0, fontSize: 12, whiteSpace: 'nowrap' }}>
                  {s.action} <RightOutlined />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
