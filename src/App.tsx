/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Categories from './pages/Categories';
import Wilayas from './pages/Wilayas';
import Settings from './pages/Settings';
import AboutUs from './pages/AboutUs';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/wilayas" element={<Wilayas />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

