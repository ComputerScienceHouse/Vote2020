/* eslint-disable @typescript-eslint/camelcase */
// The fields of configuration are required by react oidc

declare let process: { env: { REACT_APP_SSO_AUTHORITY: string } };

const configuration = {
  client_id: "vote",
  redirect_uri: `${window.location.protocol}//${window.location.hostname}${
    window.location.port ? `:${window.location.port}` : ""
  }/authentication/callback`,
  response_type: "code",
  post_logout_redirect_uri: "http://localhost:3000/",
  scope: "openid profile email offline_access groups",
  authority: process.env.REACT_APP_SSO_AUTHORITY,
  silent_redirect_uri: `${window.location.protocol}//${
    window.location.hostname
  }${
    window.location.port ? `:${window.location.port}` : ""
  }/authentication/silent_callback`,
  automaticSilentRenew: true,
  loadUserInfo: true,
};

export default configuration;
