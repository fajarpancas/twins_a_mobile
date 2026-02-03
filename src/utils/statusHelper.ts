export const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return '#f39c12';
    case 'packing':
      return '#3498db';
    case 'sent':
      return '#2ecc71';
    case 'hnr':
      return '#e74c3c';
    default:
      return '#95a5a6';
  }
};
