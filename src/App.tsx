import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Wilayas from './pages/Wilayas';
import Categories from './pages/Categories';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/wilayas" element={<Wilayas />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/content" element={<Navigate to="/settings" replace />} />
          <Route path="*" element={<div className="p-8">Page not found</div>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
