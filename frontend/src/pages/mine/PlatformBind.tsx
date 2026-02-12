import { Card, List, Switch, Button } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

export default function PlatformBind() {
  const navigate = useNavigate();

  const platforms = [
    { id: 1, name: '美团外卖', logo: '🟡', bound: false },
    { id: 2, name: '饿了么', logo: '🔵', bound: false },
    { id: 3, name: '抖音外卖', logo: '⚫', bound: false }
  ];

  return (
    <div style={{ padding: '16px', background: '#f5f5f5', minHeight: '100vh' }}>
      <h2 style={{ marginBottom: 16, fontSize: 18 }}>商流平台绑定</h2>
      <Card>
        <List
          dataSource={platforms}
          renderItem={item => (
            <List.Item
              style={{ padding: '16px 0' }}
              extra={
                item.bound ? (
                  <Button size="small" danger>解绑</Button>
                ) : (
                  <Button size="small" type="primary">绑定</Button>
                )
              }
            >
              <List.Item.Meta
                avatar={<span style={{ fontSize: 32 }}>{item.logo}</span>}
                title={<span style={{ fontSize: 15 }}>{item.name}</span>}
                description={item.bound ? '已绑定' : '未绑定'}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
