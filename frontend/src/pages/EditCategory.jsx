import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import AdminCategoryForm from '../components/admin/AdminCategoryForm';

const EditCategory = () => {
  const { id } = useParams();
  if (!id) return <Navigate to="/admin?tab=categories" replace />;
  return (
    <main className="admin-page admin-product-page">
      <AdminCategoryForm mode="edit" categoryId={id} />
    </main>
  );
};

export default EditCategory;
