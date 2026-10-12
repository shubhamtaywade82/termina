import {Box, Text} from '@nemesis-oss/termina-core';
import {JSONViewer} from '@nemesis-oss/termina-ui';

const order = {
  id: 'ord_1042',
  status: 'shipped',
  total: 129.95,
  paid: true,
  coupon: null,
  items: [
    {sku: 'KB-75', name: 'Mechanical keyboard', quantity: 1, price: 89.95},
    {sku: 'CABLE-USB-C', name: 'USB-C cable', quantity: 2, price: 20},
  ],
  shipping: {carrier: 'UPS', tracking: '1Z999AA10123456784', delivered: false},
};

export default function JSONViewerBasic() {
  return (
    <Box flexDirection="column" gap={1}>
      <Text>GET /v1/orders/ord_1042 - 200 OK</Text>
      <JSONViewer data={order} />
    </Box>
  );
}
