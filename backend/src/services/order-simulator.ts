import { db } from '../database/memory-db';
import { v4 as uuidv4 } from 'uuid';

const sources = ['meituan', 'taobao', 'douyin'];
const customerNames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '陈先生', '刘女士'];
const addresses = [
  '深圳市南山区科技园南区深南大道9988号',
  '深圳市南山区粤海街道科苑路15号',
  '深圳市南山区后海大道与海德三道交汇处',
  '深圳市南山区桃园路南新路口',
  '深圳市南山区学府路与白石路交汇处',
  '深圳市南山区南海大道与南山大道交汇处',
  '深圳市南山区前海路振海大厦',
  '深圳市南山区蛇口工业区太子路168号',
];

const dishes = [
  { name: '宫保鸡丁', price: 28 },
  { name: '鱼香肉丝', price: 26 },
  { name: '麻婆豆腐', price: 22 },
  { name: '回锅肉', price: 32 },
  { name: '水煮鱼', price: 48 },
  { name: '酸菜鱼', price: 45 },
  { name: '红烧肉', price: 35 },
  { name: '糖醋排骨', price: 38 },
  { name: '米饭', price: 2 },
  { name: '可乐', price: 5 },
];

function generateRandomOrder() {
  const source = sources[Math.floor(Math.random() * sources.length)];
  const customerName = customerNames[Math.floor(Math.random() * customerNames.length)];
  const address = addresses[Math.floor(Math.random() * addresses.length)];

  // 随机生成1-3个菜品
  const itemCount = Math.floor(Math.random() * 3) + 1;
  const items = [];
  let totalAmount = 0;

  for (let i = 0; i < itemCount; i++) {
    const dish = dishes[Math.floor(Math.random() * dishes.length)];
    const quantity = Math.floor(Math.random() * 2) + 1;
    items.push({
      name: dish.name,
      quantity,
      price: dish.price,
    });
    totalAmount += dish.price * quantity;
  }

  const deliveryFee = (Math.random() * 5 + 3).toFixed(2);

  const order = {
    id: uuidv4(),
    orderNo: `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`,
    merchantId: 'demo-user-001', // 默认分配给demo用户
    source,
    status: 'pending',
    customerName,
    customerPhone: `138${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    deliveryAddress: address,
    totalAmount: totalAmount.toFixed(2),
    deliveryFee,
    items,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return order;
}

export function startOrderSimulator() {
  console.log('📦 订单模拟器已启动');
  console.log('📋 规则：');
  console.log('   - 启动时立即生成 5 个初始订单');
  console.log('   - 每 45-90 秒随机生成新订单');
  console.log('   - 订单来源：美团、饿了么、抖音');

  // 立即生成5个初始订单
  for (let i = 0; i < 5; i++) {
    const order = generateRandomOrder();
    db.orders.push(order);
    console.log(`✅ [初始订单 ${i + 1}/5] ${order.orderNo} | ${order.source} | ¥${order.totalAmount}`);
  }

  // 随机间隔生成新订单（45-90秒）
  function scheduleNextOrder() {
    const interval = Math.floor(Math.random() * 45000) + 45000; // 45-90秒
    setTimeout(() => {
      const newOrder = generateRandomOrder();
      db.orders.push(newOrder);
      console.log(`🆕 [新订单] ${newOrder.orderNo} | ${newOrder.source} | ${newOrder.customerName} | ¥${newOrder.totalAmount}`);
      scheduleNextOrder(); // 递归调度下一个订单
    }, interval);
  }

  scheduleNextOrder();
}
