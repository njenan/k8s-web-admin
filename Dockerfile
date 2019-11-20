FROM alpine

RUN apk add --update python make g++ bash
RUN apk add --update nodejs npm
RUN apk add --update ca-certificates \
 && apk add --update -t deps curl \
 && curl -L https://storage.googleapis.com/kubernetes-release/release/v1.16.2/bin/linux/amd64/kubectl -o /usr/local/bin/kubectl \
 && chmod +x /usr/local/bin/kubectl \
 && apk del --purge deps \
 && rm /var/cache/apk/*

RUN mkdir /app

ADD . /app

WORKDIR /app

RUN npm install

RUN addgroup kube-group && adduser -D kube-user -G kube-group
USER kube-user

CMD ["node", "/app/server.js"]

