import React, { useState, useContext, useRef } from "react";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { AuthContext } from "../auth/AuthContext";
import { FaUserCircle } from "react-icons/fa";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  return (
    <nav className="bg-gray-900 border-gray-700">
      <div className="max-w-screen-xl flex items-center justify-between mx-auto p-4 h-16">
        <div className="flex items-baseline space-x-3 rtl:space-x-reverse">
          <ul className="flex space-x-16 rtl:space-x-reverse">
            <li>
              <Link to="/" className="flex items-center space-x-3 rtl:space-x-reverse">
                <img src="/logo.png" className="h-8" alt="Logo" />
                <span className="self-center text-2xl font-semibold text-white">
                  JeetChess
                </span>
              </Link>
            </li>
            <li>
              <Link to="/" className="flex items-center space-x-3 rtl:space-x-reverse">
                <span className="self-center text-2xl font-semibold text-white">
                  Play
                </span>
              </Link>
            </li>
            <li>
            { user ? (
            <li>
              <Link
                to="/my-games"
                className="self-center text-2xl font-semibold text-white"
                aria-current="page"
              >
                My Games
              </Link>
            </li> 
          ) : (<></>) }
            </li>
          </ul>
        </div>
        <div className="flex items-center justify-center h-100" id="navbar-multi-level">
          {user ? (
            <div className="relative" ref={dropdownRef}>
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
                        to="/settings"
                        className="block px-4 hover:bg-green-600"
                      >
                        Settings
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
            <div className="flex justify-center space-x-2 text-lg px-4">
              <Link
                to="/login"
                className="py-2.5 px-4 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Login
              </Link>
              <span className="py-2.5 text-lg">or</span>
              <Link
                to="/register"
                className="py-2.5 px-4 text-lg bg-green-500 text-white rounded hover:bg-green-600"
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
