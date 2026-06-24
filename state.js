let allStats = {};
let allUsers = [];

let currentCardState = {
    name: '',
    time: 0,
    count: 0,
    pages: 0,
    chars: 0,
    sources: 0,
    themeName: '',
    history: []
};

let isContextMenuOpen = false;
let currentSortMode = 'chrono';
let excludedMarathons = new Set();
let lastRenderedUser = '';
let lastRenderedRange = '';
let lastRenderedSort = '';
let userMarathonsOrder = [];
let activeUserForOrder = '';
let forceCheckboxRebuild = false;

let userMetricsOrder = ['time', 'pages', 'chars', 'sources'];
let enabledMetrics = new Set(['time']);
let lastRenderedMetrics = '';

let historyChart = null;
let currentMetric = 'time';
let currentRange = 'all';
let currentQuery = '';
