FROM node:12

COPY . /app
WORKDIR /app
RUN npm install --registry=https://registry.npm.taobao.org
# node-gyp build c++ addon
RUN npm run build

# clean &&  node-pre-gyp package && copy
RUN npm run pack

#uplaod to mirror
RUN npm run upload
