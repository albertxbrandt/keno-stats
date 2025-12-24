// src/dashboard/dashboard-entry.js
// Entry point for dashboard Preact app

import { render } from 'preact';
import { Dashboard } from './Dashboard.jsx';

// Mount the app
render(<Dashboard />, document.getElementById('app'));
