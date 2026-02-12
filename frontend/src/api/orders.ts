import client from './client';

export interface Order {
  id: string;
  orderNo: string;
  source: string;
  status: string;
  deliveryType: string;
  totalAmount: number;
  deliveryFee: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  createdAt: string;
  mealReadyTime?: string;
}

export const ordersApi = {
  getOrders: (params?: any) => client.get('/orders', { params }),
  getOrderById: (id: string) => client.get(`/orders/${id}`),
  createOrder: (data: any) => client.post('/orders', data),
  updateOrderStatus: (id: string, status: string) =>
    client.put(`/orders/${id}/status`, { status }),
  setMealReady: (id: string) => client.put(`/orders/${id}/meal-ready`),
  dispatchOrder: (id: string, platform: string) =>
    client.post(`/orders/${id}/dispatch`, { platform }),
  setSelfDelivery: (id: string) => client.post(`/orders/${id}/self-delivery`),
  cancelOrder: (id: string) => client.delete(`/orders/${id}`)
};
