var log = (typeof (console) != 'undefined' && (console != undefined) && console.log && (console.log != undefined))
    ? function (data) {
        console.log(data);
    }
    : function (data) { };
var AltLan = AltLan || {};
AltLan.Widget = AltLan.Widget || {};
AltLan.Widget;
var InlineWidgetHost = /** @class */ (function () {
    function InlineWidgetHost(containerElement, options) {
        this.initialized = false;
        this.containerElement = $("#" + containerElement);
        this.options = options;
        this.token = window.idToken || this.options.IdToken;
    }
    InlineWidgetHost.prototype.ensureWidgetInitialized = function () {
        var _this = this;
        this.widgetInitDeferred = $.Deferred();
        if (this.initialized) {
            this.widgetInitDeferred.resolve();
            return;
        }
        this.containerElement.empty();
        this.initialized = true;
        this.LoadCss(this.options.WidgetDomain + '/Content/css/' + this.options.WidgetId);
        var authTask = $.Deferred();
        if (typeof QA == 'undefined' || !QA.Identity || !QA.Identity.Authorized)
            authTask.resolve();
        else
            QA.Identity.registerTokenConsumer(function () {
                _this.token = window.idToken;
                authTask.resolve();
            });
        window.setTimeout(function () { return authTask.resolve(); }, 2000); //timeout
        var scriptsTask = $.Deferred();
        $.getScript(this.options.WidgetDomain + '/bundles/' + this.options.WidgetId, function () { return scriptsTask.resolve(); });
        var sessionId = this.generateGUID();
        var templatesTask = $.Deferred();
        $.get(this.options.WidgetDomain + '/Templates/' + this.options.WidgetId + '?id=' + sessionId).done(function (data) {
            $('<div style="height:0px; display: none"></div>')
                .append(data)
                .appendTo($('body'));
            templatesTask.resolve();
        });
        var self = this;
        $.when(scriptsTask, templatesTask, authTask).then(function () {
            _this.configureRequireJS();
            _this.requirePayWidget(["Widgets/StandAlone/" + _this.options.WidgetId, 'Services/Settings', 'Services/HttpClient', 'Services/PopupManager', 'knockout'], function (widgetModule, settings, httpClient, popupManagerModule, ko) {
                settings.apiBaseUrl = self.options.WidgetDomain;
                settings.Token = _this.token == 'undefined' ? null : _this.token;
                AltLan = AltLan || {};
                AltLan.Pay = AltLan.Pay || {};
                AltLan.Pay.Settings = settings;
                self.containerElement.append($('#PrimaryTemplate' + self.options.WidgetId).html());
                popupManagerModule.PopupManager = new popupManagerModule.PopupManagerClass(self);
                httpClient.Get(self.options.WidgetDomain + '/api/Widgets/' + self.options.WidgetId + '?id=' + sessionId)
                    .then(function (data) {
                    settings.SharedData = data.SharedData;
                    settings.RedirectLinks = data.RedirectLinks;
                    settings.QpDocuments = data.QpDocuments;
                    _this.Widget = new widgetModule[self.options.WidgetId](data, _this.options.ExtraOptions || {});
                    ko.cleanNode(self.containerElement[0]);
                    ko.applyBindings(_this.Widget, self.containerElement[0]);
                    self.widgetInitDeferred.resolve();
                });
            });
        });
        return this.widgetInitDeferred.promise();
    };
    InlineWidgetHost.prototype.show = function () {
        var _this = this;
        if ($("#SmallPayWidgetLoader").length == 0)
            this.containerElement.parent().append($('<div id="SmallPayWidgetLoader" style="position:relative;text-align:center;padding:25px 0;"><img src="' + this.options.WidgetUrl + '/Content/img/loading.gif" style="display:inline-block;" /></div>"'));
        $("#SmallPayWidgetLoader").show();
        return this.ensureWidgetInitialized().then(function () {
            _this.containerElement.show();
            $("#SmallPayWidgetLoader").hide();
        });
    };
    InlineWidgetHost.prototype.hide = function () {
        this.containerElement.hide();
    };
    InlineWidgetHost.prototype.close = function () {
        this.containerElement.hide();
    };
    InlineWidgetHost.prototype.generateGUID = function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    };
    InlineWidgetHost.prototype.LoadCss = function (path) {
        if (document.createStyleSheet) {
            try {
                document.createStyleSheet(path);
            }
            catch (e) { }
        }
        else {
            var css;
            css = document.createElement('link');
            css.rel = 'stylesheet';
            css.type = 'text/css';
            css.media = "all";
            css.href = path;
            document.getElementsByTagName("head")[0].appendChild(css);
        }
    };
    InlineWidgetHost.prototype.configureRequireJS = function () {
        var customRequire = null;
        if (typeof AltLanPay !== 'undefined') {
            customRequire = AltLanPay.require;
        }
        else
            customRequire = require;
        this.requirePayWidget = customRequire.config({
            baseUrl: this.options.WidgetDomain + "/Scripts/App",
            waitSeconds: 5,
            config: {
                text: {
                    useXhr: function (url, protocol, hostname, port) {
                        return true;
                    }
                }
            }
        });
    };
    InlineWidgetHost.prototype.showPopupInt = function (viewModel, viewId) {
        this.requirePayWidget(["require", 'Services/PopupManager', 'knockout'], function (req, popupManagerModule, ko) {
            QA.Beeline.Popup.setContent($('#' + viewId).html());
            viewModel.shared = viewModel.shared || {};
            viewModel.shared.submitFeedback = function (isSuccess, data) {
                popupManagerModule.PopupManager.PopupFeedback({ isSuccess: isSuccess, data: data });
                QA.Beeline.Popup.close();
                ko.cleanNode($("#commonPopup")[0]);
            };
            ko.cleanNode($("#commonPopup")[0]);
            ko.applyBindings(viewModel, $("#commonPopup")[0]);
            QA.Beeline.Popup.show();
            $(window).trigger('scroll'); //Я костыль
            return;
        });
    };
    InlineWidgetHost.prototype.showPopup = function (popup) {
        this.requirePayWidget(['Popups/' + popup.name, 'Services/PopupManager', 'knockout'], function (viewModelModule, popupManagerModule, ko) {
            QA.Beeline.Popup.setContent($('#' + popup.name).html());
            var viewModel = new viewModelModule.Popup(popup.params);
            viewModel.shared.submitFeedback = function (isSuccess, data) {
                popupManagerModule.PopupManager.PopupFeedback({ isSuccess: isSuccess, data: data });
                QA.Beeline.Popup.close();
                ko.cleanNode($("#commonPopup")[0]);
            };
            ko.cleanNode($("#commonPopup")[0]);
            ko.applyBindings(viewModel, $("#commonPopup")[0]);
            QA.Beeline.Popup.show();
            $(window).trigger('scroll'); //Я костыль
            return;
        });
    };
    InlineWidgetHost.prototype.showPopupInner = function (popup) {
        this.requirePayWidget(["require", 'Popups/' + popup.name, 'Services/PopupManager', 'knockout'], function (req, viewModelModule, popupManagerModule, ko) {
            var viewModel = new viewModelModule.Popup(popup.params);
            var innerPopup = document.getElementById('innerPopup');
            var showPopup = document.createElement('div');
            showPopup.innerHTML = $(document.getElementById(popup.name)).html();
            viewModel.shared.submitFeedback = function (isSuccess, data) {
                popupManagerModule.PopupManager.PopupFeedback({ isSuccess: isSuccess, data: data });
                innerPopup.removeChild(showPopup);
            };
            ko.applyBindings(viewModel, showPopup);
            innerPopup.appendChild(showPopup);
            return;
        });
    };
    InlineWidgetHost.prototype.receiveMessage = function (e, authTask) {
        try {
            if (e.origin.toUpperCase() == this.options.WidgetDomain.toUpperCase()) {
                var action = e.data.split('#')[0];
                var data = e.data.split('#')[1] || '';
                if (action == 'AuthResult') {
                    this.token = data;
                    authTask.resolve(data);
                }
            }
        }
        catch (e) { }
    };
    return InlineWidgetHost;
}());
//# sourceMappingURL=InlineWidgetHost.js.map