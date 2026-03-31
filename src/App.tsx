import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Review from "./pages/Review";
import Services from "./pages/Services";
import Sos from "./pages/Sos";
import Instructions from "./pages/Instructions";
import Success from "./pages/Success";

export default function App() {
  return (
    <Routes>
      <Route path="/app/:apartmentId" element={<Dashboard />} />
      <Route path="/app/:apartmentId/review" element={<Review />} />
      <Route path="/app/:apartmentId/services" element={<Services />} />
      <Route path="/app/:apartmentId/sos" element={<Sos />} />
      <Route path="/app/:apartmentId/instructions" element={<Instructions />} />
      <Route path="/app/:apartmentId/success" element={<Success />} />
      <Route path="*" element={<Navigate to="/app/loft-77" replace />} />
    </Routes>
  );
}
