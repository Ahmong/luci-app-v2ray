/**
 * @license
 * Copyright 2020 Xingwang Liao <kuoruan@gmail.com>
 *
 * Licensed to the public under the MIT License.
 */

"use strict";

"require form";
"require uci";
"require v2ray";
// "require view";

// @ts-ignore
return L.view.extend<SectionItem[][]>({
  render: function () {
    const m = new form.Map(
      "v2ray",
      "%s - %s".format(_("V2Ray"), _("Routing")),
      _("Details: %s").format(
        '<a href="https://www.v2ray.com/en/configuration/routing.html#routingobject" target="_blank">RoutingObject</a>'
      )
    );

    const s = m.section(form.NamedSection, "main_routing", "routing");
    s.anonymous = true;
    s.addremove = false;

    s.tab("general", _("General Settings"));
    s.tab("rules", _("Routing Rule"));
    s.tab("balancer", _("Routing Balancer"));

    let o;
    o = s.taboption("general", form.Flag, "enabled", _("Enabled"));

    o = s.taboption(
      "general",
      form.ListValue,
      "domain_strategy",
      _("Domain resolution strategy")
    );
    o.value("");
    o.value("AsIs");
    o.value("IPIfNonMatch");
    o.value("IPOnDemand");

    o = s.taboption("general", form.ListValue, "domain_matcher", _("Domain Matcher"));
    o.value("");
    o.value("linear", _("linear"));
    o.value("mph", _("mph"));

    o = s.taboption(
      "rules",
      form.SectionValue,
      "__rules__",
      form.GridSection,
      "routing_rule",
      "",
      _("Add routing rules here")
    );
    let ss = o.subsection;
    ss.anonymous = true;
    ss.addremove = true;
    ss.sortable = true;
    ss.nodescription = true;

    o = ss.option(form.Flag, "enabled", _("Enabled"));
    o.rmempty = false;
    o.editable = true;

    o = ss.option(form.Value, "alias", _("Alias"));
    o.rmempty = false;

    o = ss.option(form.ListValue, "type", _("Type"));
    o.value("field");
    o.modalonly = true;

    o = ss.option(form.DynamicList, "domain", _("Domain"));
    o.modalonly = true;

    o = ss.option(form.ListValue, "domain_matcher", _("Domain Matcher"));
    o.value("");
    o.value("linear", _("linear"));
    o.value("mph", _("mph"));
    o.modalonly = true;

    o = ss.option(form.DynamicList, "ip", _("IP"));
    o.modalonly = true;

    o = ss.option(form.DynamicList, "port", _("Port"));
    o.modalonly = true;
    o.datatype = "or(port, portrange)";

    o = ss.option(form.MultiValue, "network", _("Network"));
    o.value("tcp");
    o.value("udp");

    o = ss.option(form.DynamicList, "source", _("Source"));
    o.modalonly = true;

    o = ss.option(form.DynamicList, "user", _("User"));
    o.modalonly = true;

    o = ss.option(form.DynamicList, "inbound_tag", _("Inbound tag"));

    o = ss.option(form.MultiValue, "protocol", _("Protocol"));
    o.modalonly = true;
    o.value("http");
    o.value("tls");
    o.value("bittorrent");

    o = ss.option(form.Value, "attrs", _("Attrs"));
    o.modalonly = true;

    o = ss.option(form.Value, "outbound_tag", _("Outbound tag"));

    o = ss.option(form.Value, "balancer_tag", _("Balancer tag"));
    o.modalonly = true;
    o.depends("outbound_tag", "");

    o = s.taboption(
      "balancer",
      form.SectionValue,
      "__balancer__",
      form.TableSection,
      "routing_balancer",
      "",
      _("Add routing balancers here")
    );
    ss = o.subsection;
    ss.anonymous = true;
    ss.addremove = true;

    o = ss.option(form.Flag, "enabled", _("Enabled"));
    o.rmempty = false;
    o.editable = true;

    o = ss.option(form.Value, "tag", _("Tag"));
    o.rmempty = false;

    o = ss.option(form.DynamicList, "selector", _("Selector"));
    o.datatype = "string";

    return m.render();
  },
});
