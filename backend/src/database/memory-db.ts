import bcrypt from 'bcrypt';

// 简化版内存数据存储
export const db = {
  users: [] as any[],
  orders: [] as any[],
  platforms: [
    {
      id: '1',
      code: 'meituan',
      name: '美团外卖',
      type: 'upstream',
      status: 'active',
      apiUrl: 'https://api.meituan.com',
      priority: 10
    },
    {
      id: '2',
      code: 'taobao',
      name: '淘宝/饿了么',
      type: 'upstream',
      status: 'active',
      apiUrl: 'https://eco.taobao.com',
      priority: 9
    },
    {
      id: '3',
      code: 'douyin',
      name: '抖音外卖',
      type: 'upstream',
      status: 'active',
      apiUrl: 'https://open.douyin.com',
      priority: 8
    },
    {
      id: '4',
      code: 'dada',
      name: '达达配送',
      type: 'downstream',
      status: 'active',
      apiUrl: 'https://newopen.imdada.cn',
      priority: 10
    },
    {
      id: '5',
      code: 'sf',
      name: '顺丰同城',
      type: 'downstream',
      status: 'active',
      apiUrl: 'https://open.sf-express.com',
      priority: 9
    },
    {
      id: '6',
      code: 'shansong',
      name: '闪送',
      type: 'downstream',
      status: 'active',
      apiUrl: 'https://open.ishansong.com',
      priority: 8
    }
  ] as any[],
  statistics: [] as any[]
};

export const initDb = async () => {
  // 预置 demo 演示账号
  const hashedPassword = await bcrypt.hash('demo123', 10);
  db.users.push({
    id: 'demo-user-001',
    username: 'demo',
    email: 'demo@example.com',
    password: hashedPassword,
    phone: '13800138000',
    companyName: '演示商家',
    role: 'merchant',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  console.log('内存数据库已初始化，demo 账号已预置');
};
