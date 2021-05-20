/**
 * @license
 * Copyright 2020 Xingwang Liao <kuoruan@gmail.com>
 *
 * Licensed to the public under the MIT License.
 */

"use strict";

"require form";
"require fs";
// "require request";
"require rpc";
"require uci";
"require ui";
"require v2ray";
// "require view";

"require tools/widgets as widgets";

"require view/v2ray/include/custom as custom";
"require view/v2ray/tools/converters as converters";

const gfwlistUrls = {
  github:
    "https://raw.githubusercontent.com/gfwlist/gfwlist/master/gfwlist.txt",
  gitlab: "https://gitlab.com/gfwlist/gfwlist/raw/master/gfwlist.txt",
  pagure: "https://pagure.io/gfwlist/raw/master/f/gfwlist.txt",
  bitbucket: "https://bitbucket.org/gfwlist/gfwlist/raw/HEAD/gfwlist.txt",
};

const apnicDelegatedUrls = {
  apnic: "https://ftp.apnic.net/stats/apnic/delegated-apnic-latest",
  arin: "https://ftp.arin.net/pub/stats/apnic/delegated-apnic-latest",
  ripe: "https://ftp.ripe.net/pub/stats/apnic/delegated-apnic-latest",
  iana: "https://ftp.iana.org/pub/mirror/rirstats/apnic/delegated-apnic-latest",
};

