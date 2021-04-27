# Deployment instructions

Vote is meant to be deployed on an OKD/OpenShift cluster.
This directory contains most of the files needed to do that, but doesn't include the config maps, since they contain secrets.
You'll need to create 2 config maps, `vote` and `vote-dev`, which should look rather like this, but with placeholders filled in:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: <name of cm>
  namespace: vote
data:
  DB_URL: mongodb://<user>:<password>@tide.csh.rit.edu/vote?ssl=true
  NODE_ENV: <env>
  REACT_APP_BASE_API_URL: https://vote.csh.rit.edu
  REACT_APP_SSO_AUTHORITY: https://sso.csh.rit.edu/auth/realms/csh
  REACT_APP_SSO_CLIENT_ID: vote
```

Once you have all the files together, plop them in a directory and run `oc create -fr <directory>`, and you should see resources start to spin up.


## Updating an existing deployment

Rather than `oc create`, you'll need `oc edit` or `oc replace`.
Please try to keep any changes synchronised with this repository.
