FROM node:12

COPY . /app
WORKDIR /app
#国内的npmmirror镜像过慢
#RUN npm install --registry=https://registry.npmmirror.com
RUN npm install
# node-gyp build c++ addon
RUN npm run build

# clean &&  node-pre-gyp package && copy
RUN npm run pack

#uplaod to mirror
RUN npm run upload
