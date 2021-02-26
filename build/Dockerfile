FROM registry.access.redhat.com/ubi8/nodejs-14:latest
COPY *.js package.json *.sh /opt/app-root/src
WORKDIR /opt/app-root/src 
RUN npm i
USER root
RUN curl http://mirror.centos.org/centos/8/AppStream/x86_64/os/Packages/tcpdump-4.9.3-1.el8.x86_64.rpm -o tcpdump-4.9.3-1.el8.x86_64.rpm && \
    rpm -i install tcpdump-4.9.3-1.el8.x86_64.rpm && /bin/rm -f tcpdump-4.9.3-1.el8.x86_64.rpm 
CMD sh start.sh