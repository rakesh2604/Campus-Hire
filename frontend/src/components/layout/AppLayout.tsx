'use client'

import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Navbar } from './Navbar'

export const AppLayout: React.FC = () => {
  const location = useLocation()
  const isLoginPage = location.pathname === '/login'
  const isRegisterPage = location.pathname === '/register'

  return (
    <div className="min-h-screen bg-white page-enter">
      {!isLoginPage && !isRegisterPage && <Navbar />}
      <div className="animate-fade-in">
        <Outlet />
      </div>
    </div>
  )
}

