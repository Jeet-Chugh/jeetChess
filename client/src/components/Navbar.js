import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";
import { FaUserCircle } from "react-icons/fa";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [isPlayDropdownOpen, setIsPlayDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const togglePlayDropdown = () => {
    setIsUserDropdownOpen(false);
    setIsPlayDropdownOpen(!isPlayDropdownOpen);
  };

  const toggleUserDropdown = () => {
    setIsPlayDropdownOpen(false);
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  return (
    <nav className="bg-gray-900 border-gray-700">
      <div className="max-w-screen-xl flex items-center justify-between mx-auto p-4 h-16">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <Link to="/" className="flex items-center space-x-3 rtl:space-x-reverse">
            <img src="/logo.png" className="h-8" alt="Logo" />
            <span className="self-center text-2xl font-semibold whitespace-nowrap text-white">
              JeetChess
            </span>
          </Link>
          <ul className="flex space-x-8 rtl:space-x-reverse">
            <li>
              <Link
                to="/"
                className="block text-xl ml-3 py-2 px-3 text-white rounded md:text-green-500 md:p-0 hover:text-green-600"
                aria-current="page"
              >
                Home
              </Link>
            </li>
            <li className="relative">
              <button
                onClick={togglePlayDropdown}
                className="flex items-center justify-between w-full py-2 px-3 text-xl rounded md:text-green-500 md:p-0 hover:text-green-600"
              >
                Play
                <svg
                  className="w-2.5 h-2.5 ms-2.5"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 10 6"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m1 1 4 4 4-4"
                  />
                </svg>
              </button>
              {isPlayDropdownOpen && (
                <div className="absolute z-10 font-normal bg-gray-900 divide-y divide-gray-100 rounded-lg shadow w-44">
                  <ul className="py-2 text-sm text-white">
                    <li>
                      <Link
                        to="/dashboard"
                        className="block px-4 hover:bg-green-600"
                      >
                        Create Game
                      </Link>                    
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="block px-4 hover:bg-green-600"
                      >
                        Join Game
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="block px-4 hover:bg-green-600"
                      >
                        My Games
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </li>
          </ul>
        </div>
        <div className="flex items-center h-full" id="navbar-multi-level">
          {user ? (
            <div className="relative">
              <button
                onClick={toggleUserDropdown}
                className="flex items-center"
              >
                <FaUserCircle className="w-8 h-8" />
                <span className="ml-2">{user.username}</span>
                <svg
                  className="w-2.5 h-2.5 ms-2.5"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 10 6"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m1 1 4 4 4-4"
                  />
                </svg>
              </button>
              {isUserDropdownOpen && (
                <div className="absolute right-0 z-10 font-normal bg-gray-900 divide-y divide-gray-100 rounded-lg shadow w-44">
                  <ul className="py-2 text-sm text-white">
                    <li>
                      <Link
                        to="/profile"
                        className="block px-4 hover:bg-green-600"
                      >
                        Profile
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/settings"
                        className="block px-4 hover:bg-green-600"
                      >
                        Settings
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/help"
                        className="block px-4 hover:bg-green-600"
                      >
                        Help
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/"
                        className="block px-4 hover:bg-red-600"
                        onClick={logout}
                      >
                        Sign out
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center py-2 space-x-2">
              <Link
                to="/login"
                className="py-2.5 px-4 text-sm bg-green-500 text-white rounded hover:bg-green-600 h-10"
              >
                Login
              </Link>
              <span>or</span>
              <Link
                to="/register"
                className="py-2.5 px-4 text-sm bg-green-500 text-white rounded hover:bg-green-600 h-10"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
