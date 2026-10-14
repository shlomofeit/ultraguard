import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import AuthForm from "../components/AuthForm";

const RegisterPage = () => {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const setRegister = useAuthStore((state) => state.setRegister);
  const nav = useNavigate();

  useEffect(() => {
    if (user) {
      nav("/", { replace: true });
    }
  }, [user, nav]);

  return (
    <main className="auth-page">
      <h1>הרשמה ל-UltraGuard</h1>
      <AuthForm
        showName
        buttonText="הירשם"
        isLoading={isLoading}
        onSubmit={setRegister}
      />
      {error && <p className="form-error">{error}</p>}
      <Link to="/login">כבר רשום? להתחברות</Link>
    </main>
  );
};

export default RegisterPage;
