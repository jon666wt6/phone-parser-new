window.advcake_attempt = window.advcake_attempt || 0;
try {

var advcake_helper = {
    uid: function () {
        return Math.random().toString(36).slice(2);
    },
    guid: function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 65536).toString(16).substring(1);
        }
        return s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4();
    },
    get_q: function (e) {
        var t = window.location.search;
        return t = t.match(new RegExp(e + "=([^&=]+)")), t ? t[1] : "";
    },
    queryBuilder: function (data) {
        var query = [];
        for (var key in data) {
            query.push(key + '=' + data[key]);
        }
        return query.join('&');
    },
    getUrlElement: function (url) {
        var a = document.createElement('a');
        a.href = url;
        return a;
    },
    setCookie: function (e, t, n) {
        n = n || {};
        var o = n.expires;
        n.SameSite = 'None';
        n.Secure = true;
        if ("number" === typeof o && o) {
            var r = new Date;
            r.setTime(r.getTime() + 1000 * o), o = n.expires = r;
        }
        o && o.toUTCString && (n.expires = o.toUTCString()), t = encodeURIComponent(t);
        var i = e + "=" + t;
        for (var a in n) {
            i += "; " + a;
            var c = n[a];
            c !== !0 && (i += "=" + c);
        }
        document.cookie = i;
    },
    getCookie: function (e) {
        var t = document.cookie.match(new RegExp("(?:^|; )" + e.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)"));
        return t ? decodeURIComponent(t[1]) : void 0;
    },
    getDate: function() {
        var date = new Date();
        return date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2) + ' ' + ('0' + (date.getHours())).slice(-2) + ':' + ('0' + (date.getMinutes())).slice(-2) + ':' + ('0' + (date.getSeconds())).slice(-2);
    },
    cleanString: function (string) {
        if (string === undefined || string === null) {
            return '';
        }
        string = string.replace(/['"]/g, '');
        return string.replace(/&quot;/g, '');
    },
    post: function(url, data) {
        var async = true;
        var method = 'POST';
        var XHR = ("onload" in new XMLHttpRequest()) ? XMLHttpRequest : XDomainRequest;
        var xhr = new XHR();

        var body = data;
        var multipart = false;

        if (typeof data === 'object') {
            var boundary = String(Math.random()).slice(2);
            var boundaryMiddle = '--' + boundary + '\r\n';
            var boundaryLast = '--' + boundary + '--\r\n';

            var bodyParts = ['\r\n'];
            for (var key in data) {
                if (!data.hasOwnProperty(key)) continue;
                bodyParts.push('Content-Disposition: form-data; name="' + key + '"\r\n\r\n' + data[key] + '\r\n');
            }
            multipart = true;
            body = bodyParts.join(boundaryMiddle) + boundaryLast;
        }

        if ("withCredentials" in xhr) {
            try {
                xhr.open(method, url, async);
                if (multipart) {
                    xhr.setRequestHeader('Content-Type', 'multipart/form-data; boundary=' + boundary);
                }
            } catch (x) {
                return false;
            }
            xhr.send(body);
            xhr.onreadystatechange = function () {
                return 4 === xhr.readyState;
            };
        }
    },
    get: function (url, data) {
        var async = true;
        var method = 'GET';
        var xhr = new XMLHttpRequest();
        if ("withCredentials" in xhr) {
            try {
                xhr.open(method, url + '?' + advcake_helper.queryBuilder(data), async);
            } catch (x) {
                return false;
            }
            xhr.send();
            xhr.onreadystatechange = function () {
                return 4 === xhr.readyState;
            };
        }
    },
    pixel: function (url, data) {
        (new Image()).src = url + '?' + advcake_helper.queryBuilder(data);
    }
};

var advcake_int = {
    domain: ".beeline.ru",

    hitUrl: "https://hit.bee-cake.ru/beelinerushop/",
            cryptHitUrl: "https://hitcrypt.bee-cake.ru/",
        postbackUrl: 'https://api.bee-cake.ru/postback/beelinerushop',

    utm_source: "utm_source",
    utm_partner: "utm_campaign",
    utm_webmaster: "utm_content",
    utm_params: "advcake_params",

    cookie_partner: "advcake_utm_partner",
    cookie_webmaster: "advcake_utm_webmaster",
    cookie_params: "advcake_click_id",

    cookie_session_id: "advcake_session_id",
    cookie_track_id: "advcake_track_id",
    cookie_track_url: "advcake_track_url",
    cookie_lifetime: 2592000,

    vars: {
        page_hash: ''
    },

    init: function () {

                advcake_int.checkDomain();
        
        advcake_int.setPageHash();

                advcake_int.setTrackId();
        
        advcake_int.setSessionId();

        if (advcake_int.checkCommon()) {
            advcake_int.setTrackUrl();
            advcake_int.setPartner();
            advcake_int.setWebmaster();
            advcake_int.setClickId();
        }
                    advcake_int.setCryptTrackUrl();
            },

    checkDomain: function() {
        if (window.advcake_attempt < 5 && location.host && location.host.indexOf(advcake_int.domain.substring(1)) === -1) {
            window.advcake_attempt++;
            throw 'incorrect_domain';
        }
    },

    checkCommon: function () {
                    return advcake_helper.get_q(advcake_int.utm_source) !== "" || advcake_helper.get_q('gclid') || advcake_helper.get_q('yclid');
            },

    checkCake: function () {
                    return advcake_helper.get_q(advcake_int.utm_source) === 'advcake' || advcake_helper.get_q('advcake');
            },

    setPageHash: function () {
        advcake_int.vars.page_hash = advcake_helper.uid();
    },

    setSessionId: function () {
        if (advcake_int.getSessionId() === undefined) {
            advcake_helper.setCookie(advcake_int.cookie_session_id, advcake_helper.guid(), {
                expires: advcake_int.cookie_lifetime,
                domain: advcake_int.domain,
                path: "/"
            });
        }
    },
    getSessionId: function () {
        return advcake_helper.getCookie(advcake_int.cookie_session_id);
    },


    setTrackId: function () {
        if (advcake_int.checkCommon() || advcake_int.getTrackId() === '') {
            advcake_helper.setCookie(advcake_int.cookie_track_id, advcake_helper.guid(), {
                expires: advcake_int.cookie_lifetime,
                domain: advcake_int.domain,
                path: "/"
            });
                        advcake_helper.setCookie(advcake_int.cookie_track_url, '', {
                expires: "-1",
                domain: advcake_int.domain,
                path: "/"
            });
                    }
    },
    getTrackId: function () {
                    return advcake_helper.getCookie(advcake_int.cookie_track_id) || '';
            },


    setWebmaster: function () {
        advcake_helper.setCookie(advcake_int.cookie_webmaster, advcake_int.parseWebmaster(), {
            expires: advcake_int.cookie_lifetime,
            domain: advcake_int.domain,
            path: "/"
        });
    },
    getWebmaster: function () {
        return advcake_helper.getCookie(advcake_int.cookie_webmaster) || '';
    },
    parseWebmaster: function () {
                    return advcake_helper.get_q(advcake_int.utm_webmaster);
            },


    setPartner: function () {
        advcake_helper.setCookie(advcake_int.cookie_partner, advcake_int.parsePartner(), {
            expires: advcake_int.cookie_lifetime,
            domain: advcake_int.domain,
            path: "/"
        });
    },
    getPartner: function () {
        return advcake_helper.getCookie(advcake_int.cookie_partner) || '';
    },
    parsePartner: function () {
                    return advcake_helper.get_q(advcake_int.utm_partner);
            },


    setClickId: function () {
        advcake_helper.setCookie(advcake_int.cookie_params, advcake_int.parseClickId(), {
            expires: advcake_int.cookie_lifetime,
            domain: advcake_int.domain,
            path: "/"
        });
    },
    getClickId: function () {
        return advcake_helper.getCookie(advcake_int.cookie_params) || '';
    },
    parseClickId: function () {
                    return advcake_helper.get_q(advcake_int.utm_params);
            },


    setTrackUrl: function () {
                    advcake_helper.setCookie(advcake_int.cookie_track_url, '!' + advcake_int.cryptText(location.href, 'advcake'), {
                expires: advcake_int.cookie_lifetime,
                domain: advcake_int.domain,
                path: "/"
            });
            },
    getTrackUrl: function (encode) {
        encode = encode || true;
        var url = advcake_helper.getCookie(advcake_int.cookie_track_url) || '';
        return encode ? encodeURIComponent(url) : url;
    },
        setCryptTrackUrl: function (){
        var xhr = new XMLHttpRequest();
        xhr.timeout = 15000;

        try {
            xhr.onreadystatechange = function () {
                try {
                    if (xhr.readyState === XMLHttpRequest.DONE) {
                        const status = xhr.status;
                        if (status >= 200 && status < 400) {
                            var cryptUrl = JSON.parse(xhr.responseText).result || null;
                            if (cryptUrl) {
                                advcake_helper.setCookie(advcake_int.cookie_track_url, cryptUrl, {
                                    expires: advcake_int.cookie_lifetime,
                                    domain: advcake_int.domain,
                                    path: "/"
                                });
                            }
                        }
                    }
                } catch (x) {
                }
            };

            xhr.open('POST', advcake_int.cryptHitUrl, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify({
                "url": location.href,
                "track": advcake_helper.getCookie(advcake_int.cookie_track_url) || ""
            }));
        } catch (x) {
        }
    },
    cryptText: function (str, key) {
        let encoded = '';
        let keyPhrase = key;

        while (keyPhrase.length < str.length){
            keyPhrase = keyPhrase.repeat(2);
        }

        for (let i = 0; i < str.length; i++) {
            const charCode = str.charCodeAt(i) ^ keyPhrase.charCodeAt(i);
            encoded += String.fromCharCode(charCode);
        }
        return btoa(encoded);
    },
        getQuerySource: function () {
                return advcake_helper.get_q(advcake_int.utm_source);
            },
    getQueryMedium: function () {
        return advcake_helper.get_q("utm_medium");
    },
    getReferrer: function (encode) {
        encode = encode || true;
        return encode ? encodeURIComponent(document.referrer) : document.referrer;
    },
    isIframe: function () {
        return window !== window.top ? 1 : 0;
    },
    getIframeLand: function (encode) {
        encode = encode || true;
        var iframe_land = '';
        try {
            if (advcake_int.isIframe()) { iframe_land = window.top.location.href; }
        } catch (e) {}
        return encode ? encodeURIComponent(iframe_land) : iframe_land;
    },
    getLand: function (encode) {
        encode = encode || true;
        return encode ? encodeURIComponent(location.href) : location.href;
    },

    sendHit: function () {
        
        var preparedRules = (typeof rules === 'undefined') ? [] : rules;
        var urlPath = window.location.pathname.replace(/\/{2,}/g, '/');

        var allowed = preparedRules.length === 0;

        var prepareRegexp = function (string) {
            return new RegExp(
                '^' + string.replace(/[|\\{}()[\]^$+*?.\/]/g, '\\$&').replace(/-/g, '\\x2d') + '($|\\/|\\?|\\#)'
            );
        };

        var match = function (path, elem) {
            if (!(elem instanceof RegExp)) {
                elem = prepareRegexp(elem);
            }

            return elem.test(path);
        }

        for (var element of preparedRules) {
            if (match(urlPath, element[1])) {
                allowed = element[0];
                break;
            }
        }

        if (!allowed) {
            return;
        }

        advcake_helper.pixel(advcake_int.hitUrl, {
            "sid": advcake_int.getSessionId(),
            "t_tid": advcake_int.getTrackId(),
            "t_dp": advcake_int.getClickId(),
            "wid": advcake_int.getWebmaster(),
            "par": advcake_int.getPartner(),
            "ref": advcake_int.getReferrer().substr(0, 1350),
            "t_t": advcake_int.getQueryMedium(),
            "t_if": advcake_int.isIframe(),
            "t_s": advcake_int.getQuerySource(),
            "if_p": advcake_int.getIframeLand(),
            "ih": innerHeight,
            "iw": innerWidth,
            "s_w": screen.width,
            "s_h": screen.height,
            "land": advcake_int.getLand().substr(0, 1350)
        });
    }
};

advcake_int.init();
advcake_int.sendHit();


window.advcakeCorrection = function (data) {
    
if (typeof data !== 'undefined' && typeof data.pageType !== 'undefined') {
    data.pageType = parseInt(data.pageType);
    data.user = data.user || {};
    data.user.type = data.user.type || '';
    data.user.email = data.user.email || '';
    switch (data.pageType) {
        case 1:
            break;
        case 2:
            data.currentCategory = data.currentCategory || {};
            break;
        case 3:
            data.products = data.products || [];
            data.currentCategory = data.currentCategory || {};
            break;
        case 4:
            data.basketProducts = data.basketProducts || [];
            break;
        case 5:
            data.basketProducts = data.basketProducts || [];
            break;
        case 6:
            data.orderInfo = data.orderInfo || {};
            data.orderInfo.coupon = data.orderInfo.coupon || '';
            data.orderInfo.totalPrice = data.orderInfo.totalPrice || 0;
            data.basketProducts = data.basketProducts || [];
            break;
        case 7:
            data.products = data.products || [];
            data.basketProducts = data.basketProducts || [];
            break;
    }
}

    return data;
};

window.advcakeRetarget = function (data) {
    try {
        switch (parseInt(data.pageType)) {
            case 1: //main
                window.APRT_DATA = {pageType: 1};
                break;
            case 2: //Product Page
                window.APRT_DATA = {pageType: 2, currentProduct: data.currentProduct, currentCategory: data.currentCategory};
                break;
            case 3: //Catalog Page
                window.APRT_DATA = {pageType: 3, currentCategory: data.currentCategory};
                break;
            case 4: //Basket Page
                window.APRT_DATA = {pageType: 4, basketProducts: data.basketProducts};
                break;
            case 5: //Order Page
                window.APRT_DATA = {pageType: 5, basketProducts: data.basketProducts};
                break;
            case 6: //Thanks for order
                window.APRT_DATA = {pageType: 6, purchasedProducts: data.basketProducts, orderInfo: data.orderInfo};
                break;
            default: // nothing
                window.APRT_DATA = {pageType: 0};
                break;
        }
        (function (w, d) {
            try {
                var el = 'getElementsByTagName', rs = 'readyState';
                if (d[rs] !== 'interactive' && d[rs] !== 'complete') {
                    var c = arguments.callee;
                    return setTimeout(function () {
                        c(w, d)
                    }, 100);
                }
                var s = d.createElement('script');
                s.type = 'text/javascript';
                s.async = s.defer = true;
                s.src = '//aprtx.com/code/moskva.beeline/';
                var p = d[el]('body')[0] || d[el]('head')[0];
                if (p) p.appendChild(s);
            } catch (x) {
                if (w.console) w.console.log(x);
            }
        })(window, document);
    } catch (e) {}
    
    (function(){
        var s = document.createElement("script");
        s.async = true;
        s.src = (document.location.protocol === "https:" ? "https:" : "http:") + "//static.indoleads.com/js/platform/container_v2.min.js";
        var a = document.getElementsByTagName("script")[0];
        a.parentNode.insertBefore(s, a);
    
        window.INDOLEADS_LIB = window.INDOLEADS_LIB || [];
        window.INDOLEADS_LIB.push({
            offer_id: 7734,
            network: "https://static.indoleads.com"
        });
    })();
    
    try {
        if (!window.gdeslon_q || window.gdeslon_q instanceof Array) {
            var hasPerformance = "undefined" !== typeof performance && "function" === typeof performance.now;
            var perf = hasPerformance ? performance.now() : null;
            var oldQueue = window.gdeslon_q || [];
            window.gdeslon_q = function () {
                var _exceptions = [], _state = {}, appendScript = function (url) {
                    var gss = document.createElement("script");
                    gss.type = "text/javascript";
                    gss.async = true;
                    gss.src = url;
                    var s = document.getElementsByTagName("script")[0];
                    s.parentNode.insertBefore(gss, s)
                }, serializeObject = function (obj) {
                    return Object.keys(obj).map(function (key) {
                        return encodeURIComponent(key) + "=" + encodeURIComponent(obj[key])
                    }).join("&")
                }, deserializeObject = function (str, pairsSeparator, keyValueSeparator) {
                    var result = {}, pairs, pair, key, value, i, l;
                    if (!keyValueSeparator) {
                        keyValueSeparator = "="
                    }
                    if (!str) {
                        return result
                    }
                    pairs = str.split(pairsSeparator);
                    for (i = 0, l = pairs.length; i < l; i++) {
                        pair = pairs[i].replace(/^\s+|\s+$/g, "").split(keyValueSeparator);
                        try {
                            key = decodeURIComponent(pair[0]);
                            value = decodeURIComponent(pair[1]);
                            result[key] = value
                        } catch (e) {
                            console.log(e.message)
                        }
                    }
                    return result
                }, location = function () {
                    return document.location
                }(), domain = function () {
                    var domain = location.hostname || location.host.split(":")[0];
                    var domainParts = domain.split(".");
                    var l = domainParts.length;
                    if (l > 1) {
                        domain = domainParts[l - 2] + "." + domainParts[l - 1]
                    }
                    return domain
                }(), queryParams = function () {
                    return deserializeObject(location.search.slice(1), "&")
                }(), cookieTtl = function () {
                    var cookieTtl = parseInt(queryParams._gs_cttl, 10);
                    if (!cookieTtl || isNaN(cookieTtl)) {
                        cookieTtl = 180
                    }
                    return cookieTtl
                }(), writeCookie = function (name, value, ttlSeconds) {
                    if (!(name && value)) {
                        return
                    }
                    value = encodeURIComponent(value);
                    var ttl = ttlSeconds || cookieTtl * 24 * 60 * 60;
                    var date = new Date;
                    date.setTime(date.getTime() + ttl * 1e3);
                    var expires = "; expires=" + date.toUTCString();
                    var domainParam = "domain=" + domain + "; ";
                    document.cookie = name + "=" + value + expires + "; " + domainParam + "path=/;"
                }, cookies = function (key) {
                    return deserializeObject(document.cookie, ";")[key]
                }, token = function () {
                    return cookies("gdeslon.ru.__arc_token")
                }, affiliate_id = function () {
                    return cookies("gdeslon.ru.__arc_aid")
                }, track_domain = function () {
                    return cookies("gdeslon.ru.__arc_domain") || "gdeslon.ru"
                }, pixel_domain = function () {
                    return cookies("gdeslon.ru.__arc_gsp_domain") || "gdeslon.ru"
                }, gs_uid = function () {
                    return cookies("gdeslon.ru.user_id")
                }, processor = function () {
                    _state.pushStartedAt = Date.now();
                    var pixel = [];
                    var track = [];
                    if (arguments.length === 0) {
                        return
                    }
                    var obj = arguments[0];
                    var shouldInvokeTrack = false;
                    Object.keys(obj).forEach(function (key) {
                        var val = obj[key];
                        var same = "";
                        switch (key) {
                            case"page_type":
                                pixel.mode = val;
                                break;
                            case"merchant_id":
                                pixel.mid = val;
                                track.merchant_id = val;
                                break;
                            case"category_id":
                                pixel.cat_id = val;
                                track.cat_id = val;
                                break;
                            case"products":
                                if (!val || val.constructor !== Array) break;
                                same = val.map(function (l) {
                                    var repeats = [];
                                    for (var i = 0; i < parseFloat(l.quantity); i++) {
                                        repeats.push(l.id + ":" + parseFloat(l.price))
                                    }
                                    return repeats.join(",")
                                });
                                pixel.codes = same;
                                track.codes = same;
                                break;
                            case"user_id":
                                pixel.muid = val;
                                track.muid = val;
                                break;
                            default:
                                pixel[key] = val;
                                track[key] = val;
                                break
                        }
                    });
                    if (obj.page_type === "thanks") {
                        if (obj.hasOwnProperty("deduplication")) {
                            if (Object.prototype.toString.call(obj.deduplication) === "[object String]") {
                                var trueArr = ["gdeslon_cpa", "gdeslon", "gde slon", "", "undefined", "null", "true", "1"];
                                shouldInvokeTrack = trueArr.indexOf(obj.deduplication.toLowerCase()) > -1
                            } else {
                                shouldInvokeTrack = true
                            }
                        } else {
                            shouldInvokeTrack = true
                        }
                    }
                    pixel.perf = parseInt(perf, 10);
                    track.perf = pixel.perf;
                    pixel.gs_uid = gs_uid();
                    track.gs_uid = pixel.gs_uid;
                    pixel._t = Date.now();
                    track._t = Date.now();
                    pixel.source = window.location.href;
                    var url = "//" + pixel_domain() + "/gsp.js?" + serializeObject(pixel);
                    appendScript(url);
                    if (shouldInvokeTrack) {
                        _state.shouldInvokeTrack = true;
                        track.affiliate_id = affiliate_id();
                        track.token = token();
                        url = "//" + track_domain() + "/purchase.js?" + serializeObject(track);
                        appendScript(url)
                    } else {
                        _state.shouldInvokeTrack = false
                    }
                    _state.pushFinishedAt = Date.now()
                }, _push = function () {
                    try {
                        return processor.apply(null, arguments)
                    } catch (c) {
                        _exceptions.push(c);
                        var url = "https://gdeslon.ru/error.js?" + serializeObject({message: c.message});
                        appendScript(url)
                    }
                };
                if (queryParams.gsaid) {
                    writeCookie("gdeslon.ru.__arc_aid", queryParams.gsaid)
                }
                if (queryParams._gs_ref) {
                    writeCookie("gdeslon.ru.__arc_token", queryParams._gs_ref)
                }
                if (queryParams._gs_vm) {
                    writeCookie("gdeslon.ru.__arc_domain", queryParams._gs_vm)
                }
                if (queryParams._gs_ld) {
                    writeCookie("gdeslon.ru.__arc_gsp_domain", queryParams._gs_ld)
                }
                return {push: _push, exceptions: _exceptions, state: _state}
            }();
            window.gdeslon_q.push.apply(null, oldQueue);
        }
    
        var gdeslon_data = {
            page_type: "other",
            merchant_id: 111211,
            order_id: "",
            category_id: "",
            products: [],
            deduplication: advcake_int.getPartner()
        };
        switch (data.pageType) {
            case 1: //main
                gdeslon_data.page_type = 'main';
                break;
            case 2: //Product Page
                gdeslon_data.page_type = 'card';
                gdeslon_data.category_id = data.currentCategory.id || "";
                gdeslon_data.products = [{id: data.currentProduct.id, price: data.currentProduct.price, quantity: 1 }];
                break;
            case 3: //Catalog Page
                gdeslon_data.page_type = 'list';
                gdeslon_data.category_id = data.currentCategory.id || "";
                gdeslon_data.products = data.products.map(function (prd) {
                    prd.price = prd.price || 0;
                    return {id: prd.id, price: prd.price, quantity: 1};
                });
                break;
            case 4:
            case 5: //Basket Page
                gdeslon_data.page_type = 'basket';
                gdeslon_data.products = data.basketProducts.map(function (prd) {
                    return {id: prd.id, price: prd.price, quantity: prd.quantity};
                });
                break;
            case 6: //Basket Page
                gdeslon_data.page_type = 'thanks';
                gdeslon_data.products = data.basketProducts.map(function (prd) {
                    return {id: prd.id, price: prd.price, quantity: prd.quantity};
                });
                gdeslon_data.order_id = data.orderInfo.id;
                break;
            default: // nothing
                break;
        }
        if (gdeslon_data.hasOwnProperty('page_type')) {
            window.gdeslon_q = window.gdeslon_q || [];
            window.gdeslon_q.push(gdeslon_data);
        }
    } catch (e) {
    }
};


window.advcakeOrder = function (data) {
    
try {
    if (parseInt(data.pageType) === 6) {
        data.basketProducts.forEach(function (item) {
            item.name = advcake_helper.cleanString(item.name);
        });
        var order = {
            id: data.orderInfo.id,
            totalPrice: data.orderInfo.totalPrice,
            coupon: data.orderInfo.coupon,
            trackId: advcake_int.getTrackId(),
            url: advcake_int.getTrackUrl(),
            localTime: advcake_helper.getDate(),
            clientType: data.user.type,
            email: data.user.email,
            basketProducts: JSON.stringify(data.basketProducts),
            dataAdvcake: JSON.stringify(data)
        };

        if (data.orderInfo.hasOwnProperty('tax')) {
            order.tax = data.orderInfo.tax;
        }
        if (data.orderInfo.hasOwnProperty('shipping')) {
            order.shipping = data.orderInfo.shipping;
        }

        advcake_helper.post(advcake_int.postbackUrl, order);
    }
} catch (e) {
}
};


window.advcakeEvents = function (data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return;
    }

    if (typeof window.advcakeCorrection === "function") {
        data = window.advcakeCorrection(data);
    }
    if (typeof data !== 'undefined') {
                if (typeof window.advcakeOrder === "function") {
            window.advcakeOrder(data);
        }
        
                if (typeof window.advcakeRetarget === "function") {
            window.advcakeRetarget(data);
        }
            }
};

window.advcake_data = window.advcake_data || [];


if (window.advcake_data_push_flag !== true) {
    window.advcake_data_push_flag = true;
    var cakePush = window.advcake_data.push;
    window.advcake_data.push = function (data) {
        var a = cakePush.apply(this, arguments);
        window.advcakeEvents(data);
        return a;
    };
}

if (typeof window.advcake_data === 'object' && typeof window.advcake_data.forEach !== 'undefined') {
    window.advcake_data.forEach(function (data) {
        if (typeof data === 'object') {
            window.advcakeEvents(data);
        }
    });
}

} catch (e) {
    if (e === 'incorrect_domain') {
        (function ( a ) {
            var b = a.createElement("script");
            b.async = 1;
            b.src = "//code.bee-cake.ru/?r=" + Math.random();
            a=a.getElementsByTagName("script")[0];
            a.parentNode.insertBefore(b,a)
        })(document);
    }
}
