FROM debian:buster-slim
LABEL maintainer="Max Meinhold <mxmeinhold@gmail.com>"

EXPOSE 8080

ENV NODE_ENV production

RUN mkdir /opt/vote
WORKDIR /opt/vote

# nvm install deps
RUN rm /bin/sh \
    && ln -s /bin/bash /bin/sh \
    && apt-get update \
    && apt-get install -y curl gnupg \
    && apt-get -y autoclean

# NVM and node install
COPY .nvmrc ./

ENV NVM_DIR /usr/local/nvm
RUN mkdir $NVM_DIR \
    && curl --silent -o- https://raw.githubusercontent.com/creationix/nvm/v0.36.0/install.sh | bash 

RUN source $NVM_DIR/nvm.sh; \
    nvm install \
    && nvm use \
    && echo "echo export PATH=\$PATH:\$(nvm which --silent | sed -s "s/\/[a-z]\+$//")" > path.sh

#ENV NODE_PATH $NVM_DIR/v$NODE_VERSION/lib/node_modules
#ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

COPY package.json ./

RUN source $NVM_DIR/nvm.sh; \
    nvm use \
    && npm install --production 

COPY . /opt/vote

RUN source $NVM_DIR/nvm.sh; \
    nvm use \
    && cd client && npm run build

USER 1001

CMD ["./docker-cmd.sh"]
