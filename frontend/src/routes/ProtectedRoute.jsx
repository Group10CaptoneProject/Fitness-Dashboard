import { Navigate} from "react-router";
import { isAuthenticated } from "../auth/auth";

function ProtectedRoute({ children }) {

  if (!isAuthenticated()) {
    return (
      <Navigate to="/login" replace />
    );
  }

  return children;
}

export default ProtectedRoute;
