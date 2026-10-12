import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import AuthForm from "../components/AuthForm";

const LoginPage = () => {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const setLogin = useAuthStore((state) => state.setLogin);
  const nav = useNavigate();

  useEffect(() => {
    if (user) {
      nav("/", { replace: true });
    }
  }, [user, nav]);

  return (
    <main className="auth-page">
      <h1>התחברות</h1>
      <AuthForm
        showName={false}
        buttonText="התחבר"
        isLoading={isLoading}
        onSubmit={({ email, password }) => setLogin({ email, password })}
      />
      {error && <p className="form-error">{error}</p>}
      <Link to="/register">אין לך חשבון? להרשמה</Link>
    </main>
  );
};

export default LoginPage;
