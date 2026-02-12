import { Card, Input, Select, Space, Tag, Badge, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { ordersApi, Order } from '../../api/orders';
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

export default function OrderSearch() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [timeFilter, setTimeFilter] = useState('today');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchText, timeFilter, statusFilter, sourceFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data } = await ordersApi.getOrders();
      setOrders(data.orders);
    } catch (error) {
      console.error('加载订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // 搜索过滤
    if (searchText) {
      filtered = filtered.filter(order =>
        order.orderNo?.toLowerCase().includes(searchText.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(searchText.toLowerCase()) ||
        order.customerPhone?.includes(searchText)
      );
    }

    // 时间过滤
    const now = dayjs();
    if (timeFilter === 'today') {
      filtered = filtered.filter(order => dayjs(order.createdAt).isSame(now, 'day'));
    } else if (timeFilter === 'yesterday') {
      filtered = filtered.filter(order => dayjs(order.createdAt).isSame(now.subtract(1, 'day'), 'day'));
    } else if (timeFilter === 'week') {
      filtered = filtered.filter(order => dayjs(order.createdAt).isAfter(now.subtract(7, 'day')));
    } else if (timeFilter === 'month') {
      filtered = filtered.filter(order => dayjs(order.createdAt).isSame(now, 'month'));
    } else if (timeFilter === 'lastMonth') {
      filtered = filtered.filter(order => dayjs(order.createdAt).isSame(now.subtract(1, 'month'), 'month'));
    }

    // 状态过滤
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // 来源过滤
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(order => order.source === sourceFilter);
    }

    setFilteredOrders(filtered);
  };

  const timeOptions = [
    { label: '今日', value: 'today' },
    { label: '昨日', value: 'yesterday' },
    { label: '本周', value: 'week' },
    { label: '本月', value: 'month' },
    { label: '上月', value: 'lastMonth' },
    { label: '全部', value: 'all' }
  ];

  const renderOrderCard = (order: Order) => (
    <Card
      key={order.id}
      style={{ marginBottom: 12, borderRadius: 8 }}
      bodyStyle={{ padding: 12 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <Space>
          <Tag color={sourceMap[order.source]?.color || 'default'} style={{ margin: 0, fontSize: 13, fontWeight: 'bold' }}>
            {sourceMap[order.source]?.text || order.source}
          </Tag>
          <span style={{ fontSize: 12, color: '#999' }}>{order.orderNo?.slice(-12)}</span>
        </Space>
        <Badge
          status={
            statusMap[order.status]?.color === 'success' ? 'success' :
            statusMap[order.status]?.color === 'processing' ? 'processing' :
            statusMap[order.status]?.color === 'warning' ? 'warning' :
            'default'
          }
          text={<span style={{
            fontSize: 12,
            fontWeight: 'bold',
            color: statusMap[order.status]?.color === 'success' ? '#5AB572' :
                   statusMap[order.status]?.color === 'processing' ? '#4A90E2' :
                   statusMap[order.status]?.color === 'warning' ? '#F5A623' : '#666'
          }}>
            {statusMap[order.status]?.text}
          </span>}
        />
      </div>

      <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
        {dayjs(order.createdAt).format('今天 HH:mm')} {statusMap[order.status]?.text}
      </div>

      <div style={{ fontSize: 13, color: '#333', marginBottom: 8 }}>
        <div style={{ marginBottom: 4 }}>
          <strong>{order.customerName}</strong> <span style={{ color: '#999', fontSize: 12 }}>{order.customerPhone}</span>
        </div>
        <div style={{ color: '#666', fontSize: 12 }}>
          📍 {order.deliveryAddress}
        </div>
      </div>

      {order.items && order.items.length > 0 && (
        <div style={{
          background: '#f5f5f5',
          padding: '8px',
          borderRadius: 4,
          marginBottom: 8,
          fontSize: 12,
          color: '#666'
        }}>
          {order.items.map((item: any, idx: number) => (
            <div key={idx}>
              {item.name} x{item.quantity}
            </div>
          ))}
        </div>
      )}

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
        borderTop: '1px solid #f0f0f0'
      }}>
        <div style={{ fontSize: 12, color: '#999' }}>
          共{order.items?.length || 0}件商品
        </div>
        <div style={{ fontSize: 16, fontWeight: 'bold', color: '#ff4d4f' }}>
          ¥{order.totalAmount}
        </div>
      </div>
    </Card>
  );

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ background: '#fff', padding: '12px 16px', position: 'sticky', top: 64, zIndex: 999 }}>
        <Input
          placeholder="搜索订单号/客户姓名/手机号"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ marginBottom: 12 }}
        />

        <div style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          marginBottom: 12,
          paddingBottom: 4
        }}>
          {timeOptions.map(option => (
            <Button
              key={option.value}
              type={timeFilter === option.value ? 'primary' : 'default'}
              size="small"
              onClick={() => setTimeFilter(option.value)}
              style={{
                minWidth: 60,
                fontSize: 13,
                whiteSpace: 'nowrap'
              }}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <Space style={{ width: '100%' }} size={8}>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ flex: 1 }}
            size="small"
          >
            <Select.Option value="all">全部状态</Select.Option>
            <Select.Option value="delivered">已完成</Select.Option>
            <Select.Option value="delivering">配送中</Select.Option>
            <Select.Option value="picked_up">已取餐</Select.Option>
            <Select.Option value="delivery_accepted">待取货</Select.Option>
            <Select.Option value="delivery_calling">待抢单</Select.Option>
            <Select.Option value="pending">新订单</Select.Option>
            <Select.Option value="cancelled">已取消</Select.Option>
          </Select>

          <Select
            value={sourceFilter}
            onChange={setSourceFilter}
            style={{ flex: 1 }}
            size="small"
          >
            <Select.Option value="all">全部来源</Select.Option>
            <Select.Option value="meituan">美团</Select.Option>
            <Select.Option value="taobao">饿了么</Select.Option>
            <Select.Option value="douyin">抖音</Select.Option>
          </Select>
        </Space>
      </div>

      <div style={{ padding: '12px' }}>
        {loading ? (
          <Card style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ color: '#999', fontSize: 14 }}>加载中...</p>
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ color: '#999', fontSize: 14 }}>暂无订单</p>
          </Card>
        ) : (
          <>
            <div style={{ marginBottom: 12, fontSize: 13, color: '#666' }}>
              共找到 {filteredOrders.length} 条订单
            </div>
            {filteredOrders.map(renderOrderCard)}
          </>
        )}
      </div>
    </div>
  );
}