// @ts-ignore
return L.view.extend<[SectionItem[], SectionItem[]]>({
  handleListUpdate(ev: MouseEvent, section_id: string, listtype: string) {
    const hideModal = function () {
      ui.hideModal();

      window.location.reload();
    };

    switch (listtype) {
      case "gfwlist": {
        const gfwlistMirror =
          uci.get<string>("v2ray", section_id, "gfwlist_mirror") || "github";
        const url = gfwlistUrls[gfwlistMirror];

        return L.Request.request(L.url("admin/services/v2ray/request"), {
          method: "post",
          timeout: 50 * 1000,
          query: {
            url: url,
            token: L.env.token,
            sessionid: L.env.sessionid,
          },
        })
          .then(function (res: LuCI.response) {
            let data;
            if (res.status === 200 && (data = res.json())) {
              let content;
              if (!data.code && (content = data.content)) {
                const gfwlistDomains = converters.extractGFWList(content);
                if (gfwlistDomains) {
                  fs.write("/etc/v2ray/gfwlist.txt", gfwlistDomains)
                    .then(function () {
                      ui.showModal(_("List Update"), [
                        E("p", _("GFWList updated.")),
                        E(
                          "div",
                          { class: "right" },
                          E(
                            "button",
                            {
                              class: "btn",
                              click: hideModal,
                            },
                            _("OK")
                          )
                        ),
                      ]);
                    })
                    .catch(L.raise);
                } else {
                  L.raise("Error", _("Failed to decode GFWList."));
                }
              } else {
                L.raise("Error", data.message || _("Failed to fetch GFWList."));
              }
            } else {
              L.raise("Error", res.statusText);
            }
          })
          .catch(function (e) {
            ui.addNotification(null, E("p", e.message));
          });
      }
      case "chnroute":
      case "chnroute6": {
        const delegatedMirror =
          uci.get<string>("v2ray", section_id, "apnic_delegated_mirror") ||
          "apnic";

        const url = apnicDelegatedUrls[delegatedMirror];

        return L.Request.request(L.url("admin/services/v2ray/request"), {
          method: "post",
          timeout: 50 * 1000,
          query: {
            url: url,
            token: L.env.token,
            sessionid: L.env.sessionid,
          },
        })
          .then(function (res: LuCI.response) {
            let data;
            if (res.status === 200 && (data = res.json())) {
              let content;
              if ((content = data.content)) {
                const ipList = converters.extractCHNRoute(
                  content,
                  listtype === "chnroute6"
                );

                fs.write(`/etc/v2ray/${listtype}.txt`, ipList)
                  .then(function () {
                    ui.showModal(_("List Update"), [
                      E("p", _("CHNRoute list updated.")),
                      E(
                        "div",
                        { class: "right" },
                        E(
                          "button",
                          {
                            class: "btn",
                            click: hideModal,
                          },
                          _("OK")
                        )
                      ),
                    ]);
                  })
                  .catch(L.raise);
              } else {
                L.raise(
                  "Error",
                  data.message || _("Failed to fetch CHNRoute list.")
                );
              }
            } else {
              L.raise("Error", res.statusText);
            }
          })
          .catch(function (e) {
            ui.addNotification(null, E("p", e.message));
          });
      }

      default: {
        ui.addNotification(null, _("Unexpected error."));
      }
    }
  },
  load: function () {
    return v2ray.getDokodemoDoorPorts();
  },
  render: function (dokodemoDoorPorts = []) {
    const m = new form.Map(
      "v2ray",
      "%s - %s".format(_("V2Ray"), _("Transparent Proxy"))
    );

    const s = m.section(
      form.NamedSection,
      "main_transparent_proxy",
      "transparent_proxy"
    );

    s.tab("general", _("General Settings"));
    s.tab("ipset", _("Ipset List"));
    s.tab("update", _("IP & Domain File Update"));

    let o;

    o = s.taboption(
      "general",
      form.Value,
      "redirect_port",
      _("Redirect port"),
      _("Enable transparent proxy on Dokodemo-door port.")
    );
    o.value("", _("None"));
    for (const p of dokodemoDoorPorts) {
      o.value(p.value, p.caption);
    }
    o.datatype = "port";

    o = s.taboption(
      "general",
      widgets.NetworkSelect,
      "lan_ifaces",
      _("LAN interfaces"),
      _("Enable proxy on selected interfaces.")
    );
    o.multiple = true;
    o.nocreate = true;
    o.filter = function (section_id: string, value: string) {
      return value.indexOf("wan") < 0;
    };
    o.rmempty = false;

    o = s.taboption(
      "general",
      form.Flag,
      "use_tproxy",
      _("Use TProxy"),
      _("Setup redirect rules with TProxy.")
    );

    o = s.taboption(
      "general",
      form.Flag,
      "only_privileged_ports",
      _("Only privileged ports"),
      _("Only redirect tcp & udp traffic on ports below 1024.")
    );

    o = s.taboption(
      "general",
      form.Flag,
      "redirect_lan_dns",
      _("Redirect LAN DNS"),
      _("Redirect DNS traffic on LAN interface to V2Ray before all other rules.")
    );

    o = s.taboption(
      "general",
      form.Flag,
      "redirect_dns",
      _("Redirect DNS"),
      _("Redirect DNS traffic to V2Ray.")
    );

    o = s.taboption(
      "general",
      form.Flag,
      "redirect_udp",
      _("Redirect UDP"),
      _("Redirect UDP traffic to V2Ray.")
    );

    o = s.taboption(
      "ipset",
      form.SectionValue,
      "__ipset__",
      form.GridSection,
      "ipset_list"
    );
    let ss = o.subsection;
    ss.anonymous = true;
    ss.addremove = true;
    ss.sortable = true;
    ss.nodescriptions = true;

    o = ss.option(form.Flag, "enabled", _("Enabled"));
    o.rmempty = false;
    o.editable = true;

    o = ss.option(form.Value, "set_name", _("Set Name"),
      _("The set which name starting with 'v2ray' will be deleted automatically. eg: 'v2ray_local_ignore'")
    );

    o = ss.option(form.ListValue, "set_net", _("Network"));
    o.value("ipv4");
    o.value("ipv6");
    o.default = "ipv4";

    o = ss.option(
      form.DynamicList,
      "site_list",
      _("Site List"),
      _(
        "Allow types: DOMAIN, IP, CIDR. eg: %s, %s, %s"
      ).format("www.google.com", "1.1.1.1", "192.168.0.0/16")
    );
    o.datatype = "string";
    o.modalonly = true;

    let o2;
    o2 = ss.option(form.ListValue, "site_file", _("Site File"),
       _("Site list and content in site file will all be imported into ipset")
    );
    o2.value("");
    fs.list("/etc/v2ray/")
      .then(function(files) {
        files.forEach(function (val) {
          if (val.name.match(/\.txt$/)) {
            o2.value(val.name);
          }
        });
      })
      .catch(function (e) {
        ui.addNotification(null, E("p", e.message));
      });
    o2.modalonly = true;
    o2.datatype = "file";

    o = ss.option(
      form.Value,
      "set_dns",
      _("Set DNS"),
      _(
        "DNS used for domain in ipset list, format: <code>ip#port</code>. eg: %s"
      ).format("8.8.8.8#53")
    );

    o.datatype = "string";
    o.modalonly = true;

    o = ss.option(
      form.ListValue,
      "set_position",
      _("Position"),
      _("The position and action in V2RAY_MARK chain:<br/> \
          * - (LAN DNS) : Redirect<br/> \
          2 - Ignore src : Direct<br/> \
          3 - Ignore dst : Direct<br/> \
          * - (DNS) : Redirect<br/> \
          5 - Proxy dst : Redirect<br/> \
          6 - Direct dst : Direct<br/> \
          * - (All) : Redirect")
    );
    o.value("src_ignore", "2 - Ignore src");
    o.value("dst_ignore", "3 - Ignore dst");
    o.value("dst_proxy",  "5 - Proxy dst");
    o.value("dst_direct", "6 - Direct dst");
    o.default = "dst_direct";
    o.widget = "select";
    o.editable = true;

    o = s.taboption(
      "update", 
      form.ListValue,
      "apnic_delegated_mirror",
      _("APNIC delegated mirror")
    );
    o.value("apnic", "APNIC");
    o.value("arin", "ARIN");
    o.value("ripe", "RIPE");
    o.value("iana", "IANA");
    o.default = "apnic";

    o = s.taboption("update", custom.ListStatusValue, "_chnroutelist", _("CHNRoute"));
    o.listtype = "chnroute";
    o.btntitle = _("Update");
    o.btnstyle = "apply";
    o.onupdate = L.bind(this.handleListUpdate, this);

    o = s.taboption("update", form.ListValue, "gfwlist_mirror", _("GFWList mirror"));
    o.value("github", "GitHub");
    o.value("gitlab", "GitLab");
    o.value("bitbucket", "Bitbucket");
    o.value("pagure", "Pagure");
    o.default = "github";

    o = s.taboption("update", custom.ListStatusValue, "_gfwlist", _("GFWList"));
    o.listtype = "gfwlist";
    o.btntitle = _("Update");
    o.btnstyle = "apply";
    o.onupdate = L.bind(this.handleListUpdate, this);

    return m.render();
  },
});
