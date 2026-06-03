import React from 'react';
import { Outlet } from 'react-router-dom';

export default function ReviewLayout() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0e1621]">
      <Outlet />
    </div>
  );
}
