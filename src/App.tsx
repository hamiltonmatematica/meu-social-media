/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import BusinessDNA from './pages/BusinessDNA';
import CreatePost from './pages/CreatePost';
import AssetEditor from './pages/AssetEditor';
import TrendTracker from './pages/TrendTracker';
import Billing from './pages/Billing';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/dna" element={<BusinessDNA />} />
      <Route path="/create" element={<CreatePost />} />
      <Route path="/editor" element={<AssetEditor />} />
      <Route path="/radar" element={<TrendTracker />} />
      <Route path="/billing" element={<Billing />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}
