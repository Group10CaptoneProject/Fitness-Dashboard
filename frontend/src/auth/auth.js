export function getAccessToken() {
  return localStorage.getItem("access_token");
}

export function isAuthenticated() {
  return Boolean(getAccessToken());
}
