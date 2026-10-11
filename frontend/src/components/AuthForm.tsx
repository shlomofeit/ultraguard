import { useState } from "react";
import type { AuthFormErrors, RegisterInput } from "../types/user";

interface AuthFormProps {
  showName: boolean;
  buttonText: string;
  isLoading: boolean;
  onSubmit: (values: RegisterInput) => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

const validateAuthForm = (
  values: RegisterInput,
  showName: boolean,
): AuthFormErrors => {
  const errors: AuthFormErrors = {};
  if (showName && values.name.trim().length < 2) {
    errors.name = "שם צריך להכיל לפחות 2 תווים";
  }
  if (!EMAIL_PATTERN.test(values.email)) {
    errors.email = "כתובת אימייל לא תקינה";
  }
  if (showName && values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = "סיסמה צריכה להכיל לפחות 8 תווים";
  }
  if (!values.password) {
    errors.password = "צריך להזין סיסמה";
  }
  return errors;
};

const AuthForm = ({
  showName,
  buttonText,
  isLoading,
  onSubmit,
}: AuthFormProps) => {
  const [values, setValues] = useState<RegisterInput>({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<AuthFormErrors>({});

  const handleChange = (field: keyof RegisterInput, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = () => {
    const formErrors = validateAuthForm(values, showName);
    setErrors(formErrors);
    if (Object.keys(formErrors).length === 0) {
      onSubmit(values);
    }
  };

  return (
    <form
      className="auth-form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      {showName && (
        <>
          <label htmlFor="auth-name">שם</label>
          <input
            id="auth-name"
            value={values.name}
            onChange={(e) => handleChange("name", e.target.value)}
          />
          {errors.name && <p className="form-error">{errors.name}</p>}
        </>
      )}

      <label htmlFor="auth-email">אימייל</label>
      <input
        id="auth-email"
        type="email"
        dir="ltr"
        value={values.email}
        onChange={(e) => handleChange("email", e.target.value)}
      />
      {errors.email && <p className="form-error">{errors.email}</p>}

      <label htmlFor="auth-password">סיסמה</label>
      <input
        id="auth-password"
        type="password"
        dir="ltr"
        value={values.password}
        onChange={(e) => handleChange("password", e.target.value)}
      />
      {errors.password && <p className="form-error">{errors.password}</p>}

      <button type="submit" disabled={isLoading}>
        {isLoading ? "שולח..." : buttonText}
      </button>
    </form>
  );
};

export default AuthForm;
