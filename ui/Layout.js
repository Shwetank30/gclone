import React from 'react';

const Layout = ({ children }) => (
  <div>
    <nav className="navbar navbar-default">
      <div className="navbar-header">
        <a className="navbar-brand" href="#">GClone</a>
      </div>
      <a href="/login/github">Log In with GitHub</a>
    </nav>
    <div className="container">
      { children }
    </div>
  </div>
);

export default Layout;
