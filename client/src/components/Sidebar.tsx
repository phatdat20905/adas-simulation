import { NavLink } from 'react-router-dom';
import type { User } from '../types';

function Sidebar() {
  const user: User | null = JSON.parse(localStorage.getItem('user') || 'null');

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen p-4">
      <nav>
        <ul>
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `block p-2 rounded ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`
              }
            >
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/vehicles"
              className={({ isActive }) =>
                `block p-2 rounded ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`
              }
            >
              Vehicles
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/simulate"
              className={({ isActive }) =>
                `block p-2 rounded ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`
              }
            >
              Simulate
            </NavLink>
          </li>
          {user?.role === 'admin' && (
            <li>
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `block p-2 rounded ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`
                }
              >
                Admin Panel
              </NavLink>
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;