// main.jsx — Vite/React 18 entry for COMPOUND.
//
// The prototype loaded ~30 .jsx files via <script type="text/babel"> in a fixed
// order, sharing components through window.*. We replicate that exactly: each
// module is imported here for its side effects (top-level declarations + any
// Object.assign(window, …) publishing) in the SAME order as the old index.html,
// then we mount <App/>. Cross-file references are also wired with real ESM
// imports inside each module, so nothing depends on global script scope anymore.
import React from 'react';
import { createRoot } from 'react-dom/client';

import './tweaks-panel.jsx';
import './mobile-shell.jsx';
import './samsung-frame.jsx';
import './compound-ui.jsx';
import './onboarding-screens.jsx';
import './home-data.jsx';
import './live-state.jsx';
import './home-components.jsx';
import './three-rings.jsx';
import './todo-list.jsx';
import './home-screen.jsx';
import './checkin-modal.jsx';
import './workout-data.jsx';
import './workout-history.jsx';
import './workout-screens.jsx';
import './workout-session.jsx';
import './workout-dashboard.jsx';
import './workout-enhancements.jsx';
import './nutrition-data.jsx';
import './macro-calc-screen.jsx';
import './add-button.jsx';
import './nutrition-screen.jsx';
import './nutrition-tab.jsx';
import './reports-data.jsx';
import './reports-screen.jsx';
import './badges.jsx';
import './settings-screen.jsx';
import './home-extras.jsx';
import './quick-log.jsx';
import './body-progress.jsx';
import { App } from './app.jsx';

createRoot(document.getElementById('root')).render(<App />);
