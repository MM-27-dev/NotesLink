// components/PublicRoute.jsx
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const PublicRoute = ({ children }) => {
  const user = useSelector((store) => store.user);
  return user ? <Navigate to="/aichat" /> : children;
};

export default PublicRoute;
