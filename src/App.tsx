/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BusinessDNA from './pages/BusinessDNA';
import CreatePost from './pages/CreatePost';
import AssetEditor from './pages/AssetEditor';
import TrendTracker from './pages/TrendTracker';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import Admin from './pages/Admin';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Rota pública */}
        <Route path="/login" element={<Login />} />

        {/* Rotas protegidas */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dna" element={<ProtectedRoute><BusinessDNA /></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
        <Route path="/editor" element={<ProtectedRoute><AssetEditor /></ProtectedRoute>} />
        <Route path="/radar" element={<ProtectedRoute><TrendTracker /></ProtectedRoute>} />
        <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      </Routes>
    </AuthProvider>
  );
}
