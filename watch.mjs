import fs from 'fs';
import process from 'process';
import readline from 'readline';
import {WsServer} from './wsserver.mjs';
import {WsClient} from './wsclient.mjs';
  
"use strict";

export class Watch {

    constructor(port, resources) {
        this.Flows = {};
        this.RawFlows = {};
        this.Ips = {
            'localhost': {'ip':'localhost', 'type':'node', 'name':'localhost'}
        };
        this.LocalesIps = ['localhost'];
        
        this.wsServer = new WsServer(port, resources);
        new WsClient(resources, this);

        // tcpdump input
        var rl = readline.createInterface({
	        input: process.stdin,
	        output: process.stdout,
	        terminal: false
        });

        rl.on('line', this.handleLine.bind(this));
    }

    handleLine(line) {
        var arr = line.split(' ',5);
        var orip = this.checkIpPort(arr[2]);
        var destp = this.checkIpPort(arr[4]);
        var flow = orip['host']['ip']+"->"+destp['host']['ip']+":"+destp['port'];
        if (! this.RawFlows[flow]) {
            this.RawFlows[flow]={"ori":orip['host'],"dest":destp['host'],"port":destp['port']};
        }
    }        
    
    checkIpPort(s) { //8.12.12.12.443(:)
        var arr = s.split(":");
        var arr1 = arr[0].split(".");
	    var ip = arr1[0]+'.'+arr1[1]+'.'+arr1[2]+'.'+arr1[3];
        var host = {'ip':ip, 'name':ip};
        if (this.Ips[ip]) host = this.Ips[ip];
        var port = arr1[4];
        return {'host':host, 'port': port};
    }

    updateIp(ip) {
        for (var flow in this.RawFlows) {
            var updated = false;
            if ((this.RawFlows[flow]['ori']['ip'] == ip) && (this.RawFlows[flow]['ori']['name'] == ip)) {
                this.RawFlows[flow]['ori'] = this.Ips[ip];
                updated = true;
            }
            if ((this.RawFlows[flow]['dest']['ip'] == ip) && (this.RawFlows[flow]['dest']['name'] == ip)) {
                this.RawFlows[flow]['dest'] = this.Ips[ip];
                updated = true;
            }
            if (updated && (this.RawFlows[flow]['ori']['name'] != ip) && (this.RawFlows[flow]['dest']['name'] != ip)) {
                var flowname = this.RawFlows[flow]['ori']['name']+"->"+this.RawFlows[flow]['dest']['name']+":"+this.RawFlows[flow]['port'];
                this.Flows[flowname] = this.RawFlows[flow];
                this.wsServer.produce(flowname, this.Flows);
            }
        }
    }

    checkServiceIP(svc) {
	    var ip = svc.spec.clusterIP;
	    if (svc.metadata && svc.spec && ip && (ip != 'None')) {
            var name = svc.metadata.namespace+".service."+svc.metadata.name;
		    if (! this.Ips[ip]) {
			    this.Ips[ip] = {
				    'ip':ip,
				    'type':'service',
				    'namespace':svc.metadata.namespace,
				    'service':svc.metadata.name,
				    'name':name
			    };
		    }
		    else if (this.Ips[ip]['name'] != name) {
			    this.Ips[ip]['type'] = 'service';
			    this.Ips[ip]['namespace'] = svc.metadata.namespace;
			    this.Ips[ip]['service'] = svc.metadata.name;
			    this.Ips[ip]['name'] = name;
                this.updateIp(ip);
            }
	    }
    }

    checkPodIP(pod) {
	    var ip = pod.status.podIP;
	    if ((pod.status.phase=='Running') &&
		    ((!pod['eventType']) || (pod.eventType != 'DELETED'))) {
		    if (pod.status.podIP == pod.status.hostIP) {
			    for (var i in this.LocalesIps) {
				    var ipl = this.LocalesIps[i];
                    if (this.Ips[ipl]['name'] != pod.spec.nodeName) {
				        this.Ips[ipl]['name'] = pod.spec.nodeName;
				        this.Ips[ipl]['type'] = 'node';
                        this.updateIp(ipl);
                    }
			    }
			    for (var pid in this.Pids) {
				    if (this.Pids[pid]['type'] == "node") {
					    this.Pids[pid]['name'] = pod.spec.nodeName + ".process." + this.Pids[pid]['process'];
				    }
			    }
		    }
		    else {
                var name = pod.metadata.namespace+".pod."+pod.metadata.name;
			    if (! this.Ips[ip]) {
				    this.Ips[ip] = {
					    'ip':ip,
					    'type':'pod',
					    'namespace':pod.metadata.namespace,
					    'pod':pod.metadata.name,
					    'name':name
				    };
			    }
			    else if (this.Ips[ip]['name'] != name) {
				    this.Ips[ip]['type'] = 'pod';
				    this.Ips[ip]['namespace'] = pod.metadata.namespace;
				    this.Ips[ip]['pod'] = pod.metadata.name;
				    this.Ips[ip]['name'] = name;
                    this.updateIp(ip);
			    }
		    }
	    }
	    //else if (Ips[ip] && (Ips[ip]['name'] === pod.metadata.namespace+".pod."+pod.metadata.name)) {
	    //	delete Ips[ip];
	    //}
    }
}


