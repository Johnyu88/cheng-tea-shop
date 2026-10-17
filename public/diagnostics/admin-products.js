(function () {
  if (new URLSearchParams(window.location.search).get("diagnostics") !== "1") return;

  if (!document.getElementById("tea-admin-diagnostics") || !document.getElementById("tea-admin-diagnostics-events")) return;

  function text(value) {
    return String(value == null ? "" : value).replace(/[\u0000-\u001f<>]/g, "").slice(0, 80);
  }
  function add(phase, code, detail) {
    var panel = document.getElementById("tea-admin-diagnostics");
    var events = document.getElementById("tea-admin-diagnostics-events");
    if (!panel || !events) return;
    var item = document.createElement("li");
    item.textContent = new Date().toISOString() + " " + phase + " " + code + (detail ? " " + detail : "");
    events.appendChild(item);
    panel.setAttribute("data-last-code", code);
  }
  function statusDetail(detail) {
    return "status=" + text(detail.status) + " type=" + text(detail.contentType) + " ms=" + text(detail.durationMs);
  }

  window.__teaAdminDiagnostics = {
    recordApi: function (name, detail) {
      add("API", String(name).toUpperCase() + "-" + text(detail.status), statusDetail(detail));
    },
    recordApiError: function (name, detail) {
      add("API", String(name).toUpperCase() + "-NETWORK", "type=" + text(detail.errorType) + " ms=" + text(detail.durationMs));
    },
    recordReactMounted: function () { add("REACT", "REACT-MOUNTED"); },
  };

  add("JS", "JS-STARTED");
  window.setTimeout(function () { add("JS", "JS-READY"); }, 250);
  window.addEventListener("error", function (event) {
    if (event.target && event.target !== window && (event.target.src || event.target.href)) {
      var raw = String(event.target.src || event.target.href);
      var path = raw.split("?")[0].split("/").pop() || "resource";
      add("RESOURCE", "RESOURCE-ERROR", "file=" + text(path));
      return;
    }
    add("JS", "JS-EXCEPTION", "type=" + text(event.error && event.error.name || "Error"));
  }, true);
  window.addEventListener("unhandledrejection", function (event) {
    add("JS", "JS-UNHANDLED", "type=" + text(event.reason && event.reason.name || "PromiseRejection"));
  });

  function checkDom() {
    var heading = document.getElementById("product-management-heading");
    var list = document.querySelector('[aria-label="商品清單"]');
    if (!heading && !list) {
      add("DOM", "DOM-MISSING");
      return;
    }
    var node = heading || list;
    var style = window.getComputedStyle(node);
    var rect = node.getBoundingClientRect();
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0" || rect.width === 0 || rect.height === 0) {
      add("DOM", "DOM-HIDDEN", "display=" + text(style.display) + " visibility=" + text(style.visibility));
    } else {
      add("DOM", "DOM-VISIBLE", "width=" + text(Math.round(rect.width)) + " height=" + text(Math.round(rect.height)));
    }
  }
  window.setTimeout(checkDom, 800);
  window.setTimeout(checkDom, 2500);
}());
