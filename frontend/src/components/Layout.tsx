import { Link, Outlet, useLocation } from 'react-router-dom';
import { Home, Upload, List, PieChart, DollarSign, PiggyBank } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Budget App</h1>
            <nav className="flex space-x-4">
              <NavLink to="/" icon={<Home size={20} />} active={isActive('/')}>
                Översikt
              </NavLink>
              <NavLink to="/import" icon={<Upload size={20} />} active={isActive('/import')}>
                Importera
              </NavLink>
              <NavLink to="/transactions" icon={<List size={20} />} active={isActive('/transactions')}>
                Transaktioner
              </NavLink>
              <NavLink to="/categories" icon={<PieChart size={20} />} active={isActive('/categories')}>
                Kategorier
              </NavLink>
              <NavLink to="/loans" icon={<DollarSign size={20} />} active={isActive('/loans')}>
                Lån
              </NavLink>
              <NavLink to="/savings" icon={<PiggyBank size={20} />} active={isActive('/savings')}>
                Sparande
              </NavLink>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  active: boolean;
  children: React.ReactNode;
}

function NavLink({ to, icon, active, children }: NavLinkProps) {
  return (
    <Link
      to={to}
      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}
