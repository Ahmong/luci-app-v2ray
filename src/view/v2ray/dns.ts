/**
 * @license
 * Copyright 2020 Xingwang Liao <kuoruan@gmail.com>
 *
 * Licensed to the public under the MIT License.
 */

"use strict";

"require form";
"require v2ray";
// "require view";

// @ts-ignore
return L.view.extend<SectionItem[]>({
  render: function () {
    const m = new form.Map(
      "v2ray",
      "%s - %s".format(_("V2Ray"), _("DNS")),
      _("Details: %s").format(
        '<a href="https://www.v2ray.com/en/configuration/dns.html#dnsobject" target="_blank">DnsObject</a>'
      )
    );

    const s = m.section(form.NamedSection, "main_dns", "dns");
    s.anonymous = true;
    s.addremove = false;

    s.tab("general", _("General Settings"));
    s.tab("server", _("DNS Server"));

    let o;

    o = s.taboption("general", form.Flag, "enabled", _("Enabled"));
    o.rmempty = false;

    o = s.taboption("general", form.Value, "tag", _("Tag"));

    o = s.taboption("general", form.Flag, "disable_cache", _("Disable Cache"),
      _(
        "Disable cache for DNS query."
      )
    );

    o = s.taboption("general", form.Flag, "disable_fallback", _("Disable Fallback"),
      _(
        "Disable the fallback query when none dns server matches normally."
      )
    );

    o = s.taboption(
      "general",
      form.Value,
      "client_ip",
      _("Client IP"),
      '<a href="https://icanhazip.com" target="_blank">%s</a>'.format(
        _("Get my public IP address")
      )
    );
    o.datatype = "ipaddr";

    o = s.taboption(
      "general",
      form.ListValue,
      "query_strategy",
      _("Query strategy")
    );
    o.value("");
    o.value("UseIP");
    o.value("UseIPv4");
    o.value("UseIPv6");

    o = s.taboption(
      "general",
      form.DynamicList,
      "hosts",
      _("Hosts"),
      _(
        "A list of static addresses, format: <code>domain|address</code>. eg: %s"
      ).format("google.com|127.0.0.1")
    );

    o = s.taboption(
      "server",
      form.SectionValue,
      "__server__",
      form.GridSection,
      "dns_server",
      "",
      _("Add DNS servers here")
    );
    let ss = o.subsection;
    ss.anonymous = true;
    ss.addremove = true;
    ss.nodescription = true;
    ss.sortable = true;

    o = ss.option(form.Flag, "enabled", _("Enabled"));
    o.rmempty = false;
    o.editable = true;

    o = ss.option(form.Value, "alias", _("Alias"));
    o.rmempty = false;

    o = ss.option(form.Value, "address", _("Address"));

    o = ss.option(form.Value, "port", _("Port"));
    o.datatype = "port";
    o.placeholder = "53";

    o = ss.option(form.DynamicList, "domains", _("Domains"));
    o.modalonly = true;

    o = ss.option(form.DynamicList, "expect_ips", _("Expect IPs"));
    o.modalonly = true;

    o = ss.option(form.Flag, "skip_fallback", _("Skip Fallback"));
    o.modalonly = true;

    return m.render();
  },
});
