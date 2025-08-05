import { NavLink } from 'react-router-dom';

function Sidebar() {
  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen p-4">
      <nav>
        <ul className="space-y-2">
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `block p-2 rounded ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
            >
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/vehicles"
              className={({ isActive }) => `block p-2 rounded ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
            >
              Vehicles
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/simulate"
              className={({ isActive }) => `block p-2 rounded ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
            >
              Simulate
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin"
              className={({ isActive }) => `block p-2 rounded ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
            >
              Admin Panel
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;