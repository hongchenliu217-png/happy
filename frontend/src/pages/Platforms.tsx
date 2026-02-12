import { useEffect, useState } from 'react';
import { Table, Tag, Card } from 'antd';
import client from '../api/client';

export default function Platforms() {
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPlatforms();
  }, []);

  const loadPlatforms = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/platforms');
      setPlatforms(data);
    } catch (error) {
      console.error('加载平台失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '平台名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'upstream' ? 'blue' : 'green'}>
          {type === 'upstream' ? '上游' : '下游'}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
      )
    }
  ];

  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ marginBottom: 16, fontSize: 18 }}>平台管理</h2>
      <Card>
        <Table
          columns={columns}
          dataSource={platforms}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
}
