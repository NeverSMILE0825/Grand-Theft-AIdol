(function () {
  const checking = document.getElementById("checking");
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  const loginNotice = document.getElementById("login-notice");
  const ready = document.getElementById("ready");
  const notice = document.getElementById("notice");
  const stats = document.getElementById("stats");
  const visitsBody = document.getElementById("visits");
  const pageLabel = document.getElementById("page-label");
  const detail = document.getElementById("detail");
  const tokenKey = "gta-aidol-dashboard-token";
  let csrf = "";
  let accessToken = "";
  let origin = "";
  let refreshTimer = 0;
  try {
    accessToken = sessionStorage.getItem(tokenKey) || "";
  } catch (error) {
    accessToken = "";
  }
  let page = 1;
  let total = 0;
  const pageSize = 25;
  const selected = new Set();

  function url(path) {
    return origin + path;
  }

  function rememberToken(token) {
    accessToken = token || "";
    try {
      if (accessToken) sessionStorage.setItem(tokenKey, accessToken);
      else sessionStorage.removeItem(tokenKey);
    } catch (error) {
      accessToken = token || "";
    }
  }

  function startRefresh() {
    if (refreshTimer) return;
    refreshTimer = window.setInterval(function () {
      if (document.visibilityState === "visible" && !ready.hidden) load(page);
    }, 10000);
  }

  function api(path, init) {
    const headers = { accept: "application/json" };
    if (accessToken) headers.authorization = "Bearer " + accessToken;
    if (init && init.body !== undefined) headers["content-type"] = "application/json";
    if (init && init.csrf) headers["x-csrf-token"] = init.csrf;
    return fetch(url(path), {
      method: (init && init.method) || "GET",
      headers: headers,
      body: init && init.body !== undefined ? JSON.stringify(init.body) : undefined,
      credentials: origin ? "include" : "same-origin",
      cache: "no-store"
    }).then(function (response) {
      return response.text().then(function (text) {
        let data = {};
        if (text) {
          try { data = JSON.parse(text); } catch (error) { data = {}; }
        }
        return { ok: response.ok, status: response.status, data: data };
      });
    }).catch(function () {
      return { ok: false, status: 0, data: {} };
    });
  }

  function message(result, fallback) {
    if (result.data && typeof result.data.error === "string" && result.data.error) return result.data.error;
    if (result.status === 0 || result.status === 404) return "The dashboard service is unavailable on this host.";
    return fallback;
  }

  function show(node, text) {
    node.hidden = !text;
    node.textContent = text || "";
  }

  function filters() {
    const params = new URLSearchParams();
    params.set("range", document.getElementById("range").value);
    if (document.getElementById("bots").checked) params.set("bots", "1");
    if (document.getElementById("tests").checked) params.set("tests", "1");
    return params;
  }

  function when(ms) {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short"
    }).format(ms);
  }

  function pct(share) {
    return Math.round((Number(share) || 0) * 1000) / 10;
  }

  function referrerLabel(host) {
    const value = String(host || "(direct)").toLowerCase();
    if (value === "t.co" || value === "twitter.com" || value === "x.com") return "X / Twitter (" + host + ")";
    if (value === "t.me" || value.indexOf("telegram") !== -1) return "Telegram (" + host + ")";
    if (value === "(direct)") return "Direct";
    return host || "Direct";
  }

  function renderBreakdown(container, rows, getLabel, options) {
    container.replaceChildren();
    if (!rows || !rows.length) {
      const empty = document.createElement("p");
      empty.className = "empty-note";
      empty.textContent = "No visits in this range.";
      container.appendChild(empty);
      return;
    }
    const limit = options && options.limit > 0 ? options.limit : 0;
    const expandable = limit > 0 && rows.length > limit;
    let expanded = false;
    const max = Math.max.apply(null, rows.map(function (row) { return Number(row.visits) || 0; }).concat([1]));
    var toggle = null;

    function paint() {
      container.replaceChildren();
      const visible = expanded || !expandable ? rows : rows.slice(0, limit);
      visible.forEach(function (row) {
        const item = document.createElement("div");
        item.className = "breakdown-row";
        const meta = document.createElement("div");
        meta.className = "meta";
        const label = document.createElement("div");
        label.className = "label";
        label.textContent = getLabel(row);
        const bar = document.createElement("div");
        bar.className = "bar";
        const fill = document.createElement("span");
        fill.style.width = Math.max(4, Math.round((Number(row.visits) || 0) / max * 100)) + "%";
        bar.appendChild(fill);
        meta.append(label, bar);
        const count = document.createElement("div");
        count.className = "count";
        count.textContent = String(row.visits || 0) + " · " + pct(row.share) + "%";
        item.append(meta, count);
        container.appendChild(item);
      });
      if (expandable) {
        toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "btn btn-quiet breakdown-more";
        toggle.textContent = expanded
          ? "Show less"
          : "Show more (" + (rows.length - limit) + ")";
        toggle.addEventListener("click", function () {
          expanded = !expanded;
          paint();
        });
        container.appendChild(toggle);
      }
    }

    paint();
  }

  function renderHours(container, hours) {
    container.replaceChildren();
    const rows = Array.isArray(hours) && hours.length ? hours : Array.from({ length: 24 }, function (_, hour) {
      return { hour: hour, label: String(hour).padStart(2, "0") + ":00", visits: 0, share: 0 };
    });
    const max = Math.max.apply(null, rows.map(function (row) { return Number(row.visits) || 0; }).concat([1]));
    rows.forEach(function (row) {
      const item = document.createElement("div");
      item.className = "breakdown-row";
      const label = document.createElement("div");
      label.className = "label";
      label.textContent = row.label || (String(row.hour).padStart(2, "0") + ":00");
      const bar = document.createElement("div");
      bar.className = "bar";
      const fill = document.createElement("span");
      fill.style.width = (Number(row.visits) ? Math.max(4, Math.round(Number(row.visits) / max * 100)) : 0) + "%";
      bar.appendChild(fill);
      const count = document.createElement("div");
      count.className = "count";
      count.textContent = String(row.visits || 0);
      item.append(label, bar, count);
      container.appendChild(item);
    });
  }

  function renderTrend(container, trend, unit) {
    container.replaceChildren();
    if (!trend || !trend.length) {
      container.hidden = true;
      return;
    }
    container.hidden = false;
    const title = document.createElement("div");
    title.className = "trend-title";
    title.textContent = unit === "day" ? "Visits by day" : "Visits by hour";
    container.appendChild(title);
    const max = Math.max.apply(null, trend.map(function (row) {
      return Number(row.visits != null ? row.visits : row.visitors) || 0;
    }).concat([1]));
    trend.forEach(function (row) {
      const value = Number(row.visits != null ? row.visits : row.visitors) || 0;
      const uniques = Number(row.visitors) || 0;
      const item = document.createElement("div");
      item.className = "breakdown-row";
      const meta = document.createElement("div");
      meta.className = "meta";
      const label = document.createElement("div");
      label.className = "label";
      label.textContent = row.label || "";
      const bar = document.createElement("div");
      bar.className = "bar";
      const fill = document.createElement("span");
      fill.style.width = (value ? Math.max(4, Math.round(value / max * 100)) : 0) + "%";
      bar.appendChild(fill);
      meta.append(label, bar);
      const count = document.createElement("div");
      count.className = "count";
      count.textContent = value + (uniques !== value ? " visits · " + uniques + " visitors" : "");
      if (uniques === value) count.textContent = String(value);
      item.append(meta, count);
      container.appendChild(item);
    });
  }

  function renderStats(summary) {
    const clicks = summary.clicks || {};
    const cards = [
      ["Active", summary.activeVisitors],
      ["Visitors", summary.browserVisitors],
      ["Visits", summary.visits],
      ["Page views", summary.pageViews],
      ["Telegram", clicks.telegram || 0],
      ["X", clicks.x || 0],
      ["Copy CA", clicks.copy || 0],
      ["Gallery", clicks.gallery || 0],
      ["Missions", clicks.mission || 0]
    ];
    stats.replaceChildren();
    cards.forEach(function (card) {
      const item = document.createElement("div");
      item.className = "stat";
      const label = document.createElement("span");
      label.textContent = card[0];
      const value = document.createElement("b");
      value.textContent = String(card[1] ?? 0);
      item.append(label, value);
      stats.appendChild(item);
    });
    const referrals = (summary.referrals || []).map(function (row) {
      return { visits: row.visits, share: summary.visits ? row.visits / summary.visits : 0, host: row.host };
    });
    renderBreakdown(document.getElementById("by-referrer"), referrals, function (row) {
      return referrerLabel(row.host);
    });
    renderBreakdown(document.getElementById("by-country"), summary.countries || [], function (row) {
      return row.country || "Unknown";
    }, { limit: 5 });
    const deviceTypes = summary.deviceTypes && summary.deviceTypes.length
      ? summary.deviceTypes
      : summarizeDeviceTypes(summary.devices || [], summary.visits || 0);
    renderBreakdown(document.getElementById("by-device-type"), deviceTypes, function (row) {
      const name = String(row.device || "unknown");
      return name.charAt(0).toUpperCase() + name.slice(1);
    });
    renderBreakdown(document.getElementById("by-device"), summary.devices || [], function (row) {
      return row.label || [row.device, row.browser, row.os].filter(Boolean).join(" · ");
    });
    renderHours(document.getElementById("by-hour"), summary.hours || []);
    renderTrend(document.getElementById("by-trend"), summary.trend || [], summary.trendUnit);
  }

  function summarizeDeviceTypes(devices, total) {
    const counts = { desktop: 0, mobile: 0 };
    devices.forEach(function (row) {
      const key = String(row.device || "unknown").toLowerCase();
      counts[key] = (counts[key] || 0) + (Number(row.visits) || 0);
    });
    return ["desktop", "mobile"].map(function (device) {
      const visits = counts[device] || 0;
      return { device: device, visits: visits, share: total ? visits / total : 0 };
    });
  }

  function renderVisits(rows) {
    visitsBody.replaceChildren();
    rows.forEach(function (visit) {
      const row = document.createElement("tr");
      const check = document.createElement("input");
      check.type = "checkbox";
      check.checked = selected.has(visit.id);
      check.addEventListener("change", function () {
        if (check.checked) selected.add(visit.id);
        else selected.delete(visit.id);
      });
      const checkCell = document.createElement("td");
      checkCell.appendChild(check);
      const time = document.createElement("td");
      const open = document.createElement("button");
      open.className = "link";
      open.type = "button";
      open.textContent = when(visit.startedAt);
      open.addEventListener("click", function () { openDetail(visit.id); });
      time.appendChild(open);
      const place = document.createElement("td");
      place.textContent = visit.location || "";
      const ip = document.createElement("td");
      ip.textContent = visit.ip || "Unavailable";
      const device = document.createElement("td");
      device.textContent = [visit.device, visit.browser, visit.os].filter(Boolean).join(" · ");
      const path = document.createElement("td");
      path.textContent = visit.path || "";
      const referrer = document.createElement("td");
      referrer.textContent = visit.referrer || "";
      row.append(checkCell, time, place, ip, device, path, referrer);
      visitsBody.appendChild(row);
    });
    const pages = Math.max(1, Math.ceil(total / pageSize));
    pageLabel.textContent = "Page " + page + " of " + pages + " · " + total + " visits";
    document.getElementById("prev").disabled = page <= 1;
    document.getElementById("next").disabled = page >= pages;
  }

  function load(nextPage) {
    const query = filters().toString();
    return Promise.all([
      api("/api/dashboard/analytics/summary?" + query),
      api("/api/dashboard/analytics/visits?" + query + "&page=" + nextPage + "&pageSize=" + pageSize)
    ]).then(function (results) {
      if (results[0].status === 401) {
        showLogin("");
        return;
      }
      if (!results[0].ok || !results[1].ok) {
        notice.textContent = message(results[0], "Visitor estimates could not be loaded.");
        return;
      }
      page = nextPage;
      total = results[1].data.total || 0;
      renderStats(results[0].data);
      renderVisits(results[1].data.visits || []);
      notice.textContent = "";
    });
  }

  function showLogin(text) {
    checking.hidden = true;
    ready.hidden = true;
    loginForm.hidden = false;
    show(loginNotice, text);
  }

  function showReady() {
    checking.hidden = true;
    loginForm.hidden = true;
    ready.hidden = false;
  }

  function openDetail(id) {
    api("/api/dashboard/analytics/visits/" + id).then(function (result) {
      if (!result.ok) {
        notice.textContent = message(result, "Visit details could not be loaded.");
        return;
      }
      const visit = result.data;
      detail.hidden = false;
      detail.replaceChildren();
      const title = document.createElement("h2");
      title.textContent = when(visit.startedAt);
      const body = document.createElement("p");
      const views = (visit.pageViews || []).map(function (item) { return item.path; }).join(", ");
      const clicks = (visit.clicks || []).map(function (item) { return item.kind; }).join(", ");
      body.textContent = [visit.location, visit.browser, visit.os, visit.device, visit.path, views && ("Pages: " + views), clicks && ("Clicks: " + clicks)].filter(Boolean).join(" · ");
      detail.append(title, body);
    });
  }

  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const button = document.getElementById("login-button");
    button.disabled = true;
    api("/api/dashboard/login", {
      method: "POST",
      csrf: csrf,
      body: { password: document.getElementById("dashboard-password").value }
    }).then(function (result) {
      button.disabled = false;
      if (!result.ok || !result.data.accessToken) {
        show(loginError, message(result, "Incorrect password. Please try again."));
        return;
      }
      rememberToken(result.data.accessToken);
      csrf = result.data.csrfToken || csrf;
      document.getElementById("dashboard-password").value = "";
      show(loginError, "");
      showReady();
      startRefresh();
      load(1);
    });
  });

  document.getElementById("logout").addEventListener("click", function () {
    api("/api/dashboard/logout", { method: "POST", csrf: csrf, body: {} }).then(function () {
      rememberToken("");
      return api("/api/dashboard/session");
    }).then(function (session) {
      if (session.data.csrfToken) csrf = session.data.csrfToken;
      showLogin("");
    });
  });

  document.getElementById("filters").addEventListener("submit", function (event) {
    event.preventDefault();
    selected.clear();
    load(1);
  });

  document.getElementById("prev").addEventListener("click", function () { if (page > 1) load(page - 1); });
  document.getElementById("next").addEventListener("click", function () { load(page + 1); });

  document.getElementById("delete").addEventListener("click", function () {
    const ids = Array.from(selected);
    if (!ids.length) {
      notice.textContent = "Select at least one visit.";
      return;
    }
    api("/api/dashboard/analytics/delete", { method: "POST", csrf: csrf, body: { ids: ids } }).then(function (result) {
      if (!result.ok) {
        notice.textContent = message(result, "Those visits could not be deleted.");
        return;
      }
      notice.textContent = "Deleted " + (result.data.deleted || ids.length) + " visits.";
      selected.clear();
      detail.hidden = true;
      load(1);
    });
  });

  document.getElementById("export").addEventListener("click", function () {
    const query = filters();
    query.set("reveal", document.getElementById("include-ips").checked ? "1" : "0");
    const exportHeaders = { "x-csrf-token": csrf, accept: "text/csv" };
    if (accessToken) exportHeaders.authorization = "Bearer " + accessToken;
    fetch(url("/api/dashboard/analytics/export?" + query.toString()), {
      headers: exportHeaders,
      credentials: origin ? "include" : "same-origin",
      cache: "no-store"
    }).then(function (response) {
      if (!response.ok) throw new Error("export");
      return response.blob();
    }).then(function (blob) {
      const file = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = file;
      link.download = "gta-aidol-visits.csv";
      link.click();
      URL.revokeObjectURL(file);
      notice.textContent = "Export downloaded.";
    }).catch(function () {
      notice.textContent = "The CSV export could not be downloaded.";
    });
  });

  fetch("/site.config.json", { cache: "no-cache" })
    .then(function (response) { return response.ok ? response.json() : {}; })
    .catch(function () { return {}; })
    .then(function (config) {
      const configured = config.analytics && typeof config.analytics.apiOrigin === "string" ? config.analytics.apiOrigin : "";
      origin = configured.replace(/\/$/, "");
      return api("/api/dashboard/session");
    })
    .then(function (result) {
      if (!result.ok || !result.data.csrfToken) {
        showLogin("");
        show(loginError, message(result, "The dashboard service is unavailable on this host."));
        return;
      }
      csrf = result.data.csrfToken;
      if (result.data.authenticated) {
        showReady();
        startRefresh();
        load(1);
        return;
      }
      rememberToken("");
      showLogin("");
    });
})();
