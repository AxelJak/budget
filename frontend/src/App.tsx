import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Import from './pages/Import';
import Transactions from './pages/Transactions';
import Categories from './pages/Categories';
import Loans from './pages/Loans';
import Savings from './pages/Savings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="import" element={<Import />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="categories" element={<Categories />} />
          <Route path="loans" element={<Loans />} />
          <Route path="savings" element={<Savings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
