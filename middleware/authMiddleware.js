exports.ensureAuth = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  return res.status(401).send("Unauthorized");
};
