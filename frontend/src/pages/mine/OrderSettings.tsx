import { Card, List, Switch } from 'antd';
import { RightOutlined } from '@ant-design/icons';

export default function OrderSettings() {
  const settings = [
    { id: 1, title: '自动接单', description: '新订单自动接单', value: true },
    { id: 2, title: '订单提醒', description: '新订单语音提醒', value: true },
    { id: 3, title: '超时提醒', description: '订单超时提醒', value: false }
  ];

  return (
    <div style={{ padding: '16px', background: '#f5f5f5', minHeight: '100vh' }}>
      <h2 style={{ marginBottom: 16, fontSize: 18 }}>订单设置</h2>
      <Card>
        <List
          dataSource={settings}
          renderItem={item => (
            <List.Item
              style={{ padding: '16px 0' }}
              extra={<Switch defaultChecked={item.value} />}
            >
              <List.Item.Meta
                title={<span style={{ fontSize: 15 }}>{item.title}</span>}
                description={item.description}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
