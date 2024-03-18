FROM node:18-alpine

ENV WORK_PATH /usr/share/node/api/onlog-nuvemshop

WORKDIR $WORK_PATH

COPY . $WORK_PATH

EXPOSE 3003

CMD [ "node", "src/app.js" ]