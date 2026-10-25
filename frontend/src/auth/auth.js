import { jwtDecode } from "jwt-decode";

export function getAccessToken() {
  return localStorage.getItem("access_token");
}

export function removeExpireToken(){
  const token = getAccessToken()
  const currentTime = Date.now() / 1000;
  if (!token){
    return;
  }
  try{
    const decodedToken = jwtDecode(token);
    if (decodedToken.exp < currentTime) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("username");
    }
  }catch(error){
    localStorage.removeItem("access_token");
    localStorage.removeItem("username");
  }
}

export function isAuthenticated() {
  removeExpireToken()
  return Boolean(getAccessToken());
}

