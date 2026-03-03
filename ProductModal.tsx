import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard.tsx';
import Orders from './pages/Orders.tsx';
import Products from './pages/Products.tsx';
import Categories from './pages/Categories.tsx';
import Wilayas from './pages/Wilayas.tsx';
import Settings from './pages/Settings.tsx';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="products" element={<Products />} />
          <Route path="categories" element={<Categories />} />
          <Route path="wilayas" element={<Wilayas />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<div className="p-8 text-center">الصفحة غير موجودة</div>} />
        </Route>
      </Routes>
    </Router>
  );
}
