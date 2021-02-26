FROM registry.redhat.io/rhel8/support-tools
COPY *.js package.json *.sh /opt/app-root/src
WORKDIR /opt/app-root/src 
RUN yum install -y nodejs && npm i
CMD sh start.sh
