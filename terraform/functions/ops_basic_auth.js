// CloudFront Function (viewer-request) for /ops* only.
// 1) www → apex 301 (same host rules as public site)
// 2) HTTP Basic Auth — no cookies; browser sends Authorization each request
// Credentials injected at terraform apply (see ops_auth.tf). Do not commit real secrets.
function handler(event) {
  var request = event.request;
  var hostHeader = request.headers.host;
  var host = hostHeader && hostHeader.value ? hostHeader.value.toLowerCase() : "";

  if (host === "${www_domain}") {
    var qs = [];
    var querystring = request.querystring || {};
    for (var key in querystring) {
      if (!Object.prototype.hasOwnProperty.call(querystring, key)) continue;
      var item = querystring[key];
      if (item.multiValue) {
        for (var i = 0; i < item.multiValue.length; i++) {
          qs.push(encodeURIComponent(key) + "=" + encodeURIComponent(item.multiValue[i].value));
        }
      } else if (item.value !== undefined && item.value !== null && item.value !== "") {
        qs.push(encodeURIComponent(key) + "=" + encodeURIComponent(item.value));
      } else {
        qs.push(encodeURIComponent(key));
      }
    }
    var location = "https://${apex_domain}" + request.uri + (qs.length ? "?" + qs.join("&") : "");
    return {
      statusCode: 301,
      statusDescription: "Moved Permanently",
      headers: {
        location: { value: location },
      },
    };
  }

  var expected = "Basic ${basic_b64}";
  var auth = request.headers.authorization;
  var provided = auth && auth.value ? auth.value : "";

  if (provided !== expected) {
    return {
      statusCode: 401,
      statusDescription: "Unauthorized",
      headers: {
        "www-authenticate": { value: 'Basic realm="Estes Advisory Ops"' },
        "cache-control": { value: "no-store" },
      },
      body: {
        encoding: "text",
        data: "Unauthorized",
      },
    };
  }

  // Directory default: /ops and /ops/ → /ops/index.html
  var uri = request.uri;
  if (uri === "/ops" || uri === "/ops/") {
    request.uri = "/ops/index.html";
  }

  return request;
}
