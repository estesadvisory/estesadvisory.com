// CloudFront Function (viewer-request): 301 www → apex, preserve path + query.
// Domain names are substituted at apply time via templatefile().
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

  return request;
}
