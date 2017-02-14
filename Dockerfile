FROM node:0.12.4
 
# Clone and install dockerfile
RUN apt-get install -y git \
 && git clone https://github.com/seikho/node-dockerfile /code/node-dockerfile
 
RUN cd /code/node-dockerfile \
 && npm install
RUN npm install -g http-server toto
 
WORKDIR /code/node-dockerfile
CMD http-server
