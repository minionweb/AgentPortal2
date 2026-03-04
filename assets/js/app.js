/* OpenAgent Portal - Demo SPA (MIT)
   - No proprietary names or data
   - Pure JS + Bootstrap (CDN)
*/

(() => {
  const VERSION = '1.0.0';
  const LS_KEYS = {
    META: 'oa_meta',
    POLICIES: 'oa_policies',
    CLAIMS: 'oa_claims',
    LEADS: 'oa_leads',
    TASKS: 'oa_tasks',
    SETTINGS: 'oa_settings'
  };

  // -------- Utilities --------
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
  const fmtMoney = (n) => '$' + (Number(n||0)).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
  const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString() : '';
  const uid = (prefix='ID') => `${prefix}-${Math.random().toString(36).slice(2,7)}-${Date.now().toString(36).slice(-4)}`;

  const store = {
    get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback } },
    set(key, val) { localStorage.setItem(key, JSON.stringify(val)) },
    remove(key) { localStorage.removeItem(key) }
  };

  // -------- Seed Demo Data (first run) --------
  function seedIfNeeded() {
    const meta = store.get(LS_KEYS.META, {});
    if (meta.version === VERSION) return;

    const today = new Date();
    const d = (offset=0) => new Date(today.getTime() + 86400000*offset).toISOString().slice(0,10);

    const policies = [
      { id:'POL-10001', customer:'Alex Johnson', product:'Auto', effective:d(-120), premium: 112.50, status:'Active' },
      { id:'POL-10002', customer:'Priya Singh', product:'Home', effective:d(-300), premium: 89.00, status:'Active' },
      { id:'POL-10003', customer:'Chris Miller', product:'Life', effective:d(-45), premium: 54.25, status:'Pending' },
      { id:'POL-10004', customer:'Taylor Chen', product:'Commercial', effective:d(-200), premium: 310.00, status:'Active' },
      { id:'POL-10005', customer:'Jordan Lee', product:'Auto', effective:d(-12), premium: 97.80, status:'Lapsed' }
    ];

    const claims = [
      { id:'CLM-20001', policyId:'POL-10001', type:'Auto', status:'Open', created:d(-10), description:'Rear-end collision, minor damage.' },
      { id:'CLM-20002', policyId:'POL-10002', type:'Property', status:'Closed', created:d(-180), description:'Roof hail damage replaced.' }
    ];

    const leads = [
      { id:'LED-30001', name:'Morgan White', source:'Web', status:'New', created:d(-2), notes:'' },
      { id:'LED-30002', name:'Sandra Diaz', source:'Referral', status:'Contacted', created:d(-7), notes:'Requested Auto + Renters bundle.' },
      { id:'LED-30003', name:'Omar Ali', source:'Event', status:'Quoted', created:d(-3), notes:'Waiting on spouse info.' }
    ];

    const tasks = [
      { id:'TSK-40001', text:'Follow up with Sandra about bundle discount', due:d(1), done:false },
      { id:'TSK-40002', text:'Send COI to Taylor for commercial policy', due:d(0), done:true }
    ];

    const settings = { commissionRate: 0.10, theme: 'light', agentName: 'Agent' };

    store.set(LS_KEYS.POLICIES, policies);
    store.set(LS_KEYS.CLAIMS, claims);
    store.set(LS_KEYS.LEADS, leads);
    store.set(LS_KEYS.TASKS, tasks);
    store.set(LS_KEYS.SETTINGS, settings);
    store.set(LS_KEYS.META, { version: VERSION, seededAt: new Date().toISOString() });
  }

  // -------- State Accessors --------
  const getPolicies = () => store.get(LS_KEYS.POLICIES, []);
  const setPolicies = (list) => store.set(LS_KEYS.POLICIES, list);

  const getClaims = () => store.get(LS_KEYS.CLAIMS, []);
  const setClaims = (list) => store.set(LS_KEYS.CLAIMS, list);

  const getLeads = () => store.get(LS_KEYS.LEADS, []);
  const setLeads = (list) => store.set(LS_KEYS.LEADS, list);

  const getTasks = () => store.get(LS_KEYS.TASKS, []);
  const setTasks = (list) => store.set(LS_KEYS.TASKS, list);

  const getSettings = () => store.get(LS_KEYS.SETTINGS, { commissionRate:0.1, theme:'light', agentName:'Agent' });
  const setSettings = (s) => store.set(LS_KEYS.SETTINGS, s);

  // -------- UI Helpers --------
  function setTheme(theme) {
    document.body.setAttribute('data-bs-theme', theme);
    const icon = $('#themeToggle i');
    if (icon) icon.className = theme === 'dark' ? 'bi bi-sun' : 'bi bi-moon-stars';
  }

  function setAgentNameBadge() {
    $('#agentNameBadge').innerHTML = `<i class="bi bi-person-circle me-1"></i>${getSettings().agentName || 'Agent'}`;
  }

  // -------- Views --------
  const routes = {
    '#/dashboard': renderDashboard,
    '#/policies': renderPolicies,
    '#/quotes': renderQuotes,
    '#/claims': renderClaims,
    '#/leads': renderLeads,
    '#/tasks': renderTasks,
    '#/reports': renderReports,
    '#/settings': renderSettings
  };

  function renderDashboard() {
    const el = $('#app');
    const policies = getPolicies();
    const claims = getClaims();
    const leads = getLeads();
    const { commissionRate } = getSettings();

    const activePolicies = policies.filter(p => p.status === 'Active');
    const openClaims = claims.filter(c => c.status !== 'Closed');
    const mtdPremium = policies
      .filter(p => {
        const dt = new Date(p.effective);
        const now = new Date();
        return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
      })
      .reduce((sum, p) => sum + Number(p.premium||0), 0);
    const mtdCommission = mtdPremium * commissionRate;

    el.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="mb-0">Dashboard</h2>
        <div class="text-muted small">Demo only – data stored in your browser</div>
      </div>

      <div class="row g-3 mb-3">
        <div class="col-md-3">
          <div class="card card-kpi shadow-sm">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <i class="bi bi-card-checklist display-6 text-primary me-3"></i>
                <div>
                  <div class="text-muted">Active Policies</div>
                  <div class="h4 mb-0">${activePolicies.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card card-kpi shadow-sm">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <i class="bi bi-clipboard-pulse display-6 text-primary me-3"></i>
                <div>
                  <div class="text-muted">Open Claims</div>
                  <div class="h4 mb-0">${openClaims.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card card-kpi shadow-sm">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <i class="bi bi-people display-6 text-primary me-3"></i>
                <div>
                  <div class="text-muted">Leads</div>
                  <div class="h4 mb-0">${leads.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card card-kpi shadow-sm">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <i class="bi bi-wallet2 display-6 text-primary me-3"></i>
                <div>
                  <div class="text-muted">Commission (MTD)</div>
                  <div class="h4 mb-0">${fmtMoney(mtdCommission)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-lg-7">
          <div class="card shadow-sm">
            <div class="card-header d-flex justify-content-between align-items-center">
              <span><i class="bi bi-card-checklist me-2"></i>Recent Policies</span>
              <a href="#/policies" class="btn btn-smiv>
            <div class="card-body table-responsive">
              <table class="table table-sm align-middle mb-0">
                <thead><tr><th>Policy #</th><th>Customer</th><th>Product</th><th>Effective</th><th>Status</th><th class="text-end">Premium</th></tr></thead>
                <tbody>
                  ${policies.slice(-5).reverse().map(p => `
                    <tr>
                      <td>${p.id}</td>
                      <td>${p.customer}</td>
                      <td>${p.product}</td>
                      <td>${fmtDate(p.effective)}</td>
                      <td><span class="badge ${badgeForStatus(p.status)}">${p.status}</span></td>
                      <td class="text-end">${fmtMoney(p.premium)}</td>
                    </tr>`).join('') || `<tr><td colspan="6" class="text-center text-muted">No policies yet</td></tr>`}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="col-lg-5">
          <div class="card shadow-sm h-100">
            <div class="card-header"><i class="bi bi-bell me-2"></i>Upcoming Tasks</div>
            <div class="card-body">
              <div id="dashTasks"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    const tasks = getTasks().slice().sort((a,b)=> (a.due||'').localeCompare(b.due||'')).slice(0,6);
    $('#dashTasks').innerHTML = tasks.length ? `
      <ul class="list-group list-group-flush">
        ${tasks.map(t => `
          <li class="list-group-item d-flex justify-content-between align-items-center ${t.done?'text-decoration-line-through text-muted':''}">
            <span><i class="bi ${t.done?'bi-check-circle-fill text-success':'bi-circle'} me-2"></i>${t.text}</span>
            <span class="badge text-bg-${t.done?'secondary':'info'}">${fmtDate(t.due)}</span>
          </li>`).join('')}
      </ul>` : `<div class="text-muted">No tasks yet</div>`;
  }

  function badgeForStatus(status){
    const map = { Active:'success', Pending:'warning', Lapsed:'secondary', Cancelled:'danger' };
    return `text-bg-${map[status] || 'light'}`;
  }

  function renderPolicies() {
    const el = $('#app');
    const policies = getPolicies();
    el.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="mb-0">Policies</h2>
        <div class="d-flex gap-2">
          <input class="form-control form-control-sm" id="policySearch" placeholder="Search customer/product/status..." />
          <button class="btn btn-primary btn-sm" id="btnAddPolicy"><i class="bi bi-plus-circle me-1"></i>Add Policy</button>
        </div>
      </div>
      <div class="card shadow-sm">
        <div class="card-body table-responsive">
          <table class="table table-hover align-middle" id="policiesTable">
            <thead><tr>
              <th>Policy #</th><th>Customer</th><th>Product</th><th>Effective</th><th>Status</th><th class="text-end">Premium</th><th class="text-end">Actions</th>
            </tr></thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    `;

    const tbody = $('#policiesTable tbody');
    const renderRows = (rows) => {
      tbody.innerHTML = rows.map(p => `
        <tr>
          <td>${p.id}</td>
          <td>${p.customer}</td>
          <td>${p.product}</td>
          <td>${fmtDate(p.effective)}</td>
          <td><span class="badge ${badgeForStatus(p.status)}">${p.status}</span></td>
          <td class="text-end">${fmtMoney(p.premium)}</td>
          <td class="text-end table-actions">
            <button class="btn btn-outline-secondary btn-sm       del<i class="bi bi-trash"></i></button>
          </td>
        </tr>`).join('') || `<tr><td colspan="7" class="text-center text-muted">No policies yet</td></tr>`;
    };
    renderRows(policies);

    $('#policySearch').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = policies.filter(p =>
        [p.id, p.customer, p.product, p.status].some(v => (''+v).toLowerCase().includes(q))
      );
      renderRows(filtered);
    });

    $('#btnAddPolicy').addEventListener('click', () => openPolicyModal());
    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      if (action === 'edit') openPolicyModal(policies.find(p => p.id === id));
      if (action === 'del') {
        if (confirm('Delete this policy?')) {
          setPolicies(policies.filter(p => p.id !== id));
          renderPolicies();
        }
      }
    });
  }

  function openPolicyModal(policy) {
    $('#policyModalTitle').textContent = policy ? 'Edit Policy' : 'Add Policy';
    $('#policyId').value = policy?.id ?? '';
    $('#policyCustomer').value = policy?.customer ?? '';
    $('#policyProduct').value = policy?.product ?? '';
    $('#policyEffective').value = policy?.effective ?? '';
    $('#policyStatus').value = policy?.status ?? 'Active';
    $('#policyPremium').value = policy?.premium ?? '';

    const modal = new bootstrap.Modal('#policyModal');
    modal.show();

    $('#policyForm').onsubmit = (ev) => {
      ev.preventDefault();
      const policies = getPolicies();
      const isEdit = !!$('#policyId').value;
      const obj = {
        id: isEdit ? $('#policyId').value : uid('POL'),
        customer: $('#policyCustomer').value.trim(),
        product: $('#policyProduct').value,
        effective: $('#policyEffective').value,
        status: $('#policyStatus').value,
        premium: Number($('#policyPremium').value || 0)
      };
      if (isEdit) {
        const idx = policies.findIndex(p => p.id === obj.id);
        if (idx >= 0) policies[idx] = obj;
      } else {
        policies.push(obj);
      }
      setPolicies(policies);
      modal.hide();
      window.location.hash = '#/policies';
      renderPolicies();
    };
  }

  function renderQuotes() {
    const el = $('#app');
    el.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="mb-0">Quote Builder</h2>
      </div>
      <div class="card shadow-sm">
        <div class="card-body">
          <form id="quoteForm" class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Customer Name</label>
              <input class="form-control" id="qName" required />
            </div>
            <div class="col-md-3">
              <label class="form-label">Product</label>
              <select class="form-select" id="qProduct" required>
                <option>Auto</option>
                <option>Home</option>
                <option>Life</option>
                <option>Renters</option>
                <option>Commercial</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Coverage Level</label>
              <select class="form-select" id="qCoverage" required>
                <option value="basic">Basic</option>
                <option value="standard" selected>Standard</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Risk Factor (0.8–1.5)</label>
              <input type="number" step="0.01" min="0.8" max="1.5" class="form-control" id="qRisk" value="1.00" />
            </div>
            <div class="col-md-4">
              <label class="form-label">Asset Value (USD)</label>
              <input type="number" step="100" min="0" class="form-control" id="qValue" value="25000" />
            </div>
            <div class="col-md-4 d-grid align-items-end">
              <button class="btn btn-primary mt-md-4" type="submit"><i class="bi bi-calculator me-1"></i>Generate Quote</button>
            </div>
          </form>
          <hr/>
          <div id="quoteResult" class="lead"></div>
          <div id="quoteAddPolicy" class="mt-3 d-none">
            <button class="btn btn-success"><i class="bi bi-plus-circle me-1"></i>Add as Policy</button>
          </div>
        </div>
      </div>
    `;

    $('#quoteForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#qName').value.trim();
      const product = $('#qProduct').value;
      const coverage = $('#qCoverage').value;
      const risk = Math.min(1.5, Math.max(0.8, Number($('#qRisk').value || 1)));
      const value = Number($('#qValue').value || 0);

      // Simple pricing model:
      const base = { Auto: 60, Home: 45, Life: 30, Renters: 20, Commercial: 100 }[product] || 50;
      const coverageFactor = { basic: 0.9, standard: 1.0, premium: 1.25 }[coverage];
      const valueFactor = value > 0 ? Math.log10(1 + value/10000) : 0.8; // gentle slope
      const premium = (base * coverageFactor * risk * valueFactor).toFixed(2);

      $('#quoteResult').textContent = `Estimated monthly premium for ${name}: ${fmtMoney(premium)} (${product}, ${coverage})`;

      const addBtnWrap = $('#quoteAddPolicy');
      addBtnWrap.classList.remove('d-none');
      addBtnWrap.querySelector('button').onclick = () => {
        const policies = getPolicies();
        const policy = {
          id: uid('POL'),
          customer: name,
          product,
          effective: new Date().toISOString().slice(0,10),
          status: 'Pending',
          premium: Number(premium)
        };
        policies.push(policy);
        setPolicies(policies);
        window.location.hash = '#/policies';
        renderPolicies();
      };
    });
  }

  function renderClaims() {
    const el = $('#app');
    const claims = getClaims();
    el.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="mb-0">Claims</h2>
        <button class="btn btn-primary btn-sm" id="btnAddClaim"><i class="bi bi-plus-circle me-1"></i>Add Claim</button>
      </div>
      <div class="card shadow-sm">
        <div class="card-body table-responsive">
          <table class="table table-hover align-middle">
            <thead><tr><th>Claim #</th><th>Policy #</th><th>Type</th><th>Status</th><th>Created</th><th>Description</th></tr></thead>
            <tbody>
              ${claims.map(c => `
                <tr>
                  <td>${c.id}</td>
                  <td>${c.policyId}</td>
                  <td>${c.type}</td>
                  <td><span class="badge ${c.status==='Closed'?'text-bg-secondary':'text-bg-info'}">${c.status}</span></td>
                  <td>${fmtDate(c.created)}</td>
                  <td>${c.description||''}</td>
                </tr>`).join('') || `<tr><td colspan="6" class="text-center text-muted">No claims yet</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
    $('#btnAddClaim').addEventListener('click', () => {
      const modal = new bootstrap.Modal('#claimModal');
      $('#claimForm').reset();
      modal.show();
      $('#claimForm').onsubmit = (ev) => {
        ev.preventDefault();
        const list = getClaims();
        list.push({
          id: uid('CLM'),
          policyId: $('#claimPolicy').value.trim(),
          type: $('#claimType').value,
          status: $('#claimStatus').value,
          created: new Date().toISOString().slice(0,10),
          description: $('#claimDesc').value.trim()
        });
        setClaims(list);
        modal.hide();
        renderClaims();
      };
    });
  }

  function renderLeads() {
    const el = $('#app');
    const leads = getLeads();
    el.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="mb-0">Leads</h2>
        <div class="d-flex gap-2">
          <input class="form-control form-control-sm" id="leadName" placeholder="New lead name" />
          <select class="form-select form-select-sm" id="leadSource">
            <option>Web</option><option>Referral</option><option>Event</option><option>Phone</option>
          </select>
          <button class="btn btn-primary btn-sm" id="btnAddLead"><i class="bi bi-plus-circle me-1"></i>Add</button>
        </div>
      </div>
      <div class="card shadow-sm">
        <div class="card-body table-responsive">
          <table class="table align-middle">
            <thead><tr><th>Name</th><th>Source</th><th>Status</th><th>Created</th><th>Notes</th><th class="text-end">Actions</th></tr></thead>
            <tbody id="leadBody"></tbody>
          </table>
        </div>
      </div>
    `;
    const body = $('#leadBody');
    const render = () => {
      const data = getLeads();
      body.innerHTML = data.map(l => `
        <tr>
          <td>${l.name}</td>
          <td>${l.source}</td>
          <td>
            <select class="form-select form-select-sm lead-status" data-id="${l.id}">
              ${['New','Contacted','Quoted','Won','Lost'].map(s => `<option ${s===l.status?'selected':''}>${s}</option>`).join('')}
            </select>
          </td>
          <td>${fmtDate(l.created)}</td>
          <td><input class="form-control form-control-sm lead-notes" data-id="${l.id}" value="${l.notes||''}" /></td>
          <td class="text-end">
            <button class="btn btn-outline-danger btn-sm" data-del="${l.id}"><i class="bi bi-trash"></i></button>
          </td>
        </tr>`).join('') || `<tr><td colspan="6" class="text-center text-muted">No leads yet</td></tr>`;
    };
    render();

    $('#btnAddLead').onclick = () => {
      const name = $('#leadName').value.trim();
      if (!name) return alert('Enter a lead name');
      const leads = getLeads();
      leads.push({ id: uid('LED'), name, source: $('#leadSource').value, status:'New', created:new Date().toISOString().slice(0,10), notes:'' });
      setLeads(leads);
      $('#leadName').value = '';
      render();
    };

    body.addEventListener('change', (e) => {
      if (e.target.classList.contains('lead-status')) {
        const id = e.target.getAttribute('data-id');
        const leads = getLeads();
        const it = leads.find(l => l.id === id);
        if (it) { it.status = e.target.value; setLeads(leads); }
      }
    });
    body.addEventListener('input', (e) => {
      if (e.target.classList.contains('lead-notes')) {
        const id = e.target.getAttribute('data-id');
        const leads = getLeads();
        const it = leads.find(l => l.id === id);
        if (it) { it.notes = e.target.value; setLeads(leads); }
      }
    });
    body.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-del]');
      if (!btn) return;
      const id = btn.getAttribute('data-del');
      const leads = getLeads().filter(l => l.id !== id);
      setLeads(leads);
      render();
    });
  }

  function renderTasks() {
    const el = $('#app');
    el.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="mb-0">Tasks</h2>
        <div class="d-flex gap-2">
          <input class="form-control form-control-sm" id="taskText" placeholder="New task..." />
          <input type="date" class="form-control form-control-sm" id="taskDue" />
          <button class="btn btn-primary btn-sm" id="btnAddTask"><i class="bi bi-plus-circle me-1"></i>Add</button>
        </div>
      </div>
      <div class="card shadow-sm">
        <div class="card-body">
          <ul class="list-group" id="taskList"></ul>
        </div>
      </div>
    `;

    const listEl = $('#taskList');
    const render = () => {
      const tasks = getTasks().slice().sort((a,b) => (a.done === b.done) ? (a.due||'').localeCompare(b.due||'') : (a.done - b.done));
      listEl.innerHTML = tasks.map(t => `
        <li class="list-group-item d-flex justify-content-between align-items-center ${t.done?'text-decoration-line-through text-muted':''}">
          <div class="d-flex align-items-center gap-2">
            <input class="form-check-input task-toggle" type="checkbox" ${t.done?'checked':''} data-id="${t.id}" />
            <span>${t.text}</span>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="badge text-bg-${t.done?'secondary':'info'}">${fmtDate(t.due)}</span>
            <button class="btn btn-outline-danger btn-sm" data-del="${t.id}"><i class="bi bi-trash"></i></button>
          </div>
        </li>`).join('') || `<li class="list-group-item text-muted">No tasks yet</li>`;
    };
    render();

    $('#btnAddTask').onclick = () => {
      const text = $('#taskText').value.trim();
      const due = $('#taskDue').value || new Date().toISOString().slice(0,10);
      if (!text) return;
      const tasks = getTasks();
      tasks.push({ id: uid('TSK'), text, due, done:false });
      setTasks(tasks);
      $('#taskText').value = '';
      render();
    };

    listEl.addEventListener('change', (e) => {
      if (e.target.classList.contains('task-toggle')) {
        const id = e.target.getAttribute('data-id');
        const tasks = getTasks();
        const it = tasks.find(t => t.id === id);
        if (it) { it.done = e.target.checked; setTasks(tasks); render(); }
      }
    });
    listEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-del]');
      if (!btn) return;
      const id = btn.getAttribute('data-del');
      const tasks = getTasks().filter(t => t.id !== id);
      setTasks(tasks);
      render();
    });
  }

  function renderReports() {
    const el = $('#app');
    const policies = getPolicies();
    const { commissionRate } = getSettings();

    // Group by YYYY-MM
    const byMonth = {};
    for (const p of policies) {
      const key = (p.effective || '').slice(0,7);
      if (!key) continue;
      byMonth[key] = (byMonth[key] || 0) + Number(p.premium||0);
    }
    const rows = Object.entries(byMonth).sort(([a],[b]) => a.localeCompare(b));

    el.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="mb-0">Reports</h2>
        <div class="text-muted small">Commission rate: ${(commissionRate*100).toFixed(1)}%</div>
      </div>
      <div class="card shadow-sm">
        <div class="card-body table-responsive">
          <table class="table align-middle">
            <thead><tr><th>Month</th><th class="text-end">Premium</th><th class="text-end">Commission</th></tr></thead>
            <tbody>
              ${rows.map(([m, prem]) => `
                <tr>
                  <td>${m}</td>
                  <td class="text-end">${fmtMoney(prem)}</td>
                  <td class="text-end">${fmtMoney(prem * commissionRate)}</td>
                </tr>`).join('') || `<tr><td colspan="3" class="text-center text-muted">No data yet</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderSettings() {
    const el = $('#app');
    const s = getSettings();
    el.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="mb-0">Settings</h2>
      </div>
      <div class="row g-3">
        <div class="col-lg-6">
          <div class="card shadow-sm">
            <div class="card-header"><i class="bi bi-person-gear me-2"></i>Profile</div>
            <div class="card-body">
              <div class="mb-3">
                <label class="form-label">Agent display name</label>
                <input class="form-control" id="setAgentName" value="${s.agentName||''}" />
              </div>
              <div class="mb-3">
                <label class="form-label">Theme</label>
                <select class="form-select" id="setTheme">
                  <option value="light" ${s.theme==='light'?'selected':''}>Light</option>
                  <option value="dark" ${s.theme==='dark'?'selected':''}>Dark</option>
                </select>
              </div>
              <button class="btn btn-primary" id="btnSaveProfile"><i class="bi bi-save me-1"></i>Save</button>
            </div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="card shadow-sm h-100">
            <div class="card-header"><i class="bi bi-sliders me-2"></i>Business Settings</div>
            <div class="card-body">
              <div class="mb-3">
                <label class="form-label">Commission rate</label>
                <div class="input-group">
                  <input type="number" min="0" max="100" step="0.5" class="form-control" id="setCommission"
                         value="${(s.commissionRate*100).toFixed(1)}" />
                  <span class="input-group-text">%</span>
                </div>
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-primary" id="btnSaveBiz"><i class="bi bi-save me-1"></i>Save</button>
                <button class="btn btn-outline-danger ms-auto" id="btnResetData"><i class="bi bi-exclamation-triangle me-1"></i>Reset demo data</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    $('#btnSaveProfile').onclick = () => {
      const ns = { ...getSettings(), agentName: $('#setAgentName').value.trim(), theme: $('#setTheme').value };
      setSettings(ns);
      setTheme(ns.theme);
      setAgentNameBadge();
      alert('Profile updated');
    };
    $('#btnSaveBiz').onclick = () => {
      let val = Number($('#setCommission').value || 0) / 100;
      val = Math.min(1, Math.max(0, val));
      const ns = { ...getSettings(), commissionRate: val };
      setSettings(ns);
      alert('Commission updated');
    };
    $('#btnResetData').onclick = () => {
      if (!confirm('Reset all demo data? This cannot be undone.')) return;
      Object.values(LS_KEYS).forEach(k => store.remove(k));
      seedIfNeeded();
      setTheme(getSettings().theme || 'light');
      setAgentNameBadge();
      window.location.hash = '#/dashboard';
      renderDashboard();
    };
  }

  // -------- Router --------
  function router() {
    const path = location.hash || '#/dashboard';
    const view = routes[path] || renderDashboard;
    view();
    // highlight nav
    $$('#topNav .nav-link').forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === path);
    });
  }

  // -------- Init --------
  function init() {
    seedIfNeeded();
    const settings = getSettings();
    setTheme(settings.theme || 'light');
    setAgentNameBadge();
    $('#themeToggle').addEventListener('click', () => {
      const s = getSettings();
      const next = s.theme === 'dark' ? 'light' : 'dark';
      setSettings({ ...s, theme: next });
      setTheme(next);
    });
    window.addEventListener('hashchange', router);
    router();
  }

  // Start
  document.addEventListener('DOMContentLoaded', init);
})();
