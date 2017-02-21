FROM debian:jessie
 
# Clone and install dockerfile
ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
 && apt-get install -y openssh-server \
 && apt-get clean
RUN echo 'root:root' |chpasswd
RUN sed -ri 's/^PermitRootLogins+.*/PermitRootLogin yes/' /etc/ssh/sshd_config
RUN mkdir -p /var/run/sshd
RUN apt-get install -y sudo && apt-get install -y curl
 
RUN curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash - && sudo apt-get install nodejs
 
 
EXPOSE 22
 
ENTRYPOINT /usr/sbin/sshd -D
CMD ["bash"]
