import React from 'react';
import { useParams } from 'react-router-dom';
import AdminProductForm from '../components/admin/AdminProductForm';

const EditProduct = () => {
  const { id } = useParams();
  return (
    <main className="admin-page admin-product-page">
      <AdminProductForm mode="edit" productId={id} />
    </main>
  );
};

export default EditProduct;
