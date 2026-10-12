export function adminMiddleware(req, res, next) {
  if (req.user.role !== "admin") {
    const error = new Error("Admins only!");
    error.status = 403;
    throw error;
  }

  next();
}
