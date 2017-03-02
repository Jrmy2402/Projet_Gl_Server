FROM debian:jessie
 
MAINTAINER Spriet Jeremy <jeremy.spriet@gmail.com>
# Clone and install dockerfile
RUN apt-get update \
 && apt-get install -y openssh-server \
 && apt-get clean
 
RUN echo 'root:root' |chpasswd
 
RUN sed -ri 's/^PermitRootLogin\s+.*/PermitRootLogin yes/' /etc/ssh/sshd_config && sed -ri 's/UsePAM yes/#UsePAM yes/g' /etc/ssh/sshd_config
 
RUN mkdir -p /var/run/sshd
 
RUN apt-get install -y sudo && apt-get install -y curl
ARG DEBIAN_FRONTEND=noninteractive
 
RUN curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash - && sudo apt-get install nodejs
RUN apt-get install -y mysql-server
RUN apt-get install -y apache2
RUN apt-get install -y php5
RUN apt-get install -y default-jre
 
EXPOSE 22 80 443
 
ENTRYPOINT /usr/sbin/sshd -D
CMD ["bash"]
